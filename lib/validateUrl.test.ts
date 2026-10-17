import { describe, expect, it } from "vitest";
import { validateUrl } from "./validateUrl";

describe("validateUrl", () => {
  it.each([
    "https://www.bbcgoodfood.com/recipes/easy-pancakes",
    "http://example.com/recipe?id=1",
    "https://example.co.uk:443/a",
    "  https://example.com/padded  ",
    "https://8.8.8.8/public-ip",
  ])("accepts %s", (url) => {
    expect(validateUrl(url).ok).toBe(true);
  });

  it.each([
    ["not a url"],
    ["ftp://example.com/file"],
    ["javascript:alert(1)"],
    ["file:///etc/passwd"],
    ["data:text/html,hi"],
    ["http://localhost/"],
    ["http://LOCALHOST:80/"],
    ["http://app.localhost/"],
    ["http://printer.local/"],
    ["http://metadata.google.internal/"],
    ["http://intranet/"],
    ["http://127.0.0.1/"],
    ["http://127.1/"],
    ["http://2130706433/"],
    ["http://0x7f000001/"],
    ["http://0.0.0.0/"],
    ["http://10.0.0.5/"],
    ["http://172.16.0.1/"],
    ["http://172.31.255.255/"],
    ["http://192.168.1.1/"],
    ["http://169.254.169.254/latest/meta-data"],
    ["http://100.64.0.1/"],
    ["http://224.0.0.1/"],
    ["http://[::1]/"],
    ["http://[::ffff:127.0.0.1]/"],
    ["http://[fd00::1]/"],
    ["https://user:pass@example.com/"],
    ["https://example.com:8080/"],
    [""],
  ])("rejects %s", (url) => {
    expect(validateUrl(url).ok).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(validateUrl(null).ok).toBe(false);
    expect(validateUrl(undefined).ok).toBe(false);
  });

  it("rejects absurdly long input", () => {
    expect(validateUrl(`https://example.com/${"a".repeat(3000)}`).ok).toBe(
      false,
    );
  });
});
