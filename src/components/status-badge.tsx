import type { AgentStatus, CompanyStatus, RecommendationStatus } from "@/lib/mock-data";

type AnyStatus = AgentStatus | CompanyStatus | RecommendationStatus | "completed" | "running" | "failed";

const styles: Record<string, string> = {
  // agent
  queued: "bg-secondary text-muted-foreground border-hairline",
  running: "bg-signal/10 text-signal border-signal/20",
  done: "bg-success/10 text-success border-success/20",
  failed: "bg-danger/10 text-danger border-danger/20",
  // company
  qualified: "bg-success/10 text-success border-success/20",
  in_review: "bg-score/15 text-score border-score/25",
  rejected: "bg-danger/10 text-danger border-danger/20",
  enriching: "bg-signal/10 text-signal border-signal/20",
  // rec
  pending: "bg-score/15 text-score border-score/25",
  approved: "bg-success/10 text-success border-success/20",
  // run
  completed: "bg-success/10 text-success border-success/20",
};

const labels: Record<string, string> = {
  in_review: "In review",
};

export function StatusBadge({ status, withDot = true }: { status: AnyStatus; withDot?: boolean }) {
  const live = status === "running" || status === "enriching";
  const label = labels[status] ?? status.replace(/_/g, " ");
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
        styles[status] ?? "bg-secondary text-muted-foreground border-hairline",
      ].join(" ")}
    >
      {withDot && (
        <span
          className={[
            "h-1.5 w-1.5 rounded-full bg-current",
            live ? "signal-dot" : "",
          ].join(" ")}
        />
      )}
      {label}
    </span>
  );
}
