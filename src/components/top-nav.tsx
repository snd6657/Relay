import { Search, Bell, ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface TopNavProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopNav({ title, subtitle, actions }: TopNavProps) {
  return (
    <header className="border-b border-hairline bg-surface/80 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-4 px-6 h-14">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search companies, contacts, runs…"
            className="w-full h-9 pl-9 pr-3 rounded-md bg-canvas border border-hairline text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-hairline bg-canvas">
            <span className="signal-dot inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            <span className="font-mono text-[11px] text-ink">AI gateway · 38ms</span>
          </div>
          <button className="h-9 w-9 rounded-md hover:bg-secondary flex items-center justify-center">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </button>
          <Link to="/settings" className="flex items-center gap-2 h-9 pl-1.5 pr-2 rounded-md hover:bg-secondary">
            <div className="h-6 w-6 rounded-full bg-ink text-white text-[11px] font-medium flex items-center justify-center">
              AK
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>
      <div className="px-6 py-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
