import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { StatusBadge } from "@/components/status-badge";
import { ArrowLeft, ExternalLink, Mail, Phone, Linkedin } from "lucide-react";
import { ApiClient } from "@/lib/api";

export const Route = createFileRoute("/companies/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Company Details — Relay` }],
  }),
  component: CompanyDetail,
});

function CompanyDetail() {
  const { id } = Route.useParams();
  const projectId = 1;

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies", projectId],
    queryFn: () => ApiClient.get(`/projects/${projectId}/companies`),
  });

  if (isLoading) {
    return <TopNav title="Loading..." subtitle="Fetching company details" />;
  }

  const c = companies.find((comp: any) => comp.id === parseInt(id));

  if (!c) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Company not found.
        <br />
        <Link to="/companies" className="text-primary hover:underline mt-4 inline-block">Return to Companies</Link>
      </div>
    );
  }

  return (
    <>
      <TopNav
        title={c.name || "Unknown Company"}
        subtitle={c.domain}
        actions={
          <Link to="/companies" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-hairline bg-surface text-sm font-medium hover:bg-secondary">
            <ArrowLeft className="h-3.5 w-3.5" /> All companies
          </Link>
        }
      />
      <div className="px-6 pb-10 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-display font-bold text-foreground text-xl">{c.name || "Unknown Company"}</h2>
                <a href={`https://${c.domain}`} target="_blank" rel="noreferrer" className="text-sm text-primary inline-flex items-center gap-1 mt-0.5 hover:underline">
                  {c.domain} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={c.status} />
                <StatusBadge status={c.human_status} />
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-canvas border border-hairline p-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">AI Recommendation & Strategy</span>
              <p className="mt-1.5 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {c.recommendation || "No recommendation generated."}
              </p>
            </div>

            <div className="mt-6 rounded-lg bg-canvas border border-hairline p-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Qualification Reasoning</span>
              <p className="mt-1.5 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {c.qualification_reason || "No reasoning available."}
              </p>
            </div>
            
            <div className="mt-6 rounded-lg bg-canvas border border-hairline p-4 max-h-96 overflow-y-auto">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Raw Markdown (Scraped)</span>
              <pre className="mt-1.5 text-[11px] text-muted-foreground font-mono whitespace-pre-wrap">
                {c.raw_markdown ? c.raw_markdown.substring(0, 2000) + "..." : "No markdown available."}
              </pre>
            </div>
          </div>

        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-hairline bg-surface shadow-sm mb-6">
            <div className="px-5 py-4 border-b border-hairline">
              <h3 className="font-display font-semibold text-foreground">Company Intelligence</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Industry</span>
                <p className="mt-1 text-sm text-foreground">{c.metadata_json?.industry || "Unknown"}</p>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Company Size</span>
                <p className="mt-1 text-sm text-foreground">{c.metadata_json?.employee_count || "Unknown"} employees</p>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Funding Stage</span>
                <p className="mt-1 text-sm text-foreground">{c.metadata_json?.funding_stage || "Unknown"}</p>
              </div>
              {c.metadata_json?.tech_stack && c.metadata_json.tech_stack.length > 0 && (
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Tech Stack</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.metadata_json.tech_stack.map((tech: string, i: number) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-sm bg-secondary text-[11px] text-foreground font-mono">{tech}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface shadow-sm">
            <div className="px-5 py-4 border-b border-hairline">
              <h3 className="font-display font-semibold text-foreground">Discovered Contacts</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {!c.contacts || c.contacts.length === 0 ? "No contacts found." : `${c.contacts.length} resolved by AI.`}
              </p>
            </div>
            {!c.contacts || c.contacts.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                No contacts discovered during the pipeline run.
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {c.contacts.map((p: any, idx: number) => (
                  <li key={idx} className="px-5 py-4 flex flex-col gap-2">
                    <div>
                      <div className="font-display font-semibold text-foreground text-[14px]">{p.first_name} {p.last_name}</div>
                      <div className="text-xs text-muted-foreground">{p.position || "Unknown Role"}</div>
                    </div>
                    <div className="flex flex-col gap-1 font-mono text-[11px] text-muted-foreground mt-2">
                      {p.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3 text-primary" /> {p.email}</span>}
                      {p.linkedin_url && <span className="inline-flex items-center gap-1.5"><Linkedin className="h-3 w-3 text-primary" /> {p.linkedin_url}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
