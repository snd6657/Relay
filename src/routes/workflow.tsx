import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { AgentGraph } from "@/components/agent-graph";
import { StatusBadge } from "@/components/status-badge";
import { Pause, Play, RotateCw } from "lucide-react";
import { ApiClient } from "@/lib/api";

export const Route = createFileRoute("/workflow")({
  head: () => ({ meta: [{ title: "Workflow monitor — Relay" }] }),
  component: WorkflowPage,
});

function formatDuration(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function WorkflowPage() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["workflow-status"],
    queryFn: () => ApiClient.get("/workflow/status/all"),
    refetchInterval: 5000, // Increased to 5s to handle large state payloads from Postgres
  });

  if (isLoading || !data) {
    return (
      <>
        <TopNav title="Workflow monitor" subtitle="Loading trace..." />
        <div className="px-6 pb-10 space-y-6">
          <div className="rounded-2xl border border-hairline bg-surface p-6 min-h-[200px] flex items-center justify-center">
             <div className="flex gap-4">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="h-12 w-12 rounded-lg bg-secondary animate-pulse" />
               ))}
             </div>
          </div>
        </div>
      </>
    );
  }

  const { projects = [] } = data;

  return (
    <>
      <TopNav
        title="Workflow monitor"
        subtitle="Live trace of the planner → market → company → contact → recommendation → memory pipeline across all projects."
        actions={
          <button 
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            <RotateCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />
      <div className="px-6 pb-10 space-y-12">
        {projects.length === 0 ? (
           <div className="py-12 text-center border border-dashed border-hairline rounded-2xl bg-surface/50">
             <h3 className="font-display font-semibold text-foreground">No workflows have been run</h3>
             <p className="text-sm text-muted-foreground mt-1 mb-4">Run a project workflow from the Projects page.</p>
           </div>
        ) : (
          projects.map((proj: any) => {
            const isPaused = proj.pipeline.some((n: any) => n.status === 'paused' && n.id !== 'human_approval');
            
            return (
              <div key={proj.project_id} className="space-y-4">
                <div className="flex items-center justify-between border-b border-hairline pb-2">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display font-semibold text-lg text-ink">Project: {proj.project_name}</h2>
                    <StatusBadge status={proj.workflow_status === "RUNNING" ? "running" : proj.workflow_status.toLowerCase()} />
                  </div>
                  
                  <div className="flex gap-2">
                    {isPaused ? (
                      <button 
                        onClick={async () => {
                          try {
                            await ApiClient.post(`/workflow/${proj.project_id}/resume`, { approved: true });
                            refetch();
                          } catch (e) {
                            alert('Could not resume workflow');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-hairline bg-surface text-xs font-medium hover:bg-secondary">
                        <Play className="h-3 w-3" /> Resume run
                      </button>
                    ) : (
                      <button 
                        onClick={async () => {
                          try {
                            await ApiClient.post(`/workflow/${proj.project_id}/pause`, {});
                            refetch();
                          } catch (e) {
                            alert('Could not pause workflow');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-hairline bg-surface text-xs font-medium hover:bg-secondary">
                        <Pause className="h-3 w-3" /> Pause run
                      </button>
                    )}
                  </div>
                </div>

                <AgentGraph pipeline={proj.pipeline} />

                {proj.pipeline.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    {proj.pipeline.map((node: any) => (
                      <div key={node.id} className="rounded-2xl border border-hairline bg-surface overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-hairline flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {String(node.step).padStart(2, "0")}
                            </span>
                            <h3 className="font-display font-semibold text-foreground text-[14px]">{node.label}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={node.status} />
                            <span className="font-mono text-[11px] text-muted-foreground">{formatDuration(node.durationMs)}</span>
                          </div>
                        </div>
                        <div className="px-5 py-3 border-b border-hairline bg-canvas/50">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">payload</span>
                          <pre className="mt-1 font-mono text-[11px] text-foreground whitespace-pre-wrap break-all">{node.payloadPreview}</pre>
                        </div>
                        <details className="px-5 py-3 group border-t border-hairline bg-surface">
                          <summary className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground cursor-pointer select-none list-none flex items-center justify-between [::-webkit-details-marker]:hidden">
                            <span>logs</span>
                            <span className="text-[9px] transition-transform group-open:rotate-180">▼</span>
                          </summary>
                          <ul className="mt-3 space-y-1">
                            {node.logs.map((log: string, i: number) => (
                              <li key={i} className="font-mono text-[11px] text-foreground/85 flex gap-2">
                                <span className="text-muted-foreground shrink-0">{String(i + 1).padStart(2, "0")}</span>
                                <span>{log}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

