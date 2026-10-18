import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

// Flat, high-contrast buttons. Fully round, decided once. Pressing scales to
// 0.97 (transform only). Hover steps the fill one tone (Tailwind applies
// hover only on devices that can hover), and every hover pair stays AAA.

export type ButtonVariant = "primary" | "secondary" | "raised" | "quiet";
export type ButtonSize = "cta" | "regular";

const base =
  "inline-flex items-center justify-center gap-3 rounded-control font-semibold select-none " +
  "transition-transform duration-(--duration-press) ease-out active:scale-[0.97] " +
  "disabled:pointer-events-none disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-ground hover:bg-muted",
  secondary: "bg-surface text-ink hover:bg-line",
  // Secondary for use on a surface: steps back to the ground tone.
  raised: "bg-ground text-ink hover:bg-line",
  quiet:
    "text-ink underline decoration-2 underline-offset-4 hover:decoration-4",
};

const heights: Record<ButtonSize, string> = {
  cta: "tap-cta text-body",
  regular: "tap text-body",
};

const sidePadding: Record<ButtonSize, string> = {
  cta: "px-8",
  regular: "px-6",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "regular",
  extra = "",
) {
  // Quiet buttons read as links: full tap height, but no side padding so
  // they line up with the text around them.
  const padding = variant === "quiet" ? "" : sidePadding[size];
  return `${base} ${variants[variant]} ${heights[size]} ${padding} ${extra}`.trim();
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export function Button({
  variant,
  size,
  className = "",
  type = "button",
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant,
  size,
  className = "",
  ...props
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={buttonClasses(variant, size, className)} {...props} />;
}

/** Square-footprint round button for icon-only actions. Always needs a label. */
export function IconButton({
  label,
  variant = "secondary",
  className = "",
  type = "button",
  children,
  ...props
}: {
  label: string;
  variant?: "primary" | "secondary" | "raised";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`${base} ${variants[variant]} tap size-14 shrink-0 ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
