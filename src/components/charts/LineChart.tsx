'use client';

import { useState } from 'react';

export interface LineDatum {
  label: string;
  value: number;
}

export function LineChart({
  data,
  height = 180,
  color = '#58a6ff',
  area = true,
  valueFormatter = (v: number) => String(v),
  className,
}: {
  data: LineDatum[];
  height?: number;
  color?: string;
  area?: boolean;
  valueFormatter?: (v: number) => string;
  className?: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const W = 720;
  const H = 260;
  const padL = 34;
  const padR = 12;
  const padB = 26;
  const padT = 12;
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = 0;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = Math.max(data.length - 1, 1);

  const xAt = (i: number) => padL + (i / n) * innerW;
  const yAt = (v: number) => padT + innerH - ((v - min) / (max - min || 1)) * innerH;

  const points = data
    .map((d, i) => `${xAt(i).toFixed(1)},${yAt(d.value).toFixed(1)}`)
    .join(' ');
  const areaPath =
    area && data.length > 1
      ? `M ${xAt(0)} ${yAt(data[0].value)} ${points
          .split(' ')
          .map((p) => `L ${p}`)
          .join(' ')} L ${xAt(data.length - 1)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`
      : '';

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {area && data.length > 1 ? <path d={areaPath} fill="url(#areaFill)" /> : null}
        {[0, 0.5, 1].map((f) => {
          const y = padT + innerH - f * innerH;
          return (
            <line key={f} x1={padL} x2={W - padR} y1={y} y2={y} stroke="#21262d" strokeWidth={1} />
          );
        })}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* hover overlay */}
        {data.map((d, i) => {
          const x = xAt(i);
          const y = yAt(d.value);
          return (
            <g key={i}>
              <rect x={x - innerW / n / 2} y={padT} width={innerW / n} height={innerH} fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)} />
              {hoverIdx === i ? (
                <g>
                  <line x1={x} x2={x} y1={padT} y2={padT + innerH} stroke="#3d444d" strokeDasharray="3 3" />
                  <circle cx={x} cy={y} r={4} fill="#010409" stroke={color} strokeWidth={2} />
                  <text x={x - 6} y={y - 8} className="fill-[#e6edf3]" fontSize="10" textAnchor="end">
                    {valueFormatter(d.value)}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
        {/* x labels */}
        {data.map((d, i) =>
          data.length > 12 && i % Math.ceil(data.length / 12) !== 0 ? null : (
            <text key={i} x={xAt(i)} y={H - 8} className="fill-muted" fontSize="9" textAnchor="middle">
              {d.label}
            </text>
          )
        )}
      </svg>
      {hoverIdx !== null && data[hoverIdx] ? (
        <p className="mt-1 text-xs text-muted">
          <strong className="text-[#e6edf3]">{valueFormatter(data[hoverIdx].value)}</strong> · {data[hoverIdx].label}
        </p>
      ) : null}
    </div>
  );
}

export default LineChart;