import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Relay" }] }),
  component: SettingsPage,
});

const input = "w-full h-9 px-3 rounded-md border border-hairline bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-ring/20";

function SettingsPage() {
  return (
    <>
      <TopNav title="Settings" subtitle="Defaults applied to every new project and workflow run." />
      <div className="px-6 pb-10 max-w-3xl space-y-6">
        <Card title="Business rules" desc="Global rules layered on top of per-project rules.">
          <textarea
            rows={5}
            defaultValue={`disqualify_if: company.employees < 50\ndisqualify_if: company.funding_stage == "pre_seed"\nflag_for_review_if: company.location.country in ["sanctioned_list"]\nrequire_human_approval_if: recommendation.confidence < 0.75`}
            className={input + " font-mono text-[12px] resize-none h-auto py-2"}
          />
        </Card>

        <Card title="Target personas" desc="Default roles the contact agent will resolve.">
          <div className="flex flex-wrap gap-2">
            {["CEO", "CTO", "VP Engineering", "Director of AI", "Head of Data", "Head of Platform"].map((p) => (
              <label key={p} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-hairline bg-surface text-xs cursor-pointer has-[:checked]:border-ink has-[:checked]:bg-ink/5 has-[:checked]:text-ink">
                <input type="checkbox" className="sr-only" defaultChecked={["CEO", "CTO", "VP Engineering", "Director of AI"].includes(p)} />
                <span>{p}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card title="ICP templates" desc="Reusable ICP definitions you can apply to new projects.">
          <ul className="divide-y divide-hairline -mx-6 -mb-6">
            {[
              { name: "Series B–D Infra (NA)", uses: 4 },
              { name: "EU Series C+ Analytics", uses: 2 },
              { name: "Computer Vision Watchlist", uses: 1 },
            ].map((t) => (
              <li key={t.name} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-ink">{t.name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">used by {t.uses} project{t.uses === 1 ? "" : "s"}</div>
                </div>
                <button className="text-xs font-medium text-ink hover:underline">Edit</button>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Notifications" desc="Where new recommendations and run results are sent.">
          <Row label="Email digest" defaultEnabled />
          <Row label="Slack channel · #lead-intel" defaultEnabled />
          <Row label="Webhook · /v1/recs/created" />
        </Card>

        <Card title="Appearance" desc="Visual density and accent.">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Density</span>
              <select className={input + " mt-1"} defaultValue="compact">
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Accent</span>
              <select className={input + " mt-1"} defaultValue="signal">
                <option value="signal">Signal blue</option>
                <option value="score">Score amber</option>
              </select>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6">
      <div className="mb-4">
        <h2 className="font-display font-semibold text-ink">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Row({ label, defaultEnabled = false }: { label: string; defaultEnabled?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0 border-b border-hairline last:border-0">
      <span className="text-sm text-ink">{label}</span>
      <input type="checkbox" defaultChecked={defaultEnabled} className="h-4 w-4 accent-signal" />
    </div>
  );
}


