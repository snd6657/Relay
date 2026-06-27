import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { StatTile } from "@/components/stat-tile";
import { Activity, CheckCircle2, Gauge, Timer } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Relay" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8001/api/v1/analytics")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 font-mono text-sm text-muted-foreground">Loading Analytics...</div>;
  if (!data) return <div className="p-10 font-mono text-sm text-danger">Failed to load analytics data.</div>;

  const { daily_runs, qual_dist, conf_buckets, agent_time, workflow_success, avg_confidence, total_runs } = data;
  
  const maxRuns = Math.max(...daily_runs, 1);
  const maxConf = Math.max(...conf_buckets.map((b: any) => b.count), 1);
  const maxAgent = Math.max(...agent_time.map((a: any) => a.ms), 1);

  return (
    <>
      <TopNav title="Analytics" subtitle="14-day rolling view across all projects." />
      <div className="px-6 pb-10 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile label="Workflow success" value={`${workflow_success}%`} icon={CheckCircle2} mono />
          <StatTile label="Avg confidence" value={avg_confidence.toFixed(2)} icon={Gauge} mono />
          <StatTile label="Runs (14d)" value={total_runs} icon={Activity} mono />
          <StatTile label="Avg run time" value="4m 12s" icon={Timer} mono />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-hairline bg-surface p-5">
            <h3 className="font-display font-semibold text-ink">Daily agent runs</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">last 14 days · all projects</p>
            <div className="mt-5 flex items-end gap-1.5 h-44">
              {daily_runs.map((v: number, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full bg-canvas rounded-t-sm overflow-hidden flex items-end h-full">
                    <div className="w-full bg-ink rounded-t-sm" style={{ height: `${(v / maxRuns) * 100}%` }} />
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-surface p-5">
            <h3 className="font-display font-semibold text-ink">Lead qualification</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">company.status distribution</p>
            <div className="mt-5 space-y-3">
              {qual_dist.map((q: any) => (
                <div key={q.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-ink">{q.label}</span>
                    <span className="font-mono text-muted-foreground">{q.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-canvas overflow-hidden">
                    <div className={["h-full", q.color].join(" ")} style={{ width: `${q.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-hairline bg-surface p-5">
            <h3 className="font-display font-semibold text-ink">Confidence distribution</h3>
            <div className="mt-5 space-y-2">
              {conf_buckets.map((b: any) => (
                <div key={b.range} className="grid grid-cols-12 items-center gap-3">
                  <span className="col-span-3 font-mono text-[11px] text-ink">{b.range}</span>
                  <div className="col-span-7 h-2 rounded-full bg-canvas overflow-hidden">
                    <div className="h-full bg-score" style={{ width: `${(b.count / maxConf) * 100}%` }} />
                  </div>
                  <span className="col-span-2 text-right font-mono text-[11px] text-muted-foreground">{b.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-surface p-5">
            <h3 className="font-display font-semibold text-ink">Avg execution time per agent</h3>
            <div className="mt-5 space-y-2">
              {agent_time.map((a: any) => (
                <div key={a.agent} className="grid grid-cols-12 items-center gap-3">
                  <span className="col-span-4 font-mono text-[11px] text-ink truncate">{a.agent}</span>
                  <div className="col-span-6 h-2 rounded-full bg-canvas overflow-hidden">
                    <div className="h-full bg-ink" style={{ width: `${(a.ms / maxAgent) * 100}%` }} />
                  </div>
                  <span className="col-span-2 text-right font-mono text-[11px] text-muted-foreground">{(a.ms / 1000).toFixed(1)}s</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
