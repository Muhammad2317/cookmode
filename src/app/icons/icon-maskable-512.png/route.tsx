import { markResponse } from "@/lib/iconMark";

// Manifest icon, prerendered to a static PNG at build time.
export const dynamic = "force-static";

export function GET() {
  return markResponse(512, 0.8);
}
