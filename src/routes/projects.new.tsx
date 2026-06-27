import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { ChevronLeft, Play, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, type ProjectFormValues } from "@/lib/schemas";
import { ApiClient } from "@/lib/api";

export const Route = createFileRoute("/projects/new")({
  head: () => ({ meta: [{ title: "New project — Relay" }] }),
  component: NewProjectPage,
});

const PERSONAS = ["CEO", "CTO", "VP Engineering", "Director of AI"];

function NewProjectPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "Q4 — Series C+ infra accounts",
      description: "Targeting AI infra companies",
      icp: {
        industries: "Data / MLOps / Analytics",
        geographies: "us-ca",
        keywords: "AI, ML, B2B",
        size_range: "100-800",
        description: "Series B–D tech companies, 100–800 employees, recently raised funding or actively hiring AI/ML roles, using modern data/infra stacks.",
      },
      personas: [
        { title: "CTO", seniority: "C-Level", department: "Engineering" },
        { title: "VP Engineering", seniority: "VP", department: "Engineering" }
      ],
      business_rules: [
        { rule_type: "disqualify_if", description: "company.employees < 100", is_strict: true },
        { rule_type: "disqualify_if", description: "company.funding_stage in [pre_seed, seed]", is_strict: true }
      ]
    }
  });

  const personas = watch("personas");
  const business_rules = watch("business_rules");

  const togglePersona = (p: string) => {
    const current = [...personas];
    const index = current.findIndex(x => x.title === p);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push({ title: p, seniority: "", department: "" });
    }
    setValue("personas", current);
  };

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      setIsSubmitting(true);
      const sizeParts = data.icp.size_range.split("-");
      const backendData = {
        name: data.name,
        description: data.description,
        icp: {
          industries: typeof data.icp.industries === "string" ? data.icp.industries.split(",").map(s => s.trim()) : [],
          geographies: typeof data.icp.geographies === "string" ? data.icp.geographies.split(",").map(s => s.trim()) : [],
          keywords: typeof data.icp.keywords === "string" ? data.icp.keywords.split(",").map(s => s.trim()) : [],
          employee_count_min: parseInt(sizeParts[0]) || 0,
          employee_count_max: parseInt(sizeParts[1]) || 0,
        },
        personas: data.personas,
        business_rules: data.business_rules,
      };

      const res = await ApiClient.post("/projects/", backendData);
      
      // Optionally start workflow right away if user clicked "Save & Run"
      // But we just have one submit handler. Let's just create it and redirect.
      console.log("Project created:", res);
      
      navigate({ to: "/projects" });
    } catch (err) {
      console.error(err);
      alert("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TopNav
        title="New project"
        subtitle="Define the ICP your agent pipeline will hunt against."
        actions={
          <>
            <Link to="/projects" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-hairline bg-surface text-sm font-medium hover:bg-secondary">
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </Link>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-ink text-primary-foreground text-sm font-medium hover:opacity-90">
              <Save className="h-3.5 w-3.5" /> {isSubmitting ? "Saving..." : "Save project"}
            </button>
          </>
        }
      />

      <div className="px-6 pb-10 max-w-4xl">
        <div className="space-y-6">
          <Section title="Identity" desc="What this project is hunting for.">
            <Field label="Project name" error={errors.name?.message}>
              <input className={input} {...register("name")} />
            </Field>
            <Field label="Description">
              <input className={input} {...register("description")} />
            </Field>
            
            <Field label="ICP description" error={errors.icp?.description?.message}>
              <textarea
                rows={3}
                className={input + " resize-none"}
                {...register("icp.description")}
              />
            </Field>
          </Section>

          <Section title="Firmographics" desc="Hard filters applied before scoring.">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Industries (comma-separated)" error={errors.icp?.industries?.message}>
                <input className={input} placeholder="e.g. Software, Healthcare" {...register("icp.industries")} />
              </Field>
              <Field label="Geographies (comma-separated)" error={errors.icp?.geographies?.message}>
                <input className={input} placeholder="e.g. US, Europe" {...register("icp.geographies")} />
              </Field>
              <Field label="Keywords (comma-separated)" error={errors.icp?.keywords?.message}>
                <input className={input} placeholder="e.g. AI, B2B SaaS" {...register("icp.keywords")} />
              </Field>
              <Field label="Size Range" error={errors.icp?.size_range?.message}>
                <select className={input} {...register("icp.size_range")}>
                  <option value="50-250">50–250</option>
                  <option value="100-800">100–800</option>
                  <option value="500-2000">500–2000</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Target personas" desc="Contact Intelligence will resolve these roles.">
            <div className="flex flex-wrap gap-2">
              {PERSONAS.map((p) => {
                const isChecked = personas.some(x => x.title === p);
                return (
                  <label key={p} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-hairline bg-surface text-xs cursor-pointer hover:bg-secondary has-[:checked]:border-signal has-[:checked]:bg-signal/5 has-[:checked]:text-signal">
                    <input type="checkbox" className="sr-only" checked={isChecked} onChange={() => togglePersona(p)} />
                    <span>{p}</span>
                  </label>
                )
              })}
            </div>
          </Section>

          <Section title="Business rules" desc="Auto-disqualify candidates that match any rule.">
            <div className="space-y-2">
              {business_rules.map((rule, idx) => (
                <div key={idx} className="flex gap-2">
                  <input className={input + " font-mono text-[12px] flex-1"} {...register(`business_rules.${idx}.description` as const)} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </form>
  );
}

const input = "w-full min-h-9 px-3 py-1.5 rounded-md border border-hairline bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring/40 text-foreground";

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="font-display font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {error && <span className="text-[10px] text-destructive">{error}</span>}
      </div>
      <div>{children}</div>
    </label>
  );
}
