import Link from "next/link";
import {
  useId,
  useState,
  useSyncExternalStore,
  type ClipboardEvent,
  type SubmitEvent,
} from "react";
import { extractUrl } from "../../../lib/inputUrl";
import { validateUrl } from "../../../lib/validateUrl";
import { Button } from "../Button";
import { ArrowRight } from "../icons";

// The home screen is a real GET form (action="/" name="url"), so it works
// before JavaScript loads and doubles as the static-export fallback. With JS,
// submissions are intercepted, cleaned up (share text, bare domains) and
// navigated client-side. Pasting a link submits immediately.

// Recipes verified during Phase 1 live testing, to try Cook Mode in one tap.
const EXAMPLES = [
  {
    title: "Easy pancakes",
    site: "BBC Good Food",
    url: "https://www.bbcgoodfood.com/recipes/easy-pancakes",
  },
  {
    title: "Chicken chasseur",
    site: "RecipeTin Eats",
    url: "https://www.recipetineats.com/chicken-chasseur/",
  },
  {
    title: "Slow-cooked bolognese",
    site: "Serious Eats",
    url: "https://www.seriouseats.com/the-best-slow-cooked-bolognese-sauce-recipe",
  },
];

// Clipboard support never changes during a visit, so there's nothing to subscribe to.
const noSubscription = () => () => {};

export function Home({ onSubmit }: { onSubmit?: (url: string) => void }) {
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canReadClipboard = useSyncExternalStore(
    noSubscription,
    () => typeof navigator.clipboard?.readText === "function",
    // Server HTML (and the hydration pass) never shows the button.
    () => false,
  );

  const go = (raw: string): boolean => {
    const url = extractUrl(raw);
    if (!url || !validateUrl(url).ok) {
      setError(
        "That doesn't look like a web link. Paste the full address of a recipe page.",
      );
      return false;
    }
    setError(null);
    onSubmit?.(url);
    return true;
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    if (!onSubmit) return; // No JS handler yet: let the native GET submit.
    event.preventDefault();
    go(value);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text");
    const url = extractUrl(pasted);
    if (url && onSubmit) {
      event.preventDefault();
      setValue(url);
      go(url);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setValue(text.trim());
      if (!go(text)) document.getElementById(inputId)?.focus();
    } catch {
      setError(
        "Couldn't read the clipboard. Paste the link into the box instead.",
      );
      document.getElementById(inputId)?.focus();
    }
  };

  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-10 px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8"
    >
      <div className="flex flex-col gap-4">
        <p className="text-body font-bold" translate="no">
          Cook Mode
        </p>
        <h1
          className="font-display text-display font-bold"
          data-view-heading
          tabIndex={-1}
        >
          Any recipe, one clear step at a time.
        </h1>
      </div>

      <form
        action="/"
        method="get"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3"
        noValidate
      >
        <label htmlFor={inputId} className="text-body font-semibold">
          Paste a recipe link
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id={inputId}
            name="url"
            type="url"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="https://…"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            onPaste={handlePaste}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="tap-cta rounded-control bg-surface text-body placeholder:text-muted w-full min-w-0 px-6"
          />
          <Button type="submit" size="cta" className="shrink-0">
            Cook it
            <ArrowRight />
          </Button>
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-body font-semibold">
            <span className="sr-only">Error: </span>
            {error}
          </p>
        )}
        {canReadClipboard && (
          <Button
            variant="quiet"
            onClick={pasteFromClipboard}
            className="self-start"
          >
            Paste from clipboard
          </Button>
        )}
      </form>

      <p className="text-body text-muted max-w-[52ch]">
        Cook Mode always credits the creator and links back to their original
        recipe. It reads the recipe, it never replaces the page it came from.
      </p>

      <section
        aria-labelledby="examples-heading"
        className="flex flex-col gap-3"
      >
        <h2 id="examples-heading" className="text-body font-semibold">
          Or try one
        </h2>
        <ul className="flex flex-col gap-2">
          {EXAMPLES.map((example) => (
            <li key={example.url}>
              <Link
                href={`/?url=${encodeURIComponent(example.url)}`}
                prefetch={false}
                className="tap-min text-body group inline-flex items-center gap-2"
              >
                <span className="underline decoration-2 underline-offset-4 group-hover:decoration-4">
                  {example.title}
                </span>
                <span className="text-muted">· {example.site}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
