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

// Matches the UTC-based YYYY-MM-DD convention used elsewhere in this codebase
// (see ClusterFormModal's today()), so it lines up with whatever date string
// the VPS bucketed the day under.
function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

function isSameUTCDate(dateStr, referenceDateStr) {
  return new Date(dateStr).toISOString().slice(0, 10) === referenceDateStr;
}

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

  const lastIndex = points.length - 1;
  const hasTodayPoint = lastIndex > 0 && isSameUTCDate(points[lastIndex].date, todayDateStr());
  const todayIndex = hasTodayPoint ? lastIndex : -1;

  const linePathFull = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePathFull} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;

  // Today's still-accumulating segment renders as its own dashed path so it
  // reads as "in progress" rather than a completed day's value.
  const linePathCompleted = hasTodayPoint
    ? points
        .slice(0, todayIndex)
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
        .join(' ')
    : linePathFull;
  const linePathToday = hasTodayPoint
    ? `M ${points[todayIndex - 1].x.toFixed(2)} ${points[todayIndex - 1].y.toFixed(2)} ` +
      `L ${points[todayIndex].x.toFixed(2)} ${points[todayIndex].y.toFixed(2)}`
    : '';

  // Today is excluded from the min/max annotations — a still-accumulating $0
  // day would otherwise get flagged as the period low, reading as a real dip
  // rather than a day that just hasn't posted fills yet.
  const annotatable = hasTodayPoint ? points.slice(0, todayIndex) : points;
  const maxIndex = annotatable.reduce(
    (best, p, i) => (p.usd_realized > annotatable[best].usd_realized ? i : best),
    0
  );
  const minIndex = annotatable.reduce(
    (best, p, i) => (p.usd_realized < annotatable[best].usd_realized ? i : best),
    0
  );

  // Labels and point markers are plain HTML overlays, not SVG <text>/<circle>
  // — the SVG stretches non-uniformly (preserveAspectRatio="none") to fill
  // the card's width, which distorts glyph shapes and turns circles into
  // ellipses; positioning fixed-size HTML elements by percentage sidesteps
  // that entirely since they aren't subject to the SVG's viewBox transform.
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

  function dotStyle(point, index) {
    return {
      left: `${(index / (series.length - 1)) * 100}%`,
      top: `${(point.y / HEIGHT) * 100}%`,
      transform: 'translate(-50%, -50%)',
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
            d={linePathCompleted}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          {hasTodayPoint && (
            <path
              d={linePathToday}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeDasharray="3,3"
              vectorEffect="non-scaling-stroke"
            />
          )}
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
          className="absolute w-1 h-1 rounded-full bg-[#06b6d4] pointer-events-none"
          style={dotStyle(points[maxIndex], maxIndex)}
        />
        <div
          className="absolute w-1 h-1 rounded-full bg-[#06b6d4] pointer-events-none"
          style={dotStyle(points[minIndex], minIndex)}
        />
        {hasTodayPoint && (
          <div
            className="absolute w-[9px] h-[9px] rounded-full border-[1.5px] border-[#06b6d4] pointer-events-none"
            style={dotStyle(points[todayIndex], todayIndex)}
          />
        )}

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
            <span className="text-[#94a3b8]">
              {dateFmt(hovered.date)}
              {hasTodayPoint && hoverIndex === todayIndex ? ' (so far)' : ''}
            </span>{' '}
            <span className="text-white font-mono">{usdFmt.format(hovered.usd_realized)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
