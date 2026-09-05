'use client';

import { useState } from 'react';

export interface BarDatum {
  label: string;
  value: number;
  highlight?: boolean;
}

export function BarChart({
  data,
  height = 180,
  barColor = '#58a6ff',
  highlightColor = '#3fb950',
  yTicks = 4,
  valueFormatter = (v: number) => String(v),
  className,
}: {
  data: BarDatum[];
  height?: number;
  barColor?: string;
  highlightColor?: string;
  yTicks?: number;
  valueFormatter?: (v: number) => string;
  className?: string;
}) {
  const [hover, setHover] = useState<BarDatum | null>(null);
  const W = 720;
  const H = 260;
  const padL = 34;
  const padB = 26;
  const padT = 12;
  const max = Math.max(1, ...data.map((d) => d.value));
  const innerW = W - padL;
  const innerH = H - padT - padB;
  const n = Math.max(data.length, 1);
  const slot = innerW / n;
  const barW = Math.min(slot * 0.6, 34);

  const ticks = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((max * i) / yTicks)
  );

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* y gridlines */}
        {ticks.map((t) => {
          const y = padT + innerH - (t / max) * innerH;
          return (
            <g key={t}>
              <line x1={padL} x2={W} y1={y} y2={y} stroke="#21262d" strokeWidth={1} />
              <text x={padL - 6} y={y + 3} className="fill-muted" fontSize="9" textAnchor="end">
                {valueFormatter(t)}
              </text>
            </g>
          );
        })}
        {/* bars */}
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = padL + i * slot + (slot - barW) / 2;
          const y = padT + innerH - h;
          const active = d.highlight || hover === d;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, 1)}
              rx={3}
              fill={d.highlight ? highlightColor : barColor}
              opacity={hover && hover !== d ? 0.45 : 1}
              onMouseEnter={() => setHover(d)}
              onMouseLeave={() => setHover(null)}
            >
              <title>{`${d.label}: ${valueFormatter(d.value)}`}</title>
            </rect>
          );
        })}
        {/* x labels (subset to avoid crowding) */}
        {data.map((d, i) => {
          if (n > 10 && i % Math.ceil(n / 10) !== 0) return null;
          const x = padL + i * slot + slot / 2;
          return (
            <text key={i} x={x} y={H - 8} className="fill-muted" fontSize="9" textAnchor="middle">
              {d.label}
            </text>
          );
        })}
      </svg>
      {hover ? (
        <p className="mt-1 text-xs text-muted">
          <strong className="text-[#e6edf3]">{valueFormatter(hover.value)}</strong> · {hover.label}
        </p>
      ) : null}
    </div>
  );
}

export default BarChart;