import { describe, expect, it } from "vitest";
import { parseJsonLoose } from "./parseJsonLoose";

describe("parseJsonLoose", () => {
  it("parses valid JSON unchanged", () => {
    expect(parseJsonLoose('{"@type":"Recipe","name":"Soup"}')).toEqual({
      "@type": "Recipe",
      name: "Soup",
    });
  });

  it("tolerates stray whitespace", () => {
    expect(parseJsonLoose('\n\n   {"a": 1}   \n')).toEqual({ a: 1 });
  });

  it("removes trailing commas in objects and arrays", () => {
    expect(parseJsonLoose('{"a": [1, 2, ], "b": {"c": 3,},}')).toEqual({
      a: [1, 2],
      b: { c: 3 },
    });
  });

  it("keeps commas inside strings", () => {
    expect(parseJsonLoose('{"a": "salt, pepper,]", "b": 1,}')).toEqual({
      a: "salt, pepper,]",
      b: 1,
    });
  });

  it("repairs raw newlines and tabs inside strings", () => {
    expect(parseJsonLoose('{"text": "Line one\nLine\ttwo"}')).toEqual({
      text: "Line one Line two",
    });
  });

  it("repairs invalid escapes", () => {
    expect(
      parseJsonLoose(String.raw`{"name": "Mum\'s pie", "ok": "a \"quote\""}`),
    ).toEqual({
      name: "Mum's pie",
      ok: 'a "quote"',
    });
  });

  it("strips CDATA and HTML comment wrappers", () => {
    expect(parseJsonLoose('//<![CDATA[\n{"a": 1}\n//]]>')).toEqual({ a: 1 });
    expect(parseJsonLoose('<!--{"a": 1}-->')).toEqual({ a: 1 });
  });

  it("decodes fully entity-encoded JSON", () => {
    expect(
      parseJsonLoose(
        "{&quot;@type&quot;: &quot;Recipe&quot;, &quot;name&quot;: &quot;Mac &amp; cheese&quot;}",
      ),
    ).toEqual({ "@type": "Recipe", name: "Mac & cheese" });
  });

  it("returns undefined for hopeless input", () => {
    expect(parseJsonLoose("not json at all")).toBeUndefined();
    expect(parseJsonLoose("")).toBeUndefined();
  });
});
