import { describe, expect, it } from "vitest";
import { cleanText, decodeEntities, htmlToText } from "./text";

describe("decodeEntities", () => {
  it("decodes named, decimal and hex entities", () => {
    expect(
      decodeEntities(
        "Mac &amp; cheese &#8211; 1&frac12; cups &#x2014; caf&eacute;",
      ),
    ).toBe("Mac & cheese – 1½ cups — café");
  });

  it("handles double-encoded entities", () => {
    expect(decodeEntities("Nagi&amp;#039;s &amp;frac12;")).toBe("Nagi's ½");
  });

  it("leaves unknown entities alone", () => {
    expect(decodeEntities("&notathing; & friends")).toBe(
      "&notathing; & friends",
    );
  });
});

describe("htmlToText", () => {
  it("strips tags and keeps block breaks as newlines", () => {
    expect(
      htmlToText(
        "<p>Heat the <strong>oil</strong>.</p><p>Add onions.<br>Stir.</p>",
      ),
    ).toBe("Heat the oil.\nAdd onions.\nStir.");
  });

  it("strips entity-encoded markup", () => {
    expect(htmlToText("&lt;p&gt;Whisk the eggs&lt;/p&gt;")).toBe(
      "Whisk the eggs",
    );
  });

  it("does not treat a bare < as a tag", () => {
    expect(htmlToText("Cook for < 5 minutes or > 2")).toBe(
      "Cook for < 5 minutes or > 2",
    );
  });
});

describe("cleanText", () => {
  it("collapses whitespace to one line", () => {
    expect(cleanText("  Roast\n\n   chicken thighs ")).toBe(
      "Roast chicken thighs",
    );
  });

  it("returns empty string for non-strings", () => {
    expect(cleanText(undefined)).toBe("");
    expect(cleanText({ name: "x" })).toBe("");
  });
});
