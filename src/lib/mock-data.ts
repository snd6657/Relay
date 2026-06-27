// Mock data shaped exactly like the future FastAPI + LangGraph backend would return.
// Replace these objects with fetch() calls; component contracts stay the same.

export type AgentName =
  | "planner"
  | "market_intelligence"
  | "company_intelligence"
  | "contact_intelligence"
  | "recommendation"
  | "memory";

export type AgentStatus = "queued" | "running" | "done" | "failed";

export interface AgentNode {
  id: AgentName;
  step: number;
  label: string;
  blurb: string;
  status: AgentStatus;
  durationMs: number | null;
  progress: number; // 0-100
  payloadPreview: string; // JSON snippet, mono
  logs: string[];
}

export const agentPipeline: AgentNode[] = [
  {
    id: "planner",
    step: 1,
    label: "Planner",
    blurb: "Plans the workflow graph and routes state between agents.",
    status: "done",
    durationMs: 1840,
    progress: 100,
    payloadPreview: `{ "plan": ["market","company","contact","recommend"], "icp": "series_b_d_tech" }`,
    logs: [
      "Parsed project ICP: Series B–D · 100–800 employees",
      "Selected 4-agent execution graph",
      "Routing state → market_intelligence",
    ],
  },
  {
    id: "market_intelligence",
    step: 2,
    label: "Market Intelligence",
    blurb: "Scans funding rounds, hiring signals, and web mentions to surface candidate companies.",
    status: "done",
    durationMs: 14210,
    progress: 100,
    payloadPreview: `{ "candidates": 42, "filters": { "funding": ">=series_b", "growth_yoy": ">15%" } }`,
    logs: [
      "Crawled 3 funding feeds · 1,204 rounds inspected",
      "Filtered to 86 candidates matching ICP heuristics",
      "Cross-referenced hiring signals → 42 retained",
    ],
  },
  {
    id: "company_intelligence",
    step: 3,
    label: "Company Intelligence",
    blurb: "Validates each candidate, enriches firmographics, and computes the Lead Score.",
    status: "running",
    durationMs: null,
    progress: 62,
    payloadPreview: `{ "enriching": "Lumenforge", "stack_match": 0.71, "lead_score": 87 }`,
    logs: [
      "Enriching Lumenforge · Snowflake + dbt detected",
      "Computing stack overlap against seller integrations",
      "Lead Score 87 · Confidence 0.91 → memory.write",
    ],
  },
  {
    id: "contact_intelligence",
    step: 4,
    label: "Contact Intelligence",
    blurb: "Resolves CEO / CTO / VP Engineering / Director AI with email, phone, LinkedIn.",
    status: "queued",
    durationMs: null,
    progress: 0,
    payloadPreview: `{ "awaiting": "company_intelligence.complete" }`,
    logs: ["Waiting on upstream agent"],
  },
  {
    id: "recommendation",
    step: 5,
    label: "Recommendation",
    blurb: "Synthesizes Business Opportunity, Confidence Score, and Next Best Action.",
    status: "queued",
    durationMs: null,
    progress: 0,
    payloadPreview: `{ "awaiting": "contact_intelligence.complete" }`,
    logs: ["Waiting on upstream agent"],
  },
  {
    id: "memory",
    step: 6,
    label: "Memory Update",
    blurb: "Persists workflow trace, dedupes against prior analysis, embeds into pgvector.",
    status: "queued",
    durationMs: null,
    progress: 0,
    payloadPreview: `{ "awaiting": "recommendation.complete" }`,
    logs: ["Waiting on upstream agent"],
  },
];

// ---------- Companies ----------

export type FundingStage = "Seed" | "Series A" | "Series B" | "Series C" | "Series D" | "Series E+";
export type CompanyStatus = "qualified" | "in_review" | "rejected" | "enriching";

export interface Contact {
  id: string;
  name: string;
  title: "CEO" | "CTO" | "VP Engineering" | "Director of AI";
  email: string;
  phone: string;
  linkedin: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  location: string;
  employees: number;
  employeeGrowthYoY: number;
  funding: FundingStage;
  fundingAmountUsd: number;
  fundingDate: string;
  techStack: string[];
  openAiRoles: number;
  leadScore: number;
  confidence: number;
  status: CompanyStatus;
  reasoning: string;
  recentNews: { date: string; headline: string }[];
  contacts: Contact[];
  activity: { ts: string; agent: AgentName; event: string }[];
}

export const companies: Company[] = [
  {
    id: "co_lumenforge",
    name: "Lumenforge",
    domain: "lumenforge.io",
    industry: "Data Infrastructure",
    location: "Austin, TX",
    employees: 340,
    employeeGrowthYoY: 38,
    funding: "Series C",
    fundingAmountUsd: 72_000_000,
    fundingDate: "2026-03-14",
    techStack: ["Snowflake", "dbt", "Airflow", "Kubernetes", "Kafka"],
    openAiRoles: 3,
    leadScore: 87,
    confidence: 0.91,
    status: "qualified",
    reasoning:
      "Recent $72M Series C plus 3 open MLOps reqs signal active budget and urgency. Stack overlap (Snowflake + dbt + Airflow) matches 4 of 6 seller integrations.",
    recentNews: [
      { date: "2026-06-18", headline: "Lumenforge expands platform team, opens Austin engineering hub" },
      { date: "2026-03-14", headline: "Lumenforge raises $72M Series C led by Index Ventures" },
    ],
    contacts: [
      { id: "c1", name: "Priya Raman", title: "CTO", email: "priya.raman@lumenforge.io", phone: "+1 (512) 555-0142", linkedin: "linkedin.com/in/priya-raman" },
      { id: "c2", name: "Marcus Hale", title: "VP Engineering", email: "marcus.hale@lumenforge.io", phone: "+1 (512) 555-0188", linkedin: "linkedin.com/in/marcushale" },
      { id: "c3", name: "Elena Cho", title: "Director of AI", email: "elena.cho@lumenforge.io", phone: "+1 (512) 555-0211", linkedin: "linkedin.com/in/elenacho" },
    ],
    activity: [
      { ts: "2026-06-26T09:14:02Z", agent: "market_intelligence", event: "Surfaced as candidate from Series C feed" },
      { ts: "2026-06-26T09:14:48Z", agent: "company_intelligence", event: "Lead Score 87 · Confidence 0.91" },
      { ts: "2026-06-26T09:15:31Z", agent: "contact_intelligence", event: "Resolved 3 decision makers" },
      { ts: "2026-06-26T09:16:02Z", agent: "recommendation", event: "Drafted intro email to CTO" },
    ],
  },
  {
    id: "co_nimbus",
    name: "Nimbus Stack",
    domain: "nimbusstack.ai",
    industry: "MLOps",
    location: "Toronto, ON",
    employees: 180,
    employeeGrowthYoY: 24,
    funding: "Series B",
    fundingAmountUsd: 31_000_000,
    fundingDate: "2026-01-22",
    techStack: ["Kubernetes", "MLflow", "Ray", "PostgreSQL"],
    openAiRoles: 2,
    leadScore: 74,
    confidence: 0.82,
    status: "qualified",
    reasoning:
      "Series B raise plus active MLflow → Ray migration. Two open Staff ML Platform reqs in last 30 days. Moderate stack overlap.",
    recentNews: [
      { date: "2026-05-02", headline: "Nimbus Stack ships v3 of its model registry" },
      { date: "2026-01-22", headline: "Nimbus Stack closes $31M Series B" },
    ],
    contacts: [
      { id: "c4", name: "Jonas Okafor", title: "CEO", email: "jonas.okafor@nimbusstack.ai", phone: "+1 (416) 555-0119", linkedin: "linkedin.com/in/jonasokafor" },
      { id: "c5", name: "Sasha Lindgren", title: "CTO", email: "sasha.lindgren@nimbusstack.ai", phone: "+1 (416) 555-0173", linkedin: "linkedin.com/in/sashalindgren" },
    ],
    activity: [
      { ts: "2026-06-25T14:02:11Z", agent: "market_intelligence", event: "Pulled from MLOps hiring index" },
      { ts: "2026-06-25T14:03:44Z", agent: "company_intelligence", event: "Lead Score 74 · Confidence 0.82" },
    ],
  },
  {
    id: "co_heliotrope",
    name: "Heliotrope Data",
    domain: "heliotrope.eu",
    industry: "Analytics Platform",
    location: "Berlin, DE",
    employees: 620,
    employeeGrowthYoY: 19,
    funding: "Series D",
    fundingAmountUsd: 145_000_000,
    fundingDate: "2025-11-09",
    techStack: ["Snowflake", "Looker", "dbt", "Kubernetes", "Terraform"],
    openAiRoles: 5,
    leadScore: 91,
    confidence: 0.95,
    status: "qualified",
    reasoning:
      "Largest stack overlap of any candidate (5 of 6). Recent Series D, 5 open AI/ML reqs across EU offices. Director of AI publicly posted about infra bottlenecks.",
    recentNews: [
      { date: "2026-06-10", headline: "Heliotrope Data launches federated analytics for EU customers" },
      { date: "2025-11-09", headline: "Heliotrope raises $145M Series D" },
    ],
    contacts: [
      { id: "c6", name: "Lena Brandt", title: "CTO", email: "lena.brandt@heliotrope.eu", phone: "+49 30 5550 1284", linkedin: "linkedin.com/in/lenabrandt" },
      { id: "c7", name: "Tomás Vidal", title: "Director of AI", email: "tomas.vidal@heliotrope.eu", phone: "+49 30 5550 1317", linkedin: "linkedin.com/in/tomasvidal" },
    ],
    activity: [
      { ts: "2026-06-24T11:21:00Z", agent: "market_intelligence", event: "Re-surfaced from prior workflow (memory hit)" },
      { ts: "2026-06-24T11:22:18Z", agent: "company_intelligence", event: "Lead Score 91 · Confidence 0.95" },
      { ts: "2026-06-24T11:23:02Z", agent: "contact_intelligence", event: "Resolved 2 decision makers · 1 verified" },
    ],
  },
  {
    id: "co_cascadia",
    name: "Cascadia AI",
    domain: "cascadia.ai",
    industry: "Computer Vision",
    location: "Seattle, WA",
    employees: 95,
    employeeGrowthYoY: 41,
    funding: "Series B",
    fundingAmountUsd: 22_000_000,
    fundingDate: "2026-02-28",
    techStack: ["Kubernetes", "PyTorch", "Triton", "PostgreSQL"],
    openAiRoles: 1,
    leadScore: 68,
    confidence: 0.77,
    status: "in_review",
    reasoning:
      "Below ICP employee floor (95) but high growth velocity (+41% YoY) and active GPU infra hiring. Flag for human approval.",
    recentNews: [
      { date: "2026-06-03", headline: "Cascadia AI partners with Port of Seattle on container vision pilot" },
    ],
    contacts: [
      { id: "c8", name: "Ravi Mehta", title: "CEO", email: "ravi.mehta@cascadia.ai", phone: "+1 (206) 555-0162", linkedin: "linkedin.com/in/ravimehta" },
      { id: "c9", name: "Hana Park", title: "VP Engineering", email: "hana.park@cascadia.ai", phone: "+1 (206) 555-0194", linkedin: "linkedin.com/in/hanapark" },
    ],
    activity: [
      { ts: "2026-06-23T08:44:09Z", agent: "company_intelligence", event: "Lead Score 68 · flagged below ICP floor" },
    ],
  },
  {
    id: "co_quanta",
    name: "Quanta Loop",
    domain: "quantaloop.com",
    industry: "Vector Search",
    location: "Boston, MA",
    employees: 215,
    employeeGrowthYoY: 28,
    funding: "Series C",
    fundingAmountUsd: 58_000_000,
    fundingDate: "2026-04-04",
    techStack: ["Kubernetes", "PostgreSQL", "pgvector", "dbt"],
    openAiRoles: 4,
    leadScore: 82,
    confidence: 0.88,
    status: "qualified",
    reasoning:
      "Quanta Loop's pgvector adoption + 4 open Applied AI reqs maps directly to seller's retrieval stack. Strong CTO-led infra refactor in public roadmap.",
    recentNews: [
      { date: "2026-04-04", headline: "Quanta Loop raises $58M to scale retrieval infra" },
    ],
    contacts: [
      { id: "c10", name: "Imani Brooks", title: "CTO", email: "imani.brooks@quantaloop.com", phone: "+1 (617) 555-0148", linkedin: "linkedin.com/in/imanibrooks" },
      { id: "c11", name: "Daniel Weiss", title: "Director of AI", email: "daniel.weiss@quantaloop.com", phone: "+1 (617) 555-0177", linkedin: "linkedin.com/in/danielweiss" },
    ],
    activity: [
      { ts: "2026-06-22T16:11:42Z", agent: "company_intelligence", event: "Lead Score 82 · Confidence 0.88" },
    ],
  },
  {
    id: "co_arc",
    name: "Arc Foundry",
    domain: "arcfoundry.dev",
    industry: "Developer Tools",
    location: "Remote / NYC",
    employees: 130,
    employeeGrowthYoY: 33,
    funding: "Series B",
    fundingAmountUsd: 28_000_000,
    fundingDate: "2026-05-20",
    techStack: ["Kubernetes", "Rust", "PostgreSQL", "Temporal"],
    openAiRoles: 2,
    leadScore: 71,
    confidence: 0.79,
    status: "enriching",
    reasoning: "Enrichment in progress · contact resolution pending.",
    recentNews: [
      { date: "2026-05-20", headline: "Arc Foundry raises $28M to expand workflow runtime" },
    ],
    contacts: [],
    activity: [
      { ts: "2026-06-26T09:00:00Z", agent: "company_intelligence", event: "Enrichment started" },
    ],
  },
];

// ---------- Recommendations ----------

export type RecommendationPriority = "high" | "medium" | "low";
export type RecommendationStatus = "pending" | "approved" | "rejected";

export interface Recommendation {
  id: string;
  companyId: string;
  companyName: string;
  priority: RecommendationPriority;
  confidence: number;
  opportunity: string;
  reasoning: string;
  evidence: string[];
  nextBestAction: string;
  status: RecommendationStatus;
  createdAt: string;
}

export const recommendations: Recommendation[] = [
  {
    id: "rec_001",
    companyId: "co_lumenforge",
    companyName: "Lumenforge",
    priority: "high",
    confidence: 0.91,
    opportunity:
      "Lumenforge's recent $72M Series C and 3 open MLOps reqs suggest budget and urgency for inference-tier infra tooling.",
    reasoning:
      "Stack overlap of 4/6 with seller integrations (Snowflake, dbt, Airflow, Kubernetes). Director of AI publicly cited dbt-to-streaming migration as Q3 priority.",
    evidence: [
      "Series C announcement · Mar 14, 2026",
      "3 active reqs: Staff ML Platform, Sr. MLOps, Inference Eng",
      "Tech blog post: 'How we're rebuilding our feature store'",
    ],
    nextBestAction: "Intro email to CTO Priya Raman referencing their dbt → streaming migration; offer architecture review.",
    status: "pending",
    createdAt: "2026-06-26T09:16:02Z",
  },
  {
    id: "rec_002",
    companyId: "co_heliotrope",
    companyName: "Heliotrope Data",
    priority: "high",
    confidence: 0.95,
    opportunity:
      "Heliotrope Data has the highest stack overlap in the pipeline and a Director of AI actively writing about infra bottlenecks.",
    reasoning:
      "5/6 stack overlap. Recent Series D funding still deploying. EU expansion creates net-new infrastructure footprint.",
    evidence: [
      "Series D $145M · Nov 2025",
      "5 open AI/ML reqs across Berlin and Amsterdam",
      "Director of AI talk at MLOps World 2026",
    ],
    nextBestAction: "Warm intro via mutual investor at Index. Propose joint architecture session with Tomás Vidal.",
    status: "pending",
    createdAt: "2026-06-24T11:24:00Z",
  },
  {
    id: "rec_003",
    companyId: "co_quanta",
    companyName: "Quanta Loop",
    priority: "medium",
    confidence: 0.88,
    opportunity:
      "Quanta Loop's pgvector adoption and 4 Applied AI reqs map directly to the seller's retrieval-tier offering.",
    reasoning:
      "Public roadmap names retrieval latency as Q3 OKR. CTO has prior relationship with seller's founding team (LinkedIn graph).",
    evidence: [
      "pgvector + Postgres detected in stack",
      "Public roadmap mentions retrieval latency",
      "CTO Imani Brooks → 2nd-degree connection",
    ],
    nextBestAction: "Reference the shared connection in a short technical note; attach retrieval-bench whitepaper.",
    status: "pending",
    createdAt: "2026-06-22T16:13:00Z",
  },
  {
    id: "rec_004",
    companyId: "co_nimbus",
    companyName: "Nimbus Stack",
    priority: "medium",
    confidence: 0.82,
    opportunity: "Nimbus is mid-migration from MLflow to Ray; integration partnership angle is plausible.",
    reasoning: "Partnership pitch outperforms cold outbound for mid-migration accounts (memory: 7 prior wins).",
    evidence: ["Series B Jan 2026", "Ray adoption signal in 2 talks", "Memory: pattern match on prior wins"],
    nextBestAction: "Reach Sasha Lindgren (CTO) with a co-marketing proposal, not a sales pitch.",
    status: "approved",
    createdAt: "2026-06-25T14:05:00Z",
  },
  {
    id: "rec_005",
    companyId: "co_cascadia",
    companyName: "Cascadia AI",
    priority: "low",
    confidence: 0.77,
    opportunity: "Cascadia is below ICP floor but growing fast; defer until next quarter unless GPU infra request appears.",
    reasoning: "Employee count 95 vs ICP floor 100. Watchlist candidate.",
    evidence: ["Employees: 95", "Growth +41% YoY", "1 open GPU infra req"],
    nextBestAction: "Add to watchlist · re-evaluate in 90 days.",
    status: "rejected",
    createdAt: "2026-06-23T08:46:00Z",
  },
];

// ---------- Projects ----------

export interface Project {
  id: string;
  name: string;
  domain: string;
  industry: string;
  country: string;
  employeeRange: string;
  fundingStage: string;
  techStack: string[];
  personas: string[];
  status: "active" | "draft" | "archived";
  lastRun: string | null;
  qualifiedLeads: number;
}

export const projects: Project[] = [
  {
    id: "p_q3_infra",
    name: "Q3 — North America Infra ICP",
    domain: "AI Infrastructure",
    industry: "Data / MLOps",
    country: "United States, Canada",
    employeeRange: "100–800",
    fundingStage: "Series B–D",
    techStack: ["Snowflake", "dbt", "Kubernetes", "Airflow"],
    personas: ["CTO", "VP Engineering", "Director of AI"],
    status: "active",
    lastRun: "2026-06-26T09:16:02Z",
    qualifiedLeads: 18,
  },
  {
    id: "p_eu_expansion",
    name: "EU Expansion — Series C+",
    domain: "AI Infrastructure",
    industry: "Analytics / MLOps",
    country: "Germany, Netherlands, UK",
    employeeRange: "200–800",
    fundingStage: "Series C–D",
    techStack: ["Snowflake", "Looker", "Kubernetes"],
    personas: ["CTO", "Director of AI"],
    status: "active",
    lastRun: "2026-06-24T11:24:00Z",
    qualifiedLeads: 11,
  },
  {
    id: "p_vision_watch",
    name: "Computer Vision Watchlist",
    domain: "Vertical AI",
    industry: "Computer Vision",
    country: "Global",
    employeeRange: "50–250",
    fundingStage: "Series A–B",
    techStack: ["PyTorch", "Triton", "Kubernetes"],
    personas: ["CEO", "CTO"],
    status: "draft",
    lastRun: null,
    qualifiedLeads: 0,
  },
];

// ---------- Workflow Runs / Memory ----------

export interface WorkflowRun {
  id: string;
  projectName: string;
  startedAt: string;
  durationMs: number;
  status: "completed" | "running" | "failed";
  companiesAnalyzed: number;
  qualified: number;
  recommendations: number;
}

export const workflowRuns: WorkflowRun[] = [
  { id: "wf_8821", projectName: "Q3 — North America Infra ICP", startedAt: "2026-06-26T09:12:18Z", durationMs: 248_000, status: "running", companiesAnalyzed: 42, qualified: 12, recommendations: 5 },
  { id: "wf_8814", projectName: "EU Expansion — Series C+", startedAt: "2026-06-24T11:21:00Z", durationMs: 312_000, status: "completed", companiesAnalyzed: 38, qualified: 11, recommendations: 6 },
  { id: "wf_8803", projectName: "Q3 — North America Infra ICP", startedAt: "2026-06-22T16:08:00Z", durationMs: 287_000, status: "completed", companiesAnalyzed: 51, qualified: 14, recommendations: 7 },
  { id: "wf_8791", projectName: "Q3 — North America Infra ICP", startedAt: "2026-06-19T10:02:00Z", durationMs: 264_000, status: "completed", companiesAnalyzed: 47, qualified: 13, recommendations: 6 },
  { id: "wf_8772", projectName: "EU Expansion — Series C+", startedAt: "2026-06-16T08:44:00Z", durationMs: 198_000, status: "failed", companiesAnalyzed: 22, qualified: 0, recommendations: 0 },
];

// ---------- Helpers ----------

export const formatRelative = (iso: string) => {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(1, Math.floor((now - then) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86_400)}d ago`;
};

export const formatUsd = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(0)}M` : `$${(n / 1_000).toFixed(0)}K`;

export const formatDuration = (ms: number | null) => {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rs = Math.round(s % 60);
  return `${m}m ${rs}s`;
};
