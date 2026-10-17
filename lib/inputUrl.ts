// Turn whatever the user pasted or typed into a fetchable URL.
// People paste share text ("Look at this! https://…"), bare domains
// ("bbcgoodfood.com/recipes/…") or URLs wrapped in punctuation.

const EMBEDDED_URL_RE = /https?:\/\/[^\s<>"'`]+/i;
const BARE_DOMAIN_RE =
  /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?::\d+)?(?:[/?#]\S*)?$/i;

export function extractUrl(input: string): string | null {
  const text = input.trim();
  if (!text) return null;

  const embedded = EMBEDDED_URL_RE.exec(text);
  // Trailing punctuation is almost always sentence punctuation, not part of the URL.
  if (embedded) return embedded[0].replace(/[).,;:!?\]]+$/, "");

  if (BARE_DOMAIN_RE.test(text)) return `https://${text}`;
  return null;
}
