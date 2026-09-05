'use client';

export interface RadarAxis {
  label: string;
  value: number; // 0..100
}

export function Radar({ axes, size = 260, className }: { axes: RadarAxis[]; size?: number; className?: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 34;
  const n = axes.length;

  const pointAt = (i: number, valueNorm: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + maxR * valueNorm * Math.cos(angle), y: cy + maxR * valueNorm * Math.sin(angle) };
  };

  const polygon = (valueNorm: number) => {
    const pts = Array.from({ length: n }, (_, i) => pointAt(i, valueNorm));
    // close shape
    const pts2 = [...pts, pts[0]];
    // draw as connecting lines around
    return pts2.map((p) => `${p.x},${p.y}`).join(' ');
  };

  const ringPoints = [0.25, 0.5, 0.75, 1].map((f) =>
    Array.from({ length: n }, (_, i) => pointAt(i, f)).map((p) => `${p.x},${p.y}`).join(' ')
  );

  // value polygon
  const values = axes.map((a, i) => pointAt(i, a.value / 100));
  const valuePolygon = [...values, values[0]].map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block" role="img" aria-label="Sub-score radar chart">
      {/* rings */}
      {ringPoints.map((p, i) => (
        <polygon key={i} points={p} fill="none" stroke="#21262d" strokeWidth={1} />
      ))}
      {/* spokes + labels */}
      {axes.map((a, i) => {
        const tip = pointAt(i, 1);
        const labelPt = pointAt(i, 1.15);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#21262d" strokeWidth={1} />
            <text
              x={labelPt.x}
              y={labelPt.y}
              className="fill-muted"
              fontSize="9"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {a.label}
            </text>
          </g>
        );
      })}
      {/* value polygon */}
      <polygon points={valuePolygon} fill="#58a6ff" fillOpacity={0.18} stroke="#58a6ff" strokeWidth={2} strokeLinejoin="round" />
      {values.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#58a6ff" />
      ))}
    </svg>
  );
}

export default Radar;