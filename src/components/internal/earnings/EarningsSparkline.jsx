'use client';

import { useRef, useState } from 'react';

const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const dateFmt = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const WIDTH = 300;
const HEIGHT = 48;
const PADDING_Y = 4;

export default function EarningsSparkline({ series }) {
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!series || series.length < 2) return null;

  const values = series.map((d) => d.usd_realized);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = series.map((d, i) => ({
    x: (i / (series.length - 1)) * WIDTH,
    y: HEIGHT - PADDING_Y - ((d.usd_realized - min) / range) * (HEIGHT - PADDING_Y * 2),
    ...d,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;

  const maxIndex = points.reduce(
    (best, p, i) => (p.usd_realized > points[best].usd_realized ? i : best),
    0
  );
  const minIndex = points.reduce(
    (best, p, i) => (p.usd_realized < points[best].usd_realized ? i : best),
    0
  );

  // Labels are plain HTML overlays, not SVG <text> — the SVG stretches
  // non-uniformly (preserveAspectRatio="none") to fill the card's width, which
  // would distort glyph shapes; a thin line or tiny dot hides that, text doesn't.
  function labelStyle(point, index, placement) {
    const xPct = (index / (series.length - 1)) * 100;
    const yPct = (point.y / HEIGHT) * 100;

    let translateX = '-50%';
    if (xPct < 12) translateX = '0%';
    else if (xPct > 88) translateX = '-100%';

    return {
      left: `${xPct}%`,
      top: `${yPct}%`,
      transform: `translate(${translateX}, ${placement === 'above' ? 'calc(-100% - 6px)' : '6px'})`,
    };
  }

  function handleMouseMove(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    const index = Math.round(fraction * (series.length - 1));
    setHoverIndex(Math.min(Math.max(index, 0), series.length - 1));
  }

  const hovered = hoverIndex != null ? points[hoverIndex] : null;

  return (
    <div className="mb-4">
      <div className="text-xs text-[#94a3b8] mb-1.5">
        Earnings trend · last {series.length} days
      </div>
      <div className="relative h-12">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#sparklineFill)" stroke="none" />
          <path
            d={linePath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={points[maxIndex].x} cy={points[maxIndex].y} r="2" fill="#06b6d4" />
          <circle cx={points[minIndex].x} cy={points[minIndex].y} r="2" fill="#06b6d4" />
          {hovered && (
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1="0"
              y2={HEIGHT}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="2,2"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        <div
          className="absolute text-[10px] font-mono text-[#94a3b8] pointer-events-none whitespace-nowrap"
          style={labelStyle(points[maxIndex], maxIndex, 'above')}
        >
          {usdFmt.format(points[maxIndex].usd_realized)}
        </div>
        <div
          className="absolute text-[10px] font-mono text-[#94a3b8] pointer-events-none whitespace-nowrap"
          style={labelStyle(points[minIndex], minIndex, 'below')}
        >
          {usdFmt.format(points[minIndex].usd_realized)}
        </div>

        {hovered && (
          <div
            className="absolute -top-9 bg-black/90 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs pointer-events-none whitespace-nowrap"
            style={{
              left: `${(hoverIndex / (series.length - 1)) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <span className="text-[#94a3b8]">{dateFmt(hovered.date)}</span>{' '}
            <span className="text-white font-mono">{usdFmt.format(hovered.usd_realized)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
