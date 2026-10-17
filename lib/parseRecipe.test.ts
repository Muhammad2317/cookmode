// Synthetic fixtures modelled on the JSON-LD *structures* real sites emit
// (Yoast/WP Recipe Maker @graph, top-level arrays, HowToSection lists, etc.).
// No real page content is copied here.

import { describe, expect, it } from "vitest";
import { parseRecipe } from "./parseRecipe";

const PAGE = "https://www.example-recipes.test/recipes/lemon-pasta/";

const parse = (
  blocks: unknown[],
  meta?: Parameters<typeof parseRecipe>[0]["meta"],
) =>
  parseRecipe({
    jsonLd: blocks.map((b) => (typeof b === "string" ? b : JSON.stringify(b))),
    pageUrl: PAGE,
    meta,
  });

const without = (obj: Record<string, unknown>, key: string) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));

const minimal = {
  "@context": "https://schema.org",
  "@type": "Recipe",
  name: "Lemon Pasta",
  recipeIngredient: ["200g spaghetti", "1 lemon"],
  recipeInstructions: [{ "@type": "HowToStep", text: "Boil the pasta." }],
};

describe("parseRecipe — locating the Recipe node", () => {
  it("finds a top-level Recipe", () => {
    expect(parse([minimal])?.title).toBe("Lemon Pasta");
  });

  it("finds a Recipe inside a top-level array", () => {
    expect(
      parse([[{ "@type": "WebSite", name: "Site" }, minimal]])?.title,
    ).toBe("Lemon Pasta");
  });

  it("finds a Recipe inside @graph", () => {
    const block = {
      "@context": "https://schema.org",
      "@graph": [{ "@type": "WebPage", "@id": `${PAGE}#webpage` }, minimal],
    };
    expect(parse([block])?.title).toBe("Lemon Pasta");
  });

  it("finds a Recipe when @type is an array", () => {
    expect(
      parse([{ ...minimal, "@type": ["Recipe", "NewsArticle"] }])?.title,
    ).toBe("Lemon Pasta");
  });

  it("finds a Recipe nested under mainEntity", () => {
    expect(parse([{ "@type": "WebPage", mainEntity: minimal }])?.title).toBe(
      "Lemon Pasta",
    );
  });

  it("accepts schema.org-prefixed type names", () => {
    expect(
      parse([{ ...minimal, "@type": "http://schema.org/Recipe" }])?.title,
    ).toBe("Lemon Pasta");
  });

  it("searches across multiple blocks and skips broken ones", () => {
    expect(
      parse(["{ broken json", { "@type": "Organization", name: "X" }, minimal])
        ?.title,
    ).toBe("Lemon Pasta");
  });

  it("prefers a Recipe with content over an empty stub", () => {
    const stub = { "@type": "Recipe", name: "Stub" };
    expect(parse([stub, minimal])?.title).toBe("Lemon Pasta");
  });

  it("parses messy JSON (trailing commas, raw newlines)", () => {
    const messy = `{
      "@type": "Recipe",
      "name": "Messy
      Soup",
      "recipeIngredient": ["1 onion", "2 carrots",],
      "recipeInstructions": "Chop everything.\\nSimmer.",
    }`;
    const recipe = parse([messy]);
    expect(recipe?.title).toBe("Messy Soup");
    expect(recipe?.ingredients).toEqual(["1 onion", "2 carrots"]);
  });

  it("returns null when there is no Recipe", () => {
    expect(parse([{ "@type": "Article", headline: "News" }])).toBeNull();
    expect(parse([])).toBeNull();
  });

  it("returns null when the Recipe has neither ingredients nor steps", () => {
    expect(parse([{ "@type": "Recipe", name: "Empty" }])).toBeNull();
  });
});

describe("parseRecipe — authors", () => {
  const withAuthor = (author: unknown) =>
    parse([{ ...minimal, author }])?.authors;

  it("handles a string", () =>
    expect(withAuthor("Jane Cook")).toEqual(["Jane Cook"]));
  it("handles a Person", () =>
    expect(withAuthor({ "@type": "Person", name: "Jane Cook" })).toEqual([
      "Jane Cook",
    ]));
  it("handles an Organization", () =>
    expect(
      withAuthor({ "@type": "Organization", name: "Test Kitchen" }),
    ).toEqual(["Test Kitchen"]));
  it("handles an array, deduplicating", () =>
    expect(
      withAuthor([{ "@type": "Person", name: "A" }, "B", { name: "A" }]),
    ).toEqual(["A", "B"]));
  it("strips a leading 'By'", () =>
    expect(withAuthor("By Jane Cook")).toEqual(["Jane Cook"]));

  it("resolves @id references to Person nodes in @graph", () => {
    const block = {
      "@graph": [
        {
          "@type": "Person",
          "@id": "https://x.test/#/person/1",
          name: "Graph Author",
        },
        { ...minimal, author: { "@id": "https://x.test/#/person/1" } },
      ],
    };
    expect(parse([block])?.authors).toEqual(["Graph Author"]);
  });

  it("falls back to the page's meta author", () => {
    expect(parse([minimal], { author: "Meta Author" })?.authors).toEqual([
      "Meta Author",
    ]);
  });

  it("returns an empty list when unknown", () => {
    expect(parse([minimal])?.authors).toEqual([]);
  });
});

describe("parseRecipe — image", () => {
  const withImage = (image: unknown, meta?: { image?: string }) =>
    parse([{ ...minimal, image }], meta)?.image;

  it("handles a string", () =>
    expect(withImage("https://cdn.test/a.jpg")).toBe("https://cdn.test/a.jpg"));
  it("handles an ImageObject", () =>
    expect(
      withImage({ "@type": "ImageObject", url: "https://cdn.test/b.jpg" }),
    ).toBe("https://cdn.test/b.jpg"));
  it("uses contentUrl when url is missing", () =>
    expect(
      withImage({
        "@type": "ImageObject",
        contentUrl: "https://cdn.test/c.jpg",
      }),
    ).toBe("https://cdn.test/c.jpg"));
  it("takes the first of an array of strings", () =>
    expect(
      withImage(["https://cdn.test/1x1.jpg", "https://cdn.test/4x3.jpg"]),
    ).toBe("https://cdn.test/1x1.jpg"));
  it("picks the largest ImageObject when sizes are known", () =>
    expect(
      withImage([
        { url: "https://cdn.test/small.jpg", width: 300, height: 300 },
        { url: "https://cdn.test/big.jpg", width: 1200, height: 800 },
      ]),
    ).toBe("https://cdn.test/big.jpg"));
  it("resolves relative URLs against the page", () =>
    expect(withImage("/img/pasta.jpg")).toBe(
      "https://www.example-recipes.test/img/pasta.jpg",
    ));
  it("resolves @id image references", () => {
    const block = {
      "@graph": [
        {
          "@type": "ImageObject",
          "@id": "#img",
          url: "https://cdn.test/ref.jpg",
        },
        { ...minimal, image: { "@id": "#img" } },
      ],
    };
    expect(parse([block])?.image).toBe("https://cdn.test/ref.jpg");
  });
  it("falls back to og:image", () =>
    expect(withImage(undefined, { image: "https://cdn.test/og.jpg" })).toBe(
      "https://cdn.test/og.jpg",
    ));
  it("rejects non-http schemes", () =>
    expect(withImage("javascript:alert(1)")).toBeNull());
});

describe("parseRecipe — yield", () => {
  const withYield = (recipeYield: unknown) =>
    parse([{ ...minimal, recipeYield }])?.yield;

  it('handles "Serves 4"', () =>
    expect(withYield("Serves 4")).toEqual({ count: 4, label: "Serves 4" }));
  it("handles a number", () =>
    expect(withYield(4)).toEqual({ count: 4, label: "4 servings" }));
  it('handles ["4", "4 servings"]', () =>
    expect(withYield(["4", "4 servings"])).toEqual({
      count: 4,
      label: "4 servings",
    }));
  it("handles a range", () =>
    expect(withYield("4-6")).toEqual({ count: 4, label: "4-6 servings" }));
  it("keeps descriptive labels", () =>
    expect(withYield("Makes 12 cookies")).toEqual({
      count: 12,
      label: "Makes 12 cookies",
    }));
  it("has a null count when no number is present", () =>
    expect(withYield("One large loaf")).toEqual({
      count: null,
      label: "One large loaf",
    }));
  it("is null when missing", () => expect(withYield(undefined)).toBeNull());
  it("ignores a descriptive label that disagrees with the count", () =>
    expect(withYield(["8", "1 (9x5-inch) loaf"])).toEqual({
      count: 8,
      label: "8 servings",
    }));
  it("tidies float-serialised numbers", () =>
    expect(withYield("Serves 2.0")).toEqual({ count: 2, label: "Serves 2" }));
});

describe("parseRecipe — times", () => {
  it("converts ISO durations to minutes", () => {
    const r = parse([
      { ...minimal, prepTime: "PT15M", cookTime: "PT1H", totalTime: "PT1H15M" },
    ]);
    expect([r?.prepTime, r?.cookTime, r?.totalTime]).toEqual([15, 60, 75]);
  });

  it("derives totalTime from prep + cook when missing", () => {
    const r = parse([{ ...minimal, prepTime: "PT10M", cookTime: "PT20M" }]);
    expect(r?.totalTime).toBe(30);
  });

  it("treats zero and invalid durations as unknown", () => {
    const r = parse([
      { ...minimal, prepTime: "PT0M", cookTime: "about an hour" },
    ]);
    expect([r?.prepTime, r?.cookTime, r?.totalTime]).toEqual([
      null,
      null,
      null,
    ]);
  });
});

describe("parseRecipe — ingredients", () => {
  it("cleans HTML and entities", () => {
    const r = parse([
      {
        ...minimal,
        recipeIngredient: [
          "1&frac12; cups <b>flour</b>",
          "  ",
          "salt &amp; pepper",
        ],
      },
    ]);
    expect(r?.ingredients).toEqual(["1½ cups flour", "salt & pepper"]);
  });

  it("splits a single newline-separated string", () => {
    expect(
      parse([{ ...minimal, recipeIngredient: "1 egg\n2 tbsp milk" }])
        ?.ingredients,
    ).toEqual(["1 egg", "2 tbsp milk"]);
  });

  it("tidies float-serialised quantities but keeps real decimals", () => {
    expect(
      parse([
        {
          ...minimal,
          recipeIngredient: [
            "5.0tbsp chutney",
            "1.50 kg flour",
            "0.5 tsp salt",
          ],
        },
      ])?.ingredients,
    ).toEqual(["5tbsp chutney", "1.50 kg flour", "0.5 tsp salt"]);
  });

  it("accepts the legacy `ingredients` property", () => {
    const rest = without(minimal, "recipeIngredient");
    expect(
      parse([{ ...rest, ingredients: ["3 apples"] }])?.ingredients,
    ).toEqual(["3 apples"]);
  });
});

describe("parseRecipe — steps", () => {
  const withSteps = (recipeInstructions: unknown) =>
    parse([{ ...minimal, recipeInstructions }])?.steps;

  it("splits a plain string with newlines, dropping numbering", () => {
    expect(withSteps("1. Preheat the oven.\n2. Mix.\n\nStep 3: Bake.")).toEqual(
      [
        { text: "Preheat the oven.", section: null },
        { text: "Mix.", section: null },
        { text: "Bake.", section: null },
      ],
    );
  });

  it("does not mistake leading quantities for numbering", () => {
    expect(
      withSteps("1.5 kg of potatoes go in first.\n1-2 minutes later, stir."),
    ).toEqual([
      { text: "1.5 kg of potatoes go in first.", section: null },
      { text: "1-2 minutes later, stir.", section: null },
    ]);
  });

  it("splits an HTML list string", () => {
    expect(
      withSteps("<ol><li>Chop.</li><li>Fry &amp; serve.</li></ol>"),
    ).toEqual([
      { text: "Chop.", section: null },
      { text: "Fry & serve.", section: null },
    ]);
  });

  it("handles HowToStep[] with HTML and entities", () => {
    expect(
      withSteps([
        {
          "@type": "HowToStep",
          text: "<p>Heat the oil in a pan &ndash; medium heat.</p>",
        },
        {
          "@type": "HowToStep",
          name: "Fry",
          text: "Fry the onions for 10 minutes.",
        },
      ]),
    ).toEqual([
      { text: "Heat the oil in a pan – medium heat.", section: null },
      { text: "Fry the onions for 10 minutes.", section: null },
    ]);
  });

  it("falls back to name when a HowToStep has no text", () => {
    expect(
      withSteps([{ "@type": "HowToStep", name: "Rest the dough." }]),
    ).toEqual([{ text: "Rest the dough.", section: null }]);
  });

  it("handles a string array", () => {
    expect(withSteps(["Mix.", "Bake."])).toEqual([
      { text: "Mix.", section: null },
      { text: "Bake.", section: null },
    ]);
  });

  it("handles HowToSection[] with itemListElement, keeping section names", () => {
    expect(
      withSteps([
        {
          "@type": "HowToSection",
          name: "For the sauce",
          itemListElement: [
            { "@type": "HowToStep", text: "Melt the butter." },
            { "@type": "HowToStep", text: "Whisk in flour." },
          ],
        },
        {
          "@type": "HowToSection",
          name: "To assemble",
          itemListElement: [{ "@type": "HowToStep", text: "Layer and bake." }],
        },
      ]),
    ).toEqual([
      { text: "Melt the butter.", section: "For the sauce" },
      { text: "Whisk in flour.", section: "For the sauce" },
      { text: "Layer and bake.", section: "To assemble" },
    ]);
  });

  it("handles a mix of loose steps and sections", () => {
    expect(
      withSteps([
        { "@type": "HowToStep", text: "Prep everything." },
        {
          "@type": "HowToSection",
          name: "Cake",
          itemListElement: [{ "@type": "HowToStep", text: "Bake." }],
        },
      ]),
    ).toEqual([
      { text: "Prep everything.", section: null },
      { text: "Bake.", section: "Cake" },
    ]);
  });

  it("reads HowToDirection children and skips HowToTip", () => {
    expect(
      withSteps([
        {
          "@type": "HowToStep",
          itemListElement: [
            { "@type": "HowToDirection", text: "Knead for 10 minutes." },
            { "@type": "HowToTip", text: "Don't over-flour." },
          ],
        },
      ]),
    ).toEqual([{ text: "Knead for 10 minutes.", section: null }]);
  });

  it("handles a single HowToSection object instead of an array", () => {
    expect(
      withSteps({
        "@type": "HowToSection",
        name: "Main",
        itemListElement: [{ "@type": "HowToStep", text: "Go." }],
      }),
    ).toEqual([{ text: "Go.", section: "Main" }]);
  });

  it("resolves @id step references", () => {
    const block = {
      "@graph": [
        { "@type": "HowToStep", "@id": "#step1", text: "Referenced step." },
        { ...minimal, recipeInstructions: [{ "@id": "#step1" }] },
      ],
    };
    expect(parse([block])?.steps).toEqual([
      { text: "Referenced step.", section: null },
    ]);
  });
});

describe("parseRecipe — site, source and text fields", () => {
  it("uses og:site_name and the canonical URL", () => {
    const r = parse([minimal], {
      siteName: "Example Recipes",
      canonicalUrl: "/recipes/lemon-pasta",
    });
    expect(r?.siteName).toBe("Example Recipes");
    expect(r?.sourceUrl).toBe(
      "https://www.example-recipes.test/recipes/lemon-pasta",
    );
  });

  it("falls back to the hostname and page URL", () => {
    const r = parse([minimal]);
    expect(r?.siteName).toBe("example-recipes.test");
    expect(r?.sourceUrl).toBe(PAGE);
  });

  it("cleans title and description", () => {
    const r = parse([
      {
        ...minimal,
        name: "Mac &amp; Cheese",
        description: "<p>Creamy &amp; quick.</p>",
      },
    ]);
    expect(r?.title).toBe("Mac & Cheese");
    expect(r?.description).toBe("Creamy & quick.");
  });

  it("uses a placeholder title when none is given", () => {
    const rest = without(minimal, "name");
    expect(parse([rest])?.title).toBe("Untitled recipe");
  });

  it("returns a fully shaped recipe for a WordPress-style @graph", () => {
    const block = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${PAGE}#article`,
          author: { "@id": "#person" },
        },
        { "@type": "Person", "@id": "#person", name: "Sam Baker" },
        {
          "@type": "Recipe",
          "@id": `${PAGE}#recipe`,
          name: "Weeknight Lemon Pasta",
          author: { "@id": "#person" },
          image: ["https://cdn.test/p1.jpg", "https://cdn.test/p2.jpg"],
          recipeYield: ["4", "4 people"],
          prepTime: "PT5M",
          cookTime: "PT12M",
          totalTime: "PT17M",
          recipeIngredient: ["200 g spaghetti", "1 lemon, zested"],
          recipeInstructions: [
            { "@type": "HowToStep", text: "Cook the pasta for 10–12 minutes." },
            { "@type": "HowToStep", text: "Toss with lemon." },
          ],
        },
      ],
    };
    expect(parse([block], { siteName: "Example Recipes" })).toEqual({
      title: "Weeknight Lemon Pasta",
      description: null,
      authors: ["Sam Baker"],
      siteName: "Example Recipes",
      sourceUrl: PAGE,
      image: "https://cdn.test/p1.jpg",
      yield: { count: 4, label: "4 people" },
      prepTime: 5,
      cookTime: 12,
      totalTime: 17,
      ingredients: ["200 g spaghetti", "1 lemon, zested"],
      steps: [
        { text: "Cook the pasta for 10–12 minutes.", section: null },
        { text: "Toss with lemon.", section: null },
      ],
    });
  });
});
