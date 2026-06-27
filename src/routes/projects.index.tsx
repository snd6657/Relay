import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { StatusBadge } from "@/components/status-badge";
import { Plus, Play, Trash2, Loader2 } from "lucide-react";
import { ApiClient } from "@/lib/api";

export const Route = createFileRoute("/projects/")({
  head: () => ({ meta: [{ title: "Projects — Relay" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => ApiClient.get("/projects/"),
  });

  const runMutation = useMutation({
    mutationFn: (projectId: number) => ApiClient.post(`/workflow/${projectId}/run`),
    onSuccess: () => {
      navigate({ to: "/workflow" });
    },
    onError: (err: any) => {
      if (err.response?.status === 409) {
        navigate({ to: "/workflow" });
      } else {
        alert("Failed to start workflow: " + err.message);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (projectId: number) => ApiClient.delete(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      alert("Failed to delete project: " + err.message);
    }
  });

  if (isLoading) {
    return <TopNav title="Loading..." subtitle="Fetching your projects" />;
  }

  return (
    <>
      <TopNav
        title="Projects"
        subtitle="Each project defines an ICP and runs as a recurring multi-agent workflow."
        actions={
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" /> New project
          </Link>
        }
      />
      <div className="px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p: any) => (
            <div key={p.id} className="rounded-2xl border border-hairline bg-surface p-5 shadow-sm hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-foreground text-[15px]">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.description || "No description"}</p>
                </div>
                <button 
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this project?")) {
                      deleteMutation.mutate(p.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center transition-colors text-muted-foreground disabled:opacity-50"
                  title="Delete Project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-y-2 text-[12px]">
                <Field label="Regions" value={p.icp?.geographies?.join(", ") || "Any"} />
                <Field label="Employees" value={p.icp?.employee_count_max ? `< ${p.icp.employee_count_max}` : "Any"} />
                <Field label="Industries" value={p.icp?.industries?.length ? `${p.icp.industries.length} selected` : "Any"} />
                <Field label="Personas" value={`${p.personas?.length || 0} roles`} />
              </dl>

              <div className="mt-4 flex flex-wrap gap-1">
                {p.icp?.keywords?.map((t: string) => (
                  <span key={t} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary text-foreground/80">{t}</span>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-hairline flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.is_active ? "active" : "inactive"} />
                </div>
                <button 
                  onClick={() => runMutation.mutate(p.id)}
                  disabled={runMutation.isPending}
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  {runMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  {runMutation.isPending ? "Starting..." : "Run workflow"}
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-hairline rounded-2xl bg-surface/50">
              <h3 className="font-display font-semibold text-foreground">No projects found</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first project to start generating leads.</p>
              <Link to="/projects/new" className="inline-flex items-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                Create Project
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground text-right font-medium truncate pr-2" title={value}>{value}</dd>
    </>
  );
}
