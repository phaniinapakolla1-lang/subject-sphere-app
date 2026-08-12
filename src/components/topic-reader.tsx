import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { blockDef, type TopicBlock } from "@/lib/blocks";
import { useList, type Topic, type Unit } from "@/lib/data";
import { useSignedUrl } from "@/components/block-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Block kinds that keep a card/callout treatment in the reader. */
const CALLOUT_KINDS = new Set(["note", "important", "question", "code", "formula"]);
const MEDIA_KINDS = new Set(["image", "video", "link", "file"]);

const CALLOUT_TONE: Record<string, string> = {
  important: "border-warning/45 bg-warning/8",
  note: "border-primary/35 bg-primary/6",
  question: "border-success/35 bg-success/6",
  code: "border-border bg-muted/40",
  formula: "border-border bg-muted/40",
};

function wordCount(blocks: TopicBlock[]) {
  return blocks.reduce((n, b) => n + (b.body ? b.body.trim().split(/\s+/).length : 0), 0);
}

function embedUrl(raw: string) {
  try {
    const u = new URL(raw);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v"))
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video${u.pathname}`;
    return null;
  } catch {
    return null;
  }
}

function MediaBlock({ block }: { block: TopicBlock }) {
  const media = useSignedUrl(block.storage_path, block.url);

  if (block.type === "image")
    return media ? (
      <figure className="my-8">
        <img
          src={media}
          alt={block.caption || block.title || "Topic illustration"}
          loading="lazy"
          className="w-full rounded-xl border border-border"
        />
        {(block.caption || block.title) && (
          <figcaption className="mt-2 text-center text-sm text-muted-foreground">
            {block.caption || block.title}
          </figcaption>
        )}
      </figure>
    ) : null;

  if (block.type === "video" && block.url) {
    const embed = embedUrl(block.url);
    return (
      <div className="my-8">
        {embed ? (
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-border">
            <iframe src={embed} title={block.title || "Video"} allowFullScreen className="size-full" />
          </div>
        ) : (
          <a href={block.url} target="_blank" rel="noreferrer" className="text-primary underline">
            {block.title || block.url}
          </a>
        )}
      </div>
    );
  }

  const href = media || block.url;
  if (!href) return null;
  return (
    <p className="my-6">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-sm text-primary hover:bg-card"
      >
        <span aria-hidden>{blockDef(block.type).emoji}</span>
        {block.caption || block.title || block.url || "Open attachment"}
      </a>
    </p>
  );
}

function ReaderBlock({ block }: { block: TopicBlock }) {
  const body = block.body?.trim() ?? "";
  const def = blockDef(block.type);

  if (block.type === "divider") return <hr className="my-10 border-border" />;

  if (block.type === "heading")
    return (
      <h2 id={`b-${block.id}`} className="reader-h2 mt-12 mb-3 scroll-mt-28">
        {block.title || "Section"}
      </h2>
    );

  if (MEDIA_KINDS.has(block.type)) return <MediaBlock block={block} />;

  if (CALLOUT_KINDS.has(block.type)) {
    return (
      <aside
        id={`b-${block.id}`}
        className={cn(
          "my-8 scroll-mt-28 rounded-xl border p-5",
          CALLOUT_TONE[block.type] ?? "border-border bg-card/50",
        )}
      >
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
          <span aria-hidden>{def.emoji}</span>
          {block.title || def.label}
        </p>
        {block.type === "code" || block.type === "formula" ? (
          <pre className="overflow-x-auto rounded-lg bg-muted/70 p-3 text-sm">
            <code>{body}</code>
          </pre>
        ) : (
          <div
            className="prose-reader text-[0.97em]"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
          />
        )}
      </aside>
    );
  }

  // text / list / table → flowing textbook content, no card
  return (
    <section id={`b-${block.id}`} className="scroll-mt-28">
      {block.title && <h3 className="reader-h3 mt-9 mb-2">{block.title}</h3>}
      {body && <div className="prose-reader" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />}
    </section>
  );
}

type TocItem = { id: string; label: string; level: 2 | 3 };

function useToc(blocks: TopicBlock[]): TocItem[] {
  return useMemo(
    () =>
      blocks
        .filter(
          (b) =>
            (b.type === "heading" && b.title) ||
            (b.title && !MEDIA_KINDS.has(b.type) && b.type !== "divider"),
        )
        .map((b) => ({
          id: `b-${b.id}`,
          label: (b.title as string) || "Section",
          level: b.type === "heading" ? (2 as const) : (3 as const),
        })),
    [blocks],
  );
}

function TocList({
  items,
  active,
  onPick,
}: {
  items: TocItem[];
  active: string | null;
  onPick?: () => void;
}) {
  return (
    <nav className="space-y-1 text-sm">
      {items.map((i) => (
        <a
          key={i.id}
          href={`#${i.id}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(i.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            onPick?.();
          }}
          className={cn(
            "block rounded-md px-2 py-1.5 transition-colors",
            i.level === 3 && "pl-5",
            active === i.id
              ? "bg-accent font-medium text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {i.label}
        </a>
      ))}
    </nav>
  );
}

export function TopicReader({
  topic,
  blocks,
  subjectName,
  unitName,
  bookmarked,
  onToggleBookmark,
  actions,
}: {
  topic: Topic;
  blocks: TopicBlock[];
  subjectName?: string;
  unitName?: string;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  actions?: React.ReactNode;
}) {
  const toc = useToc(blocks);
  const [active, setActive] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [focus, setFocus] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  const minutes = Math.max(1, Math.round(wordCount(blocks) / 200)) || topic.estimated_minutes;

  const units = useList("units", {
    key: ["reader-nav", topic.subject_id],
    build: (q) => q.eq("subject_id", topic.subject_id).order("position", { ascending: true }),
  });
  const siblings = useList("topics", {
    key: ["reader-nav", topic.subject_id],
    build: (q) => q.eq("subject_id", topic.subject_id).order("position", { ascending: true }),
  });

  const { prev, next } = useMemo(() => {
    const unitOrder = new Map(
      ((units.data ?? []) as Unit[]).map((u, i) => [u.id, u.position ?? i]),
    );
    const flat = ((siblings.data ?? []) as Topic[])
      .slice()
      .sort(
        (a, b) =>
          (unitOrder.get(a.unit_id) ?? 0) - (unitOrder.get(b.unit_id) ?? 0) ||
          (a.position ?? 0) - (b.position ?? 0),
      );
    const idx = flat.findIndex((t) => t.id === topic.id);
    return { prev: idx > 0 ? flat[idx - 1] : null, next: idx >= 0 ? flat[idx + 1] : null };
  }, [units.data, siblings.data, topic.id]);

  useEffect(() => {
    function onScroll() {
      const el = articleRef.current;
      if (!el) return;
      const start = el.offsetTop;
      const total = Math.max(1, el.offsetHeight - window.innerHeight * 0.5);
      const done = window.scrollY + window.innerHeight * 0.5 - start;
      setProgress(Math.min(100, Math.max(0, Math.round((done / total) * 100))));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [blocks.length]);

  useEffect(() => {
    if (!toc.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    toc.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [toc]);

  const body = (
    <div className={cn("mx-auto w-full", focus ? "max-w-[820px]" : "max-w-[800px]")}>
      <header className="border-b border-border pb-5">
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {subjectName && (
            <Link
              to="/subjects/$subjectId"
              params={{ subjectId: topic.subject_id }}
              className="hover:text-foreground"
            >
              {subjectName}
            </Link>
          )}
          {unitName && (
            <>
              <span aria-hidden>/</span>
              <span>{unitName}</span>
            </>
          )}
        </p>
        <h1 className="reader-h1 mt-2">{topic.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> {minutes} min read
          </span>
          {topic.completed && <Badge variant="secondary">Completed</Badge>}
          <Button size="sm" variant={bookmarked ? "secondary" : "ghost"} onClick={onToggleBookmark}>
            <Bookmark className="size-3.5" /> {bookmarked ? "Bookmarked" : "Bookmark"}
          </Button>
          {toc.length > 2 && (
            <Sheet open={tocOpen} onOpenChange={setTocOpen}>
              <SheetTrigger asChild>
                <Button size="sm" variant="ghost" className="lg:hidden">
                  <List className="size-3.5" /> On this page
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto p-4">
                <SheetHeader className="p-0">
                  <SheetTitle className="text-sm">On this page</SheetTitle>
                </SheetHeader>
                <div className="mt-3">
                  <TocList items={toc} active={active} onPick={() => setTocOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          )}
          <Button size="sm" variant="ghost" onClick={() => setFocus((f) => !f)}>
            {focus ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            {focus ? "Exit focus" : "Focus"}
          </Button>
          {actions}
        </div>
      </header>

      <div ref={articleRef} className="pt-2 pb-10">
        {blocks.length ? (
          blocks.map((b) => <ReaderBlock key={b.id} block={b} />)
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No content has been added to this topic yet.
          </p>
        )}
      </div>

      <nav className="grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            to="/topics/$topicId"
            params={{ topicId: prev.id }}
            className="group rounded-xl border border-border p-4 transition-colors hover:bg-accent/40"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronLeft className="size-3.5" /> Previous topic
            </span>
            <span className="mt-1 block truncate text-sm font-medium">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            to="/topics/$topicId"
            params={{ topicId: next.id }}
            className="group rounded-xl border border-border p-4 text-right transition-colors hover:bg-accent/40 sm:col-start-2"
          >
            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              Next topic <ChevronRight className="size-3.5" />
            </span>
            <span className="mt-1 block truncate text-sm font-medium">{next.title}</span>
          </Link>
        )}
      </nav>
    </div>
  );

  const progressBar = (
    <div className="sticky top-0 z-30 -mx-4 mb-4 bg-background/80 px-4 pt-2 pb-2 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="truncate text-xs font-medium text-muted-foreground">{topic.title}</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{progress}%</span>
      </div>
    </div>
  );

  if (focus)
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-background px-4 py-4 sm:px-6">
        {progressBar}
        {body}
      </div>
    );

  return (
    <div className="animate-rise">
      {progressBar}
      <div className="flex gap-10">
        <div className="min-w-0 flex-1">{body}</div>
        {toc.length > 2 && (
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-24">
              <p className="mb-2 px-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                On this page
              </p>
              <TocList items={toc} active={active} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
