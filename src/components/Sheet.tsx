import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconButton } from "./Button";
import { Close } from "./icons";

// Bottom sheet on phones, centred panel on wide screens, built on the native
// <dialog>: showModal() gives focus containment, Escape, an inert background
// and focus return for free. The slide is a CSS transform keyframe that
// becomes a fade under reduced motion.

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    // Play the exit animation first; onAnimationEnd then closes the dialog.
    if (!open && dialog.open) setClosing(true);
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="sheet-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && closing) {
          ref.current?.close();
          setClosing(false);
        }
      }}
      className="rounded-t-surface bg-ground text-ink backdrop:bg-ink/40 sm:rounded-surface fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[85dvh] w-full max-w-xl overflow-y-auto overscroll-contain p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop:[animation:fade-in_var(--duration-sheet)_var(--ease-out)] sm:bottom-6"
      style={{
        animation: closing
          ? "sheet-out var(--duration-sheet) var(--ease-in) both"
          : "sheet-in var(--duration-sheet) var(--ease-out) both",
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="sheet-title" className="text-title font-bold">
          {title}
        </h2>
        <IconButton label={`Close ${title.toLowerCase()}`} onClick={onClose}>
          <Close />
        </IconButton>
      </div>
      <div className="mt-2">{children}</div>
    </dialog>
  );
}
