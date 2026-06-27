export function ScorePill({ value, label }: { value: number; label?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-score/30 bg-score/10 px-2 py-0.5">
      {label && <span className="font-mono text-[10px] uppercase tracking-wider text-score">{label}</span>}
      <span className="font-mono text-[12px] font-semibold text-score tabular-nums">{value}</span>
    </div>
  );
}

export function ConfidencePill({ value }: { value: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-[12px] tabular-nums">
      <span className="text-muted-foreground">conf</span>
      <span className="text-ink font-semibold">{value.toFixed(2)}</span>
    </div>
  );
}
