import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Workflow,
  Building2,
  Sparkles,
  CheckSquare,
  Brain,
  BarChart3,
  Settings,
} from "lucide-react";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, exact: true },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Workflow", url: "/workflow", icon: Workflow },
  { title: "Companies", url: "/companies", icon: Building2 },
  { title: "Recommendations", url: "/recommendations", icon: Sparkles },
  { title: "Memory", url: "/memory", icon: Brain },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <aside className="flex w-16 md:w-60 shrink-0 flex-col border-r border-hairline bg-surface transition-all">
      <div className="px-3 md:px-5 py-5 border-b border-hairline flex justify-center md:justify-start">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 rounded-lg bg-ink flex items-center justify-center shrink-0">
            <div className="h-2 w-2 rounded-full bg-ink" />
            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5" />
          </div>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="font-display font-bold text-[15px] tracking-tight text-ink">Relay</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              lead intelligence
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {items.map((item) => {
          const active = isActive(item.url, item.exact);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={[
                "flex items-center justify-center md:justify-start gap-3 rounded-md px-3 py-2 text-sm transition-colors relative",
                active
                  ? "bg-secondary text-ink font-medium"
                  : "text-muted-foreground hover:text-ink hover:bg-secondary/60",
              ].join(" ")}
            >
              <item.icon className="h-5 w-5 md:h-4 md:w-4 shrink-0" strokeWidth={1.75} />
              <span className="hidden md:inline">{item.title}</span>
              {active && <span className="absolute right-2 md:static md:ml-auto h-1.5 w-1.5 rounded-full bg-ink" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 md:px-4 py-4 border-t border-hairline">
        <div className="rounded-lg border border-hairline bg-canvas p-2 md:p-3 flex justify-center md:block">
          <div className="flex items-center gap-2">
            <span className="signal-dot inline-flex h-2 w-2 rounded-full bg-signal shrink-0" />
            <span className="hidden md:inline font-mono text-[11px] uppercase tracking-wider text-ink">Agents online</span>
          </div>
          <p className="hidden md:block mt-1.5 text-xs text-muted-foreground">
            6/6 agents healthy · planner v2.4
          </p>
        </div>
      </div>
    </aside>
  );
}
