'use client';

import { useState } from 'react';

const PALETTE = [
  '#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#39c5cf',
  '#ffa657', '#8b949e', '#a5d6ff', '#7ee787', '#f0883e', '#db61a2',
];

export interface DonutSlice {
  label: string;
  value: number; // percent 0..100
}

export function Donut({
  data,
  size = 160,
  centerLabel,
  valueFormatter = (v: number) => `${Math.round(v)}%`,
  className,
}: {
  data: DonutSlice[];
  size?: number;
  centerLabel?: string;
  valueFormatter?: (v: number) => string;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const totalDeg = 360;
  let acc = 0;

  const segments = data.map((d, i) => {
    const frac = Math.max(d.value, 0.5); // min sliver to keep visible
    const start = acc;
    acc += (d.value / 100) * totalDeg;
    return { d, i, start, frac };
  });

  const cx = size / 2;
  const cy = size / 2;

  // Build arc paths (polar -> cartesian).
  const polar = (angleDeg: number, radius: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  return (
    <div className={className}>
      <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-0">
            {segments.map(({ d, i, start, frac }) => {
              const end = start + (frac / 100) * totalDeg;
              const large = frac / 100 > 0.5 ? 1 : 0;
              const p1 = polar(start, r);
              const p2 = polar(end, r);
              const p3 = polar(start, r - 4);
              const p4 = polar(end, r - 4);
              const path = `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
              return (
                <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <path
                    d={path}
                    fill="none"
                    stroke={d.value > 0 ? PALETTE[i % PALETTE.length] : 'transparent'}
                    strokeWidth={stroke}
                    strokeLinecap="butt"
                    opacity={hover === null || hover === i ? 1 : 0.35}
                  >
                    <title>{`${d.label}: ${valueFormatter(d.value)}`}</title>
                  </path>
                </g>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular text-xl font-semibold text-[#e6edf3]">
              {hover !== null ? valueFormatter(data[hover].value) : centerLabel ?? '100%'}
            </span>
            <span className="max-w-[90px] truncate text-[10px] text-muted">
              {hover !== null ? data[hover].label : 'Tech mix'}
            </span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-1.5">
          {data.map((d, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-xs"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="truncate text-[#c9d1d9]">{d.label}</span>
              <span className="ml-auto tabular text-muted">{valueFormatter(d.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Donut;