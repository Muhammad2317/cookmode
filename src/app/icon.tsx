import { markResponse } from "@/lib/iconMark";

// Browser-tab favicon, generated at build time.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function Icon() {
  return markResponse(32, 1.15);
}
