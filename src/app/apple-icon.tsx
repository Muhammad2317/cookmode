import { markResponse } from "@/lib/iconMark";

// iOS home-screen icon (iOS adds its own rounded corners).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function AppleIcon() {
  return markResponse(180);
}
