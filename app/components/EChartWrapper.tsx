"use client";

import { AnalysisChart } from "@/app/types";

const COLORS = ["#38BDF8", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

function BarChart({ chart }: { chart: AnalysisChart }) {
  const { title, series, unit } = chart;
  const labels = series[0]?.data.map((d) => d.label) || [];
  const allValues = series.flatMap((s) => s.data.map((d) => d.value));
  const maxVal = Math.max(...allValues, 1);

  const W = 560;
  const H = 260;
  const PL = 60;
  const PR = 20;
  const PT = 40;
  const PB = 40;
  const CW = W - PL - PR;
  const CH = H - PT - PB;
  const gap = 8;
  const bw = (CW - gap * (labels.length + 1)) / labels.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "260px" }}>
      <text x={W / 2} y={20} textAnchor="middle" fill="#94A3B8" fontSize="12" fontWeight="500">
        {title}
      </text>

      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = PT + CH - f * CH;
        const val = Math.round(maxVal * f);
        return (
          <g key={f}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="#334155" strokeDasharray="2,3" />
            <text x={PL - 6} y={y + 3} textAnchor="end" fill="#64748B" fontSize="9">
              {val >= 10000 ? `${(val / 10000).toFixed(0)}万` : val.toLocaleString()}
            </text>
          </g>
        );
      })}

      {labels.map((label, li) => {
        const x = PL + gap + li * (bw + gap);
        return (
          <g key={label}>
            <rect
              x={x}
              y={PT + CH - (series[0].data[li].value / maxVal) * CH}
              width={bw}
              height={(series[0].data[li].value / maxVal) * CH}
              fill={COLORS[0]}
              rx="3"
              opacity="0.9"
            />
            <text
              x={x + bw / 2}
              y={PT + CH - (series[0].data[li].value / maxVal) * CH - 4}
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="9"
            >
              {series[0].data[li].value >= 10000
                ? `${(series[0].data[li].value / 10000).toFixed(1)}万`
                : series[0].data[li].value.toLocaleString()}
            </text>
            <text
              x={x + bw / 2}
              y={H - PB + 16}
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="10"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ chart }: { chart: AnalysisChart }) {
  const { title, series } = chart;
  const labels = series[0]?.data.map((d) => d.label) || [];
  const allValues = series.flatMap((s) => s.data.map((d) => d.value));
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  const W = 560;
  const H = 260;
  const PL = 60;
  const PR = 20;
  const PT = 40;
  const PB = 40;
  const CW = W - PL - PR;
  const CH = H - PT - PB;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "260px" }}>
      <text x={W / 2} y={20} textAnchor="middle" fill="#94A3B8" fontSize="12" fontWeight="500">
        {title}
      </text>

      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = PT + CH - f * CH;
        const val = Math.round(minVal + range * f);
        return (
          <g key={f}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="#334155" strokeDasharray="2,3" />
            <text x={PL - 6} y={y + 3} textAnchor="end" fill="#64748B" fontSize="9">
              {val >= 10000 ? `${(val / 10000).toFixed(0)}万` : val.toLocaleString()}
            </text>
          </g>
        );
      })}

      {series.map((s, si) => {
        const pts = s.data.map((d, i) => {
          const x = PL + (CW / Math.max(labels.length - 1, 1)) * i;
          const y = PT + CH - ((d.value - minVal) / range) * CH;
          return { x, y, v: d.value };
        });
        return (
          <g key={si}>
            <polyline
              points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={COLORS[si % COLORS.length]}
              strokeWidth="2"
            />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill={COLORS[si % COLORS.length]} />
            ))}
          </g>
        );
      })}

      {labels.map((label, i) => (
        <text
          key={label}
          x={PL + (CW / Math.max(labels.length - 1, 1)) * i}
          y={H - PB + 16}
          textAnchor="middle"
          fill="#94A3B8"
          fontSize="9"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

function PieChart({ chart }: { chart: AnalysisChart }) {
  const { title, series } = chart;
  const data = series[0]?.data || [];
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  const cx = 140;
  const cy = 130;
  const r = 75;

  let start = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * Math.PI * 2;
    const end = start + angle;
    const large = angle > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
    start = end;
    return { path, label: d.label, value: d.value, pct: ((d.value / total) * 100).toFixed(1) };
  });

  const W = 460;

  return (
    <svg viewBox={`0 0 ${W} 260`} className="w-full" style={{ height: "260px" }}>
      <text x={cx} y={14} textAnchor="middle" fill="#94A3B8" fontSize="12" fontWeight="500">
        {title}
      </text>
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#E2E8F0" fontSize="16" fontWeight="600">
        {total >= 10000 ? `${(total / 10000).toFixed(1)}万` : total.toLocaleString()}
      </text>

      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={COLORS[i % COLORS.length]} opacity="0.85" />
      ))}

      {slices.map((s, i) => (
        <g key={i} transform={`translate(240, ${40 + i * 24})`}>
          <rect x="0" y="0" width="12" height="12" fill={COLORS[i % COLORS.length]} rx="2" />
          <text x="20" y="10" fill="#CBD5E1" fontSize="11">{s.label}</text>
          <text
            x="140"
            y="10"
            fill={COLORS[i % COLORS.length]}
            fontSize="11"
            textAnchor="end"
            fontFamily="monospace"
          >
            {s.pct}%
          </text>
        </g>
      ))}
    </svg>
  );
}

export function EChartWrapper({ chart }: { chart: AnalysisChart }) {
  return (
    <div className="glass-strong rounded-2xl p-4 shadow-[0_4px_20px_rgba(51,65,85,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
      {chart.type === "bar" ? (
        <BarChart chart={chart} />
      ) : chart.type === "line" ? (
        <LineChart chart={chart} />
      ) : (
        <PieChart chart={chart} />
      )}
    </div>
  );
}