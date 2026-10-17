// Validate a user-supplied URL before the function fetches it (SSRF guard).
// Rejects non-http(s) schemes, credentials, non-default ports, localhost-style
// names and private/reserved IP literals. The WHATWG URL parser already
// normalises tricks like `http://2130706433/` and `http://0x7f.1/` to
// dotted IPv4, so checking the parsed hostname catches them.

export type UrlCheck = { ok: true; url: URL } | { ok: false };

const BLOCKED_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".lan",
  ".home.arpa",
  ".intranet",
];

function isPrivateIPv4(host: string): boolean | null {
  const parts = host.split(".");
  if (parts.length !== 4 || !parts.every((p) => /^\d{1,3}$/.test(p)))
    return null;
  const [a, b] = parts.map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast + reserved + broadcast
  );
}

export function validateUrl(input: unknown): UrlCheck {
  if (typeof input !== "string") return { ok: false };
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) return { ok: false };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:")
    return { ok: false };
  if (url.username || url.password) return { ok: false };
  if (url.port && url.port !== "80" && url.port !== "443") return { ok: false };

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost") return { ok: false };
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix)))
    return { ok: false };

  // Recipe sites are never served from IPv6 literals; refusing them all is
  // simpler and safer than enumerating every private/mapped IPv6 range.
  if (host.startsWith("[")) return { ok: false };

  const privateV4 = isPrivateIPv4(host);
  if (privateV4 === true) return { ok: false };
  // Single-label names ("intranet", "router") only resolve on internal networks.
  if (privateV4 === null && !host.includes(".")) return { ok: false };

  return { ok: true, url };
}
