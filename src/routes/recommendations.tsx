import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TopNav } from "@/components/top-nav";
import { ConfidencePill } from "@/components/score-pill";
import { StatusBadge } from "@/components/status-badge";
import { formatRelative, RecommendationStatus } from "@/lib/mock-data";
import { Check, X, Pencil, Loader2 } from "lucide-react";
import { ApiClient } from "@/lib/api";

export const Route = createFileRoute("/recommendations")({
  head: () => ({ meta: [{ title: "Recommendations — Relay" }] }),
  component: RecsPage,
});

function RecsPage() {
  const queryClient = useQueryClient();
  
  const { data: recs = [], isLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => ApiClient.get("/recommendations/")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: RecommendationStatus }) => {
      return ApiClient.put(`/recommendations/${id}`, { status });
    },
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["recommendations"] });

      // Snapshot the previous value
      const previousRecs = queryClient.getQueryData(["recommendations"]);

      // Optimistically update to the new value instantly
      queryClient.setQueryData(["recommendations"], (old: any) => {
        if (!old) return old;
        return old.map((r: any) => r.id === id ? { ...r, status } : r);
      });

      return { previousRecs };
    },
    onError: (err, newRec, context) => {
      // If it fails, roll back to previous state
      queryClient.setQueryData(["recommendations"], context?.previousRecs);
    },
    onSettled: () => {
      // Background refetch to ensure true sync with database
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    }
  });

  const updateStatus = (id: string, status: RecommendationStatus) => {
    // In a real app we'd hit the API, for now we will just locally invalidate or update
    updateMutation.mutate({ id, status });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <TopNav
        title="Recommendations"
        subtitle="Synthesized by the recommendation agent from validated company + contact state."
      />
      <div className="px-6 pb-10 space-y-4">
        {recs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No recommendations pending review.
          </div>
        )}
        {recs.map((r: any) => (
          <div key={r.id} className="rounded-2xl border border-hairline bg-surface p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <span
                  className={[
                    "mt-1.5 h-2 w-2 rounded-full shrink-0",
                    r.priority === "high" ? "bg-danger" : r.priority === "medium" ? "bg-score" : "bg-muted-foreground",
                  ].join(" ")}
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to="/companies/$id"
                      params={{ id: r.companyId }}
                      className="font-display font-bold text-ink text-lg hover:text-ink"
                    >
                      {r.companyName}
                    </Link>
                    <StatusBadge status={r.status} />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {r.priority} priority
                    </span>
                    <ConfidencePill value={r.confidence} />
                    <span className="font-mono text-[11px] text-muted-foreground">· {formatRelative(r.createdAt)}</span>
                  </div>
                  <p className="text-sm text-ink mt-2 leading-relaxed max-w-2xl">{r.opportunity}</p>
                </div>
              </div>

              {r.status === "pending" && (
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-hairline bg-surface text-sm font-medium hover:bg-secondary">
                    <Pencil className="h-3.5 w-3.5" /> Modify
                  </button>
                  <button onClick={() => updateStatus(r.id, "rejected")} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-danger/30 bg-surface text-danger text-sm font-medium hover:bg-danger/5">
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                  <button onClick={() => updateStatus(r.id, "approved")} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-success text-white text-sm font-medium hover:opacity-90">
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 rounded-lg bg-canvas border border-hairline p-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">agent reasoning</span>
                <p className="mt-1.5 text-sm text-ink leading-relaxed">{r.reasoning}</p>
                <div className="mt-3 pt-3 border-t border-hairline">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">next best action</span>
                  <p className="mt-1 text-sm text-ink">{r.nextBestAction}</p>
                </div>
              </div>
              <div className="rounded-lg border border-hairline p-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">evidence</span>
                <ul className="mt-2 space-y-1.5">
                  {(r.evidence || []).map((e: string, i: number) => (
                    <li key={i} className="text-[12px] text-ink flex gap-2">
                      <span className="text-ink shrink-0">▸</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}


