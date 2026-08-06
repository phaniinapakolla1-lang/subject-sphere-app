function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Minimal, safe markdown renderer (escapes HTML first). */
export function renderMarkdown(input: string): string {
  if (!input) return '<p class="text-muted-foreground">Nothing written yet.</p>';
  const blocks = escapeHtml(input).split(/\n{2,}/);

  return blocks
    .map((block) => {
      const fence = block.match(/^```([\s\S]*?)```$/);
      if (fence) {
        return `<pre class="overflow-x-auto rounded-lg bg-muted p-3 text-xs"><code>${fence[1]?.trim() ?? ""}</code></pre>`;
      }

      const lines = block.split("\n");
      if (lines.every((l) => /^\s*([-*])\s+/.test(l))) {
        const items = lines
          .map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`)
          .join("");
        return `<ul class="ml-5 list-disc space-y-1">${items}</ul>`;
      }
      if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
        const items = lines
          .map((l) => `<li>${inline(l.replace(/^\s*\d+\.\s+/, ""))}</li>`)
          .join("");
        return `<ol class="ml-5 list-decimal space-y-1">${items}</ol>`;
      }

      const heading = block.match(/^(#{1,4})\s+(.*)$/);
      if (heading) {
        const level = heading[1]?.length ?? 1;
        const sizes = ["text-xl", "text-lg", "text-base", "text-sm"];
        return `<p class="${sizes[level - 1]} font-semibold">${inline(heading[2] ?? "")}</p>`;
      }

      return `<p>${lines.map(inline).join("<br/>")}</p>`;
    })
    .join("");
}

function inline(text: string) {
  return text
    .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-[0.85em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a class="text-primary underline" href="$2" target="_blank" rel="noreferrer">$1</a>',
    );
}
