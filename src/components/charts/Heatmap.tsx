'use client';

import type { ContributionDay } from '@/lib/types';
import { useMemo, useState } from 'react';

const CELL = 11;
const GAP = 3;
const W_DAY = CELL + GAP;

const LEVEL_COLOR = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function cellColor(level: number): string {
  return LEVEL_COLOR[Math.max(0, Math.min(4, level))];
}

export function ContributionHeatmap({
  data,
  className,
}: {
  data: ContributionDay[];
  className?: string;
}) {
  const [hover, setHover] = useState<ContributionDay | null>(null);

  const grid = useMemo(() => buildGrid(data), [data]);

  const width = grid.weeks * W_DAY + 24;
  const height = 7 * W_DAY + 22;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-full"
        role="img"
        aria-label="Contribution heatmap over the last 52 weeks"
      >
        {/* Month labels */}
        {grid.months.map((m) => (
          <text
            key={m.label + m.weekIndex}
            x={24 + m.weekIndex * W_DAY}
            y={10}
            className="fill-muted"
            fontSize="9"
            textAnchor="start"
          >
            {m.label}
          </text>
        ))}
        {/* Day-of-week labels */}
        {[1, 3, 5].map((d) => (
          <text key={d} x={0} y={22 + d * W_DAY + 8} className="fill-muted" fontSize="9" textAnchor="middle">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d][0]}
          </text>
        ))}
        {/* Cells */}
        {grid.cells.map((c) => (
          <rect
            key={c.date}
            x={24 + c.col * W_DAY}
            y={20 + c.row * W_DAY}
            width={CELL}
            height={CELL}
            rx={2}
            fill={cellColor(c.level)}
            onMouseEnter={() => setHover({ date: c.date, count: c.count, level: c.level })}
            onMouseLeave={() => setHover(null)}
          >
            <title>{`${c.count} contribution${c.count === 1 ? '' : 's'} on ${formatDate(c.date)}`}</title>
          </rect>
        ))}
      </svg>

      <div className="mt-2 flex items-center justify-start gap-1 text-[10px] text-muted">
        <span>Less</span>
        {LEVEL_COLOR.map((c) => (
          <span key={c} className="h-2.5 w-2.5 rounded-[3px]" style={{ background: c }} />
        ))}
        <span>More</span>
        {hover ? (
          <span className="ml-auto rounded border border-borderline bg-elevated px-1.5 py-0.5">
            <strong className="text-[#e6edf3]">{hover.count}</strong> on {formatDate(hover.date)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

interface GridCell {
  date: string;
  count: number;
  level: number;
  col: number;
  row: number;
}
interface MonthMark {
  label: string;
  weekIndex: number;
}

function buildGrid(data: ContributionDay[]): { weeks: number; cells: GridCell[]; months: MonthMark[] } {
  if (!data.length) return { weeks: 1, cells: [], months: [] };

  const first = new Date(`${data[0].date}T00:00:00`);
  const startOffset = first.getDay(); // Mon-first for GitHub style
  const total = data.length + startOffset;
  const weeks = Math.max(1, Math.ceil(total / 7));

  const cells: GridCell[] = data.map((d, i) => {
    const pos = i + startOffset;
    return {
      date: d.date,
      count: d.count,
      level: d.level,
      col: Math.floor(pos / 7),
      row: pos % 7,
    };
  });

  const months: MonthMark[] = [];
  let last = -1;
  data.forEach((d, i) => {
    const m = Number(d.date.slice(5, 7)) - 1;
    if (m !== last) {
      const pos = i + startOffset;
      months.push({ label: MONTHS[m], weekIndex: Math.floor(pos / 7) });
      last = m;
    }
  });

  return { weeks, cells, months };
}

function formatDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default ContributionHeatmap;