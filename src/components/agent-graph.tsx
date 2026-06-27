import { useEffect, useState } from "react";
import { agentPipeline, formatDuration, type AgentNode as Agent } from "@/lib/mock-data";
import { StatusBadge } from "./status-badge";
import { Cpu, Radar, Building2, UserSearch, Sparkles, Database, CheckSquare, Target } from "lucide-react";

const ICONS: Record<string, any> = {
  planner: Cpu,
  market_search: Radar,
  company_scraper: Building2,
  qualification: Target,
  contact_discovery: UserSearch,
  recommendation: Sparkles,
  human_approval: CheckSquare,
  memory: Database,
};

const TICKER_LINES = [
  "company_intelligence › enriching Lumenforge · 62% complete",
  "company_intelligence › stack overlap = 0.71 (snowflake, dbt, airflow, k8s)",
  "company_intelligence › computing lead_score · prior recall hit (memory)",
  "company_intelligence › lead_score=87 confidence=0.91",
  "company_intelligence › yielding state → contact_intelligence",
  "contact_intelligence › queued · awaits upstream",
];

export function AgentGraph({ pipeline }: { pipeline?: any[] }) {
  const [tick, setTick] = useState(0);

  // Extract all logs from the pipeline to show in the ticker
  const allLogs = pipeline 
    ? pipeline.flatMap(node => node.logs.map((l: string) => `${node.id} › ${l}`)) 
    : [];
    
  useEffect(() => {
    if (allLogs.length === 0) return;
    const id = setInterval(() => setTick((t) => (t + 1) % allLogs.length), 1800);
    return () => clearInterval(id);
  }, [allLogs.length]);

  if (!pipeline || pipeline.length === 0) {
    return null; // Or a minimal empty state
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface overflow-hidden">
      <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-ink">Agent pipeline</h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            Live trace of the AI workflow
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pipeline.some(n => n.status === 'running') && (
            <span className="signal-dot inline-flex h-2 w-2 rounded-full bg-signal" />
          )}
          <span className="font-mono text-[11px] uppercase tracking-wider text-signal">
            {pipeline.some(n => n.status === 'running') ? 'live' : 'idle'}
          </span>
        </div>
      </div>

      <div className="p-6 overflow-x-auto">
        <div className="flex items-stretch gap-3 min-w-[1100px]">
          {pipeline.map((node, i) => (
            <div key={node.id} className="flex-1 flex items-stretch gap-3">
              <AgentCard node={node} />
              {i < pipeline.length - 1 && (
                <EdgeConnector
                  fromStatus={node.status}
                  toStatus={pipeline[i + 1].status}
                  payload={node.payloadPreview}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {allLogs.length > 0 && (
        <div className="border-t border-hairline bg-canvas px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
              agent.reasoning
            </span>
            <div className="flex-1 h-5 overflow-hidden relative">
              <div key={tick} className="font-mono text-[12px] text-ink fade-up whitespace-nowrap">
                › {allLogs[tick]}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgentCard({ node }: { node: any }) {
  const Icon = ICONS[node.id] || Database;
  const isRunning = node.status === "running";
  const isDone = node.status === "done";
  const isQueued = node.status === "queued";

  return (
    <div
      className={[
        "relative w-[180px] shrink-0 rounded-xl border bg-surface p-3.5 transition-all",
        isRunning ? "border-signal shadow-[0_0_0_4px_rgba(45,91,255,0.08)]" : "border-hairline",
        isQueued ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {String(node.step).padStart(2, "0")}
        </span>
        {isRunning && <span className="signal-dot inline-flex h-1.5 w-1.5 rounded-full bg-signal" />}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div
          className={[
            "h-7 w-7 rounded-lg flex items-center justify-center",
            isRunning ? "bg-signal text-white" : isDone ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground",
          ].join(" ")}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <span className="font-display font-semibold text-[13px] text-ink leading-tight">{node.label}</span>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground line-clamp-2">{node.blurb}</p>

      <div className="mt-3 h-1 rounded-full bg-secondary overflow-hidden">
        <div
          className={["h-full transition-all", isRunning ? "bg-signal" : isDone ? "bg-success" : "bg-transparent"].join(" ")}
          style={{ width: `${node.progress}%` }}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <StatusBadge status={node.status} />
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
          {formatDuration(node.durationMs)}
        </span>
      </div>
    </div>
  );
}

function EdgeConnector({
  fromStatus,
  toStatus,
  payload,
}: {
  fromStatus: Agent["status"];
  toStatus: Agent["status"];
  payload: string;
}) {
  const active = fromStatus === "done" && (toStatus === "running" || toStatus === "queued");
  const flowing = fromStatus === "done" || fromStatus === "running";
  return (
    <div className="flex-1 min-w-[60px] relative flex flex-col items-center justify-center">
      <svg viewBox="0 0 100 24" className="w-full h-6" preserveAspectRatio="none">
        <line
          x1="0"
          y1="12"
          x2="100"
          y2="12"
          className={flowing ? "edge-active" : ""}
          stroke={flowing ? undefined : "var(--hairline)"}
          strokeWidth={flowing ? undefined : 2}
        />
        <polygon points="100,12 92,8 92,16" fill={flowing ? "var(--signal)" : "var(--hairline)"} />
      </svg>
      {active && (
        <div className="absolute inset-x-0 -bottom-1 overflow-hidden h-5">
          <div className="payload-slide whitespace-nowrap font-mono text-[9px] text-signal bg-signal/5 border border-signal/15 rounded px-1.5 py-0.5 inline-block">
            {payload.slice(0, 38)}…
          </div>
        </div>
      )}
    </div>
  );
}
