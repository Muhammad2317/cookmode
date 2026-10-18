import Link from "next/link";
import type { ReactNode } from "react";

export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:px-8">
      <Link
        href="/"
        prefetch={false}
        className="tap-min text-body inline-flex items-center font-bold"
        translate="no"
      >
        Cook Mode
      </Link>
      {children}
    </header>
  );
}
