import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { StatusBadge } from "@/components/status-badge";
import { Search, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { ApiClient } from "@/lib/api";

export const Route = createFileRoute("/companies/")({
  head: () => ({ meta: [{ title: "Companies — Relay" }] }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => ApiClient.get(`/projects/`),
  });

  // Dynamically use the most recent project ID (or fallback to 1)
  const projectId = projects.length > 0 ? projects[projects.length - 1].id : 1;

  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companies", projectId],
    queryFn: () => ApiClient.get(`/projects/${projectId}/companies`),
    enabled: projects.length > 0, // Only run once we have a project ID
  });

  const isLoading = isLoadingProjects || isLoadingCompanies;

  const resumeMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string, approved: boolean }) => 
      ApiClient.put(`/recommendations/${id}`, { status: approved ? "approved" : "rejected" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", projectId] });
    },
  });

  const filteredCompanies = companies.filter((c: any) => {
    const matchesSearch = c.name.toLowerCase().includes(q.toLowerCase()) || c.domain.toLowerCase().includes(q.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "pending_review" && c.human_status === "PENDING_REVIEW") ||
      (statusFilter === "approved" && c.human_status === "APPROVED") ||
      (statusFilter === "rejected" && c.human_status === "REJECTED") ||
      (statusFilter === "qualified" && c.status === "QUALIFIED") ||
      (statusFilter === "disqualified" && c.status === "REJECTED");
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <TopNav title="Companies" subtitle="Loading companies..." />;
  }

  return (
    <>
      <TopNav
        title="Pipeline Dashboard"
        subtitle={`${companies.length} companies analyzed in the current workflow.`}
      />
      <div className="px-6 pb-10 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search company, domain…"
              className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 text-foreground"
            />
          </div>
          {(["all", "pending_review", "approved", "rejected", "qualified", "disqualified"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={[
                "h-9 px-3 rounded-md text-xs font-medium border transition-colors capitalize",
                statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-hairline text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-hairline bg-surface overflow-x-auto shadow-sm">
          <div className="min-w-[1000px]">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-hairline bg-canvas font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <div className="col-span-3">Company</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-2">AI Status</div>
            <div className="col-span-2">Human Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <ul className="divide-y divide-hairline">
            {filteredCompanies.map((c: any) => (
              <li key={c.id} className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-canvas transition-colors group">
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <div className="font-display font-semibold text-foreground text-[14px] group-hover:text-primary transition-colors">{c.name || "Unknown"}</div>
                    {c.lead_score && (
                      <span className="px-1.5 py-0.5 rounded bg-score text-canvas text-[10px] font-bold">
                        {c.lead_score}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">{c.domain}</div>
                </div>
                <div className="col-span-3 text-xs text-muted-foreground truncate pr-4">
                  {c.description || c.recommendation || "No description provided."}
                </div>
                <div className="col-span-2 flex items-center">
                   <StatusBadge status={c.status} />
                </div>
                <div className="col-span-2 flex items-center">
                   <StatusBadge status={c.human_status} />
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  {c.human_status === "PENDING_REVIEW" && (
                    <>
                      <button 
                        onClick={() => resumeMutation.mutate({ id: c.id, approved: true })}
                        disabled={resumeMutation.isPending}
                        className="p-1.5 text-success hover:bg-success/10 rounded-md transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => resumeMutation.mutate({ id: c.id, approved: false })}
                        disabled={resumeMutation.isPending}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Reject"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <Link
                    to="/companies/$id"
                    params={{ id: c.id }}
                    className="p-1.5 text-muted-foreground hover:bg-secondary rounded-md transition-colors ml-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            ))}
            {filteredCompanies.length === 0 && (
              <li className="px-5 py-16 flex flex-col items-center justify-center text-center">
                <h3 className="font-display font-semibold text-foreground text-[15px]">No companies found for those rules</h3>
                <p className="text-sm text-muted-foreground mt-1">Adjust your filters or try editing the ICP and business rules.</p>
              </li>
            )}
          </ul>
          </div>
        </div>
      </div>
    </>
  );
}
