import type { LucideIcon } from 'lucide-react';

export function Section({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-borderline bg-elevated text-accent">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <div>
            <h1 className="text-lg font-semibold text-[#e6edf3]">{title}</h1>
            {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: 'green' | 'accent' | 'warning' | 'danger';
}) {
  const toneColor =
    tone === 'green'
      ? 'text-[#3fb950]'
      : tone === 'accent'
        ? 'text-accent'
        : tone === 'warning'
          ? 'text-yellow-400'
          : tone === 'danger'
            ? 'text-red-400'
            : 'text-[#e6edf3]';
  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between">
        <p className="label">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-muted" /> : null}
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular ${toneColor}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/** A subtle note distinguishing GitHub-reported vs DevLens-calculated metrics. */
export function ProvenanceNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
      <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" fill="currentColor">
        <path d="M8 1.5A6.5 6.5 0 1 0 8 14.5 6.5 6.5 0 0 0 8 1.5ZM7 5h2l-.5 4.5h-1L7 5Zm1 7.2a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
      </svg>
      <span>{children}</span>
    </p>
  );
}