import type { CSSProperties, ReactNode } from "react";

/**
 * ScrollHeader — "mission scroll" section header (ninja-scroll look).
 * Pure CSS (see `scroll-header` / `scroll-divider` utilities in styles.css).
 */
export function ScrollHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="scroll-header mx-2 px-6 py-5 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="scroll-divider mt-4" />
    </div>
  );
}

/**
 * ChakraRing — circular progress ring with a rotating chakra aura.
 * Color comes from a chart token so it themes in dark mode.
 */
export function ChakraRing({
  value,
  size = 96,
  stroke = 8,
  color = "var(--chart-1)",
  label,
  sublabel,
}: {
  /** 0–100 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: ReactNode;
  sublabel?: ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size, "--ring-color": color } as CSSProperties}
      role="img"
      aria-label={`${pct}%`}
    >
      <div className="chakra-aura" />
      <svg width={size} height={size} className="relative -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-bold tabular-nums leading-none">
          {label ?? `${pct}%`}
        </span>
        {sublabel ? (
          <span className="mt-1 max-w-[80px] truncate text-[10px] text-muted-foreground">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
