import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { StatTile } from "@/components/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { AgentGraph } from "@/components/agent-graph";
import { Activity, Target, Sparkles, Gauge, Plus, Play, ArrowRight } from "lucide-react";
import { ApiClient } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Relay" },
      { name: "description", content: "Live multi-agent lead intelligence overview." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => ApiClient.get("/projects/dashboard"),
  });

  if (isLoading || !dashboard) {
    return (
      <>
        <TopNav title="Lead intelligence overview" subtitle="Loading dashboard..." />
        <div className="px-6 pb-10 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-surface border border-hairline p-5 animate-pulse" />
            ))}
          </div>
        </div>
      </>
    );
  }

  const { stats, recent_companies, top_recommendations } = dashboard;

  return (
    <>
      <TopNav
        title="Lead intelligence overview"
        subtitle="Live agent runs across your active ICP projects."
        actions={
          <>
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-hairline bg-surface text-sm font-medium hover:bg-secondary"
            >
              <Plus className="h-3.5 w-3.5" /> New project
            </Link>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              <Play className="h-3.5 w-3.5" /> Run workflow
            </Link>
          </>
        }
      />

      <div className="px-6 pb-10 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile label="Total Analyzed" value={stats.analyzed} delta="All time" icon={Activity} mono />
          <StatTile label="Qualified leads" value={stats.qualified} delta="All time" icon={Target} mono />
          <StatTile label="Pending Approvals" value={stats.pending_recommendations} delta="Requires review" icon={Sparkles} mono />
          <StatTile label="Active Projects" value={stats.active_projects} delta="Running" icon={Gauge} mono />
        </div>

        <AgentGraph />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-2xl border border-hairline bg-surface shadow-sm">
            <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
              <h3 className="font-display font-semibold text-foreground">Pending Recommendations</h3>
              <Link to="/companies" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                View all in Pipeline <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ul className="divide-y divide-hairline">
              {top_recommendations.length > 0 ? top_recommendations.map((r: any) => (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0 bg-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/companies/$id`} params={{ id: r.id.toString() }} className="font-display font-semibold text-foreground text-[14px] hover:text-primary transition-colors">
                          {r.companyName}
                        </Link>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {r.priority} priority
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-muted-foreground leading-snug truncate">{r.opportunity}</p>
                      <p className="mt-1.5 text-[12px] text-muted-foreground">
                        <span className="font-mono uppercase tracking-wider text-[10px] mr-1.5">Action</span>
                        <Link to={`/companies`} className="text-primary hover:underline">{r.nextBestAction}</Link>
                      </p>
                    </div>
                  </div>
                </li>
              )) : (
                <li className="px-5 py-10 text-center text-sm text-muted-foreground">No pending recommendations.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-hairline bg-surface shadow-sm">
            <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
              <h3 className="font-display font-semibold text-foreground">Recently Qualified</h3>
              <Link to="/companies" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                All companies <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ul className="divide-y divide-hairline">
              {recent_companies.length > 0 ? recent_companies.map((c: any) => (
                <li key={c.id} className="px-5 py-3.5 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <Link to={`/companies/$id`} params={{ id: c.id.toString() }} className="font-display font-semibold text-foreground hover:text-primary transition-colors">
                      {c.name || "Unknown"}
                    </Link>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">{c.domain}</div>
                </li>
              )) : (
                <li className="px-5 py-10 text-center text-sm text-muted-foreground">No qualified companies found.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
