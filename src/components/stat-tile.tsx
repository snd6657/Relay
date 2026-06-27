import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  label: string;
  value: string | number;
  delta?: string;
  icon?: LucideIcon;
  mono?: boolean;
  trend?: "up" | "down" | "flat";
}

export function StatTile({ label, value, delta, icon: Icon, mono, trend = "up" }: StatTileProps) {
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-muted-foreground";
  return (
    <div className="rounded-xl border border-hairline bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={["text-3xl font-display font-bold text-ink tracking-tight", mono ? "font-mono" : ""].join(" ")}>
          {value}
        </span>
        {delta && <span className={["text-xs font-medium", trendColor].join(" ")}>{delta}</span>}
      </div>
    </div>
  );
}
