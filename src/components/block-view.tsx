import { useEffect, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { renderMarkdown } from "@/lib/markdown";
import { blockDef, type TopicBlock } from "@/lib/blocks";
import { cn } from "@/lib/utils";

export function useSignedUrl(path: string | null | undefined, fallback?: string | null) {
  const [url, setUrl] = useState<string | null>(fallback ?? null);
  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(fallback ?? null);
      return;
    }
    supabase.storage
      .from("study-files")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (alive) setUrl(data?.signedUrl ?? fallback ?? null);
      });
    return () => {
      alive = false;
    };
  }, [path, fallback]);
  return url;
}

function embedUrl(raw: string) {
  try {
    const u = new URL(raw);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v"))
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("vimeo.com"))
      return `https://player.vimeo.com/video${u.pathname}`;
    return null;
  } catch {
    return null;
  }
}

export function BlockView({ block }: { block: TopicBlock }) {
  const def = blockDef(block.type);
  const media = useSignedUrl(block.storage_path, block.url);
  const body = block.body?.trim() ?? "";

  if (block.type === "divider") return <hr className="my-6 border-border" />;

  if (block.type === "heading")
    return (
      <h3 className="mt-8 mb-2 text-lg font-semibold tracking-tight">
        {block.title || "Untitled section"}
      </h3>
    );

  const tone =
    block.type === "important"
      ? "border-warning/40 bg-warning/5"
      : block.type === "note"
        ? "border-primary/30 bg-primary/5"
        : block.type === "question"
          ? "border-success/30 bg-success/5"
          : "border-border bg-card/40";

  return (
    <section className={cn("rounded-xl border p-4", tone)}>
      {block.title && (
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden>{def.emoji}</span>
          {block.title}
        </h4>
      )}

      {block.type === "image" && media && (
        <figure>
          <img
            src={media}
            alt={block.caption || block.title || "Topic illustration"}
            loading="lazy"
            className="w-full rounded-lg border border-border"
          />
          {block.caption && (
            <figcaption className="mt-2 text-xs text-muted-foreground">{block.caption}</figcaption>
          )}
        </figure>
      )}

      {block.type === "video" && block.url && (
        embedUrl(block.url) ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
            <iframe
              src={embedUrl(block.url) as string}
              title={block.title || "Video"}
              allowFullScreen
              className="size-full"
            />
          </div>
        ) : (
          <a href={block.url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
            {block.url}
          </a>
        )
      )}

      {(block.type === "link" || block.type === "file") && (media || block.url) && (
        <a
          href={(media || block.url) as string}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          {block.type === "file" ? <FileText className="size-4" /> : <ExternalLink className="size-4" />}
          {block.caption || block.url || "Open attachment"}
        </a>
      )}

      {body && (block.type === "code" || block.type === "formula") && (
        <pre className="overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs">
          <code>{body}</code>
        </pre>
      )}

      {body && block.type !== "code" && block.type !== "formula" && (
        <div
          className="prose-studyos text-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
        />
      )}
    </section>
  );
}

export function BlockList({ blocks }: { blocks: TopicBlock[] }) {
  if (!blocks.length)
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No content has been added to this topic yet.
      </p>
    );
  return (
    <div className="space-y-4">
      {blocks.map((b) => (
        <BlockView key={b.id} block={b} />
      ))}
    </div>
  );
}
