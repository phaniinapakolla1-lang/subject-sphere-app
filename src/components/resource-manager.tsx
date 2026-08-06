import { useRef, useState } from "react";
import { ExternalLink, FileUp, Link2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCreate, useList, useRemove, type Resource } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function ResourceManager({
  topicId,
  subjectId,
}: {
  topicId?: string;
  subjectId?: string;
}) {
  const { user } = useAuth();
  const scopeId = topicId ?? subjectId ?? "all";
  const resources = useList("resources", {
    key: ["of", scopeId],
    build: (q) =>
      topicId
        ? q.eq("topic_id", topicId).order("created_at", { ascending: false })
        : subjectId
          ? q.eq("subject_id", subjectId).order("created_at", { ascending: false })
          : q.order("created_at", { ascending: false }),
  });
  const create = useCreate("resources", "Resource added");
  const remove = useRemove("resources", "Resource removed");

  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !linkUrl.trim()) return;
    try {
      new URL(linkUrl.trim());
    } catch {
      toast.error("Enter a valid URL");
      return;
    }
    await create.mutateAsync({
      user_id: user.id,
      title: linkTitle.trim() || linkUrl.trim(),
      kind: "link",
      url: linkUrl.trim(),
      topic_id: topicId ?? null,
      subject_id: subjectId ?? null,
    });
    setLinkTitle("");
    setLinkUrl("");
  }

  async function upload(file: File) {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("study-files").upload(path, file);
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    await create.mutateAsync({
      user_id: user.id,
      title: file.name,
      kind: "file",
      storage_path: path,
      mime_type: file.type,
      size_bytes: file.size,
      topic_id: topicId ?? null,
      subject_id: subjectId ?? null,
    });
    setUploading(false);
  }

  async function open(r: Resource) {
    if (r.kind === "link" && r.url) {
      window.open(r.url, "_blank", "noreferrer");
      return;
    }
    if (!r.storage_path) return;
    const { data, error } = await supabase.storage
      .from("study-files")
      .createSignedUrl(r.storage_path, 60 * 10);
    if (error || !data) {
      toast.error("Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noreferrer");
  }

  async function destroy(r: Resource) {
    if (r.storage_path) {
      await supabase.storage.from("study-files").remove([r.storage_path]);
    }
    remove.mutate(r.id);
  }

  return (
    <div className="space-y-4">
      <div className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <form onSubmit={addLink} className="flex flex-1 flex-col gap-2 sm:flex-row">
          <Input
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            placeholder="Title (optional)"
          />
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://…"
          />
          <Button type="submit" variant="secondary">
            <Link2 className="size-4" /> Add link
          </Button>
        </form>
        <div>
          <input
            ref={fileInput}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
          <Button onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileUp className="size-4" />
            )}
            Upload file
          </Button>
        </div>
      </div>

      {(resources.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No resources yet. Attach PDFs, slides, images or links.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {(resources.data ?? []).map((r) => (
            <li key={r.id} className="flex items-center gap-3 p-3">
              <Badge variant="outline" className="capitalize">
                {r.kind}
              </Badge>
              <button
                onClick={() => open(r)}
                className="min-w-0 flex-1 truncate text-left text-sm hover:text-primary"
              >
                {r.title}
              </button>
              {r.size_bytes ? (
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {(r.size_bytes / 1024).toFixed(0)} KB
                </span>
              ) : null}
              <Button variant="ghost" size="icon" onClick={() => open(r)} aria-label="Open">
                <ExternalLink className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => destroy(r)}
                aria-label="Delete resource"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
