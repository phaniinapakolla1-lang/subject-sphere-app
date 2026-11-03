/**
 * CodeMirror-powered code editing + read-only code display.
 * Language is stored on the block's `meta.language`; existing blocks without
 * one default to plain text. Nothing here executes user code.
 */
import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { StreamLanguage } from "@codemirror/language";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { sql } from "@codemirror/lang-sql";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { cpp } from "@codemirror/lang-cpp";
import { php } from "@codemirror/lang-php";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { r } from "@codemirror/legacy-modes/mode/r";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { Check, ChevronDown, ChevronUp, Copy, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type CodeLanguageId =
  | "python"
  | "java"
  | "javascript"
  | "typescript"
  | "sql"
  | "r"
  | "html"
  | "css"
  | "c"
  | "cpp"
  | "csharp"
  | "php"
  | "json"
  | "xml"
  | "bash"
  | "plaintext";

export const CODE_LANGUAGES: { id: CodeLanguageId; label: string }[] = [
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "sql", label: "SQL" },
  { id: "r", label: "R" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "c", label: "C" },
  { id: "cpp", label: "C++" },
  { id: "csharp", label: "C#" },
  { id: "php", label: "PHP" },
  { id: "json", label: "JSON" },
  { id: "xml", label: "XML" },
  { id: "bash", label: "Bash" },
  { id: "plaintext", label: "Plain text" },
];

export const LANGUAGE_BY_ID = new Map(CODE_LANGUAGES.map((l) => [l.id, l]));

const extCache = new Map<CodeLanguageId, unknown>();

/** Mirror fence-info strings ("py", "c++", "sh") onto our language ids. */
export function normalizeLanguage(raw?: string | null): CodeLanguageId {
  const t = (raw ?? "").toLowerCase().trim();
  const aliases: Record<string, CodeLanguageId> = {
    py: "python",
    python3: "python",
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    "c++": "cpp",
    cs: "csharp",
    "c#": "csharp",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    text: "plaintext",
    txt: "plaintext",
    mysql: "sql",
    postgres: "sql",
    postgresql: "sql",
  };
  if (aliases[t]) return aliases[t] as CodeLanguageId;
  return (LANGUAGE_BY_ID.has(t as CodeLanguageId) ? t : "plaintext") as CodeLanguageId;
}

function extensionFor(lang: CodeLanguageId) {
  const cached = extCache.get(lang);
  if (cached) return cached;
  let ext: unknown = [];
  switch (lang) {
    case "python":
      ext = python();
      break;
    case "java":
    case "csharp":
      ext = java();
      break;
    case "javascript":
      ext = javascript();
      break;
    case "typescript":
      ext = javascript({ typescript: true });
      break;
    case "sql":
      ext = sql();
      break;
    case "html":
      ext = html();
      break;
    case "css":
      ext = css();
      break;
    case "c":
    case "cpp":
      ext = cpp();
      break;
    case "php":
      ext = php();
      break;
    case "json":
      ext = json();
      break;
    case "xml":
      ext = xml();
      break;
    case "r":
      ext = StreamLanguage.define(r);
      break;
    case "bash":
      ext = StreamLanguage.define(shell);
      break;
    default:
      ext = [];
  }
  extCache.set(lang, ext);
  return ext;
}

/** Follow the app's dark class so code matches the theme in editor and reader. */
function useCodeTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setDark(root.classList.contains("dark"));
    read();
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark ? "dark" : "light";
}

const EDITOR_HEIGHTS = [160, 280, 440];

/** Editing surface with syntax highlighting, line numbers and tab indentation. */
export function CodeEditor({
  value,
  language,
  onChange,
  onLanguageChange,
}: {
  value: string;
  language: CodeLanguageId;
  onChange: (next: string) => void;
  onLanguageChange: (lang: CodeLanguageId) => void;
}) {
  const theme = useCodeTheme();
  const [tall, setTall] = useState(1);
  const extension = useMemo(() => extensionFor(language), [language]);

  return (
    <div className="space-y-2 rounded-lg border border-border/70 bg-background/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={language} onValueChange={(v) => onLanguageChange(v as CodeLanguageId)}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CODE_LANGUAGES.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => setTall((t) => (t + 1) % EDITOR_HEIGHTS.length)}
        >
          Height: {["Short", "Medium", "Tall"][tall]}
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border border-border/60 text-xs">
        <CodeMirror
          value={value}
          height={`${EDITOR_HEIGHTS[tall]}px`}
          minHeight="120px"
          theme={theme}
          extensions={[extension] as never}
          onChange={onChange}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            autocompletion: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
          }}
          indentWithTab
        />
      </div>
    </div>
  );
}

/** Read-only professional code display: badge, highlighting, copy, expand. */
export function CodeView({
  code,
  language,
  title,
  className,
}: {
  code: string;
  language?: CodeLanguageId | null;
  title?: string | null;
  className?: string;
}) {
  const theme = useCodeTheme();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lang = language ?? "plaintext";
  const extension = useMemo(() => extensionFor(lang), [lang]);
  const label = LANGUAGE_BY_ID.get(lang)?.label ?? "Code";

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className={cn("group/code relative", className)}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Terminal className="size-3" /> {label}
        </span>
        {title && <span className="truncate text-xs font-medium">{title}</span>}
        <div className="ml-auto flex items-center gap-1 opacity-70 transition-opacity group-hover/code:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {expanded ? "Collapse" : "Expand"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={copy}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-md border border-border/60 text-xs",
          !expanded && "max-h-72",
        )}
      >
        <CodeMirror
          value={code}
          height={expanded ? "auto" : "280px"}
          theme={theme}
          extensions={[extension] as never}
          editable={false}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            autocompletion: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
          }}
        />
      </div>
    </div>
  );
}
