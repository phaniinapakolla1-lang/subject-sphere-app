import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, CheckCircle2 } from "lucide-react";

const DEFAULT_WALLPAPER =
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2500&auto=format&fit=crop";

const TRANSITION_MS = 700;

export const Route = createFileRoute("/wallpaper")({
  head: () => ({
    meta: [
      { title: "Wallpaper Changer" },
      { name: "description", content: "Set your mood with a dynamic wallpaper changer. Paste any image URL and watch the background transform." },
      { property: "og:title", content: "Wallpaper Changer" },
      { property: "og:description", content: "Set your mood with a dynamic wallpaper changer. Paste any image URL and watch the background transform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WallpaperPage,
});

function isValidImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function WallpaperPage() {
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_WALLPAPER);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const finishTransition = (url: string) => {
    setCurrentUrl(url);
    setNextUrl(null);
    setShowNext(false);
    setIsLoading(false);
  };

  const applyWallpaper = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;

    if (trimmed === currentUrl || trimmed === nextUrl) {
      toast.info("That wallpaper is already active.");
      return;
    }

    if (!isValidImageUrl(trimmed)) {
      toast.error("Please enter a valid image URL starting with http:// or https://.");
      return;
    }

    setIsLoading(true);
    const img = new Image();

    img.onload = () => {
      setNextUrl(trimmed);
      // Trigger the cross-fade on the next paint.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShowNext(true));
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        finishTransition(trimmed);
      }, TRANSITION_MS);
    };

    img.onerror = () => {
      setIsLoading(false);
      toast.error("Couldn’t load that wallpaper. Please check the URL and try again.");
    };

    img.src = trimmed;
  };

  const handleSubmit = () => applyWallpaper(input);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background layers with cross-fade */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out"
        style={{
          backgroundImage: `url(${currentUrl})`,
          opacity: nextUrl ? (showNext ? 0 : 1) : 1,
        }}
      />
      {nextUrl && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out"
          style={{
            backgroundImage: `url(${nextUrl})`,
            opacity: showNext ? 1 : 0,
          }}
        />
      )}

      {/* Subtle overlay for legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-background/30"
      />

      <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="glass w-full max-w-md rounded-3xl p-8 shadow-lift animate-rise">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ImageIcon className="h-6 w-6" />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Wallpaper Changer
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Paste any image URL and press OK to transform your screen.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="h-12 flex-1 rounded-xl border-border/60 bg-background/60 px-4 text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-primary"
            />
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className="h-12 rounded-xl px-6 font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Loading
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  OK
                </span>
              )}
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Tip: press Enter inside the input to apply instantly.
          </p>
        </div>
      </main>
    </div>
  );
}
