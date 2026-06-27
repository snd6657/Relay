import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TopNav } from "@/components/top-nav";
import { StatusBadge } from "@/components/status-badge";
import { formatRelative, formatDuration } from "@/lib/mock-data";
import { GitBranch, Layers, AlertTriangle, Loader2 } from "lucide-react";
import { ApiClient } from "@/lib/api";

export const Route = createFileRoute("/memory")({
  head: () => ({ meta: [{ title: "Memory Center — Relay" }] }),
  component: MemoryPage,
});
function MemoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["memory"],
    queryFn: () => ApiClient.get("/memory/")
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { workflowRuns = [], companies = [], duplicates = [], memoryEvents = [] } = data || {};

  return (
    <>
      <TopNav
        title="Memory center"
        subtitle="Workflow history, prior analysis, and the agent's long-term recall."
      />
      <div className="px-6 pb-10 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-hairline bg-surface">
            <div className="px-5 py-4 border-b border-hairline flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display font-semibold text-ink">Workflow history</h3>
            </div>
            <ul className="divide-y divide-hairline">
              {workflowRuns.length === 0 && <li className="px-5 py-3 text-muted-foreground text-sm">No workflow history found.</li>}
              {workflowRuns.map((r: any) => (
                <li key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-[12px] text-ink">{r.id}</div>
                    <div className="text-xs text-muted-foreground">{r.projectName} · {formatRelative(r.startedAt)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-muted-foreground">{formatDuration(r.durationMs)}</span>
                    <span className="font-mono text-[11px] text-ink">{r.qualified}/{r.companiesAnalyzed}</span>
                    <StatusBadge status={r.status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-hairline bg-surface">
            <div className="px-5 py-4 border-b border-hairline flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display font-semibold text-ink">Previously analyzed companies</h3>
            </div>
            <ul className="divide-y divide-hairline">
              {companies.length === 0 && <li className="px-5 py-3 text-muted-foreground text-sm">No companies analyzed yet.</li>}
              {companies.slice(0, 5).map((c: any) => (
                <li key={c.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div>
                    <Link to="/companies/$id" params={{ id: c.id }} className="text-sm font-medium text-ink hover:text-ink">
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.industry} · {formatRelative(c.activity[0]?.ts ?? "")}</div>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">score {c.leadScore}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-hairline bg-surface">
          <div className="px-5 py-4 border-b border-hairline flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-score" />
            <h3 className="font-display font-semibold text-ink">Duplicate detection</h3>
          </div>
            <ul className="divide-y divide-hairline">
              {duplicates.length === 0 && <li className="px-5 py-3 text-muted-foreground text-sm">No duplicates detected yet.</li>}
              {duplicates.map((d: any) => (
              <li key={d.name} className="px-5 py-3 grid grid-cols-12 gap-3 items-center">
                <span className="col-span-3 text-sm font-medium text-ink">{d.name}</span>
                <span className="col-span-2 font-mono text-[11px] text-muted-foreground">{formatRelative(d.lastSeen)}</span>
                <span className="col-span-7 text-xs text-ink/80">{d.reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-hairline bg-surface">
          <div className="px-5 py-4 border-b border-hairline">
            <h3 className="font-display font-semibold text-ink">Agent memory timeline</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">most recent writes to the long-term memory store</p>
          </div>
          <ol className="px-5 py-4 space-y-3">
            {memoryEvents.length === 0 && <li className="text-muted-foreground text-sm">No memory events recorded yet.</li>}
            {memoryEvents.map((e: any, i: number) => (
              <li key={i} className="relative pl-5 font-mono text-[12px]">
                <span className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-ink" />
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {e.agent} · {formatRelative(e.ts)}
                </div>
                <div className="text-ink mt-0.5">{e.event}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}


