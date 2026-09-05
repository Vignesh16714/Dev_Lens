import { cn } from '@/lib/ui-utils';

export function scoreColor(v: number): string {
  if (v >= 75) return '#3fb950';
  if (v >= 55) return '#58a6ff';
  if (v >= 35) return '#d29922';
  return '#f85149';
}

export function ScoreRing({
  value,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
  className,
}: {
  value: number; // 0..100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const color = scoreColor(clamped);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#21262d"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.2,0.8,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-2xl font-semibold text-[#e6edf3]">{clamped}</span>
        {sublabel ? <span className="text-[10px] text-muted">{sublabel}</span> : null}
      </div>
      {label ? (
        <span className="absolute -bottom-5 text-xs text-muted">{label}</span>
      ) : null}
    </div>
  );
}