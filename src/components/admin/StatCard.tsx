import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delta?: number; // %
  icon?: React.ComponentType<{ className?: string }>;
  accent?: "purple" | "violet" | "pink" | "blue";
  format?: (n: number) => string;
};

const accents: Record<NonNullable<Props["accent"]>, string> = {
  purple: "from-[#7C3AED]/30 to-[#A855F7]/5",
  violet: "from-[#9333EA]/30 to-[#C084FC]/5",
  pink: "from-[#C084FC]/30 to-[#7C3AED]/5",
  blue: "from-[#6366F1]/30 to-[#7C3AED]/5",
};

export function StatCard({ label, value, prefix, suffix, delta, icon: Icon, accent = "purple", format }: Props) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value]);

  const fmt = format ?? ((n: number) => n.toLocaleString());
  const up = (delta ?? 0) >= 0;

  return (
    <div className={cn("glass group relative overflow-hidden rounded-2xl p-5")}>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70 transition-opacity group-hover:opacity-100", accents[accent])} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {Icon && (
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5">
              <Icon className="h-4 w-4 text-[#C084FC]" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
          <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {fmt(Math.round(display))}
          </span>
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
        {delta !== undefined && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                up ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400",
              )}
            >
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta)}%
            </span>
            <span className="text-muted-foreground">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
}
