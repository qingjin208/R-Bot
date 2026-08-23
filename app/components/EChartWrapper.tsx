"use client";

import { useRef, useState } from "react";
import { AnalysisChart } from "@/app/types";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];
const GRID_COLOR = "rgba(148,163,184,0.1)";
const TEXT_MUTED = "#94A3B8";
const TEXT_DIM = "#64748B";

function fmt(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

function YAxis({
  maxVal,
  top,
  height,
  width,
  axisColor,
  labelColor,
  splitColor,
}: {
  maxVal: number;
  top: number;
  height: number;
  width: number;
  axisColor: string;
  labelColor: string;
  splitColor: string;
}) {
  const steps = [0, 0.25, 0.5, 0.75, 1];
  return (
    <g>
      {steps.map((f) => {
        const y = top + height - f * height;
        const val = Math.round(maxVal * f);
        return (
          <g key={f}>
            <line x1={0} x2={width} y1={y} y2={y} stroke={splitColor} strokeDasharray="2,3" strokeWidth="1" />
            <text x={-8} y={y + 4} textAnchor="end" fill={labelColor} fontSize="10" fontFamily="monospace">
              {fmt(val)}
            </text>
          </g>
        );
      })}
      <line x1={0} y1={top + height} x2={width} y2={top + height} stroke={axisColor} />
    </g>
  );
}

// ── 柱状图 ─────────────────────────────────────
function BarChart({ chart }: { chart: AnalysisChart }) {
  const { title, series, unit } = chart;
  const data = series[0]?.data || [];
  const labels = data.map((d) => d.label);
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const W = 620;
  const H = 280;
  const PL = 56,
    PR = 16,
    PT = 48,
    PB = 52;
  const CW = W - PL - PR;
  const CH = H - PT - PB;
  const gap = 10;
  const bw = Math.max(10, (CW - gap * (labels.length + 1)) / labels.length);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="relative" style={{ width: "100%" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "280px", display: "block" }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#93C5FD" stopOpacity="1" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <text x={W / 2} y={24} textAnchor="middle" fill={TEXT_MUTED} fontSize="13" fontWeight="500">
          {title}
          {unit && <tspan fill={TEXT_DIM} fontSize="10"> ({unit})</tspan>}
        </text>

        <g transform={`translate(${PL},${PT})`}>
          <YAxis
            maxVal={maxVal}
            top={0}
            height={CH}
            width={CW}
            axisColor="#334155"
            labelColor={TEXT_DIM}
            splitColor={GRID_COLOR}
          />

          {labels.map((label, i) => {
            const x = gap + i * (bw + gap);
            const bh = (data[i].value / maxVal) * CH;
            const y = CH - bh;
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={label}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={x}
                  y={y}
                  width={bw}
                  height={bh}
                  fill={isHovered ? "url(#barGradHover)" : "url(#barGrad)"}
                  rx="4"
                  opacity={hoveredIdx !== null && !isHovered ? 0.4 : 1}
                >
                  <animate attributeName="height" from="0" to={bh} dur="0.4s" fill="freeze" begin={i * 0.05 + "s"} />
                  <animate attributeName="y" from={CH} to={y} dur="0.4s" fill="freeze" begin={i * 0.05 + "s"} />
                </rect>

                {(isHovered || true) && (
                  <text
                    x={x + bw / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fill={COLORS[0]}
                    fontSize="10"
                    fontWeight="500"
                  >
                    {fmt(data[i].value)}
                  </text>
                )}

                <text
                  x={x + bw / 2}
                  y={CH + 18}
                  textAnchor="middle"
                  fill={TEXT_MUTED}
                  fontSize="10"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {hoveredIdx !== null && (
        <div
          className="absolute pointer-events-none z-10 bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 shadow-xl"
          style={{
            left: `${PL + gap + hoveredIdx * (bw + gap) + bw / 2}px`,
            top: `${PT + CH - (data[hoveredIdx].value / maxVal) * CH - 48}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="text-[11px] text-[#94A3B8] mb-0.5">{data[hoveredIdx].label}</div>
          <div className="text-[13px] font-semibold font-mono" style={{ color: COLORS[0] }}>
            {fmt(data[hoveredIdx].value)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 折线图 ─────────────────────────────────────
function LineChart({ chart }: { chart: AnalysisChart }) {
  const { title, series, unit } = chart;
  const data = series[0]?.data || [];
  const labels = data.map((d) => d.label);
  const allVals = data.map((d) => d.value);
  const maxVal = Math.max(...allVals, 1);
  const minVal = Math.min(...allVals, 0);
  const range = maxVal - minVal || 1;

  const W = 620;
  const H = 280;
  const PL = 56,
    PR = 16,
    PT = 48,
    PB = 52;
  const CW = W - PL - PR;
  const CH = H - PT - PB;

  const points = data.map((d, i) => {
    const x = PL + (CW / Math.max(labels.length - 1, 1)) * i;
    const y = PT + CH - ((d.value - minVal) / range) * CH;
    return { x, y, v: d.value, label: d.label };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${PT + CH} L ${points[0].x} ${PT + CH} Z`;

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="relative" style={{ width: "100%" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "280px", display: "block" }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>

        <text x={W / 2} y={24} textAnchor="middle" fill={TEXT_MUTED} fontSize="13" fontWeight="500">
          {title}
        </text>

        <g transform={`translate(${PL},${PT})`}>
          <YAxis
            maxVal={maxVal}
            top={0}
            height={CH}
            width={CW}
            axisColor="#334155"
            labelColor={TEXT_DIM}
            splitColor={GRID_COLOR}
          />

          <path d={areaD} fill="url(#lineAreaGrad)" />
          <path d={pathD} fill="none" stroke={COLORS[0]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((p, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill="#0F172A"
                  stroke={COLORS[0]}
                  strokeWidth="2.5"
                />
                <rect
                  x={p.x - 1}
                  y={p.y - 1}
                  width={2}
                  height={CH - p.y}
                  fill="transparent"
                />
              </g>
            );
          })}

          {points.map((p, i) => (
            <text
              key={i}
              x={p.x - PL}
              y={CH + 18}
              textAnchor="middle"
              fill={TEXT_MUTED}
              fontSize="10"
            >
              {p.label}
            </text>
          ))}
        </g>
      </svg>

      {hoveredIdx !== null && points[hoveredIdx] && (
        <div
          className="absolute pointer-events-none z-10 bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 shadow-xl"
          style={{
            left: `${points[hoveredIdx].x}px`,
            top: `${points[hoveredIdx].y - 52}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="text-[11px] text-[#94A3B8] mb-0.5">{points[hoveredIdx].label}</div>
          <div className="text-[13px] font-semibold font-mono" style={{ color: COLORS[0] }}>
            {fmt(points[hoveredIdx].v)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 饼图 ─────────────────────────────────────
function PieChart({ chart }: { chart: AnalysisChart }) {
  const { title, series } = chart;
  const data = series[0]?.data || [];
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  const cx = 150,
    cy = 140,
    r = 78;
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
    return {
      path,
      label: d.label,
      value: d.value,
      pct: ((d.value / total) * 100).toFixed(1),
    };
  });

  const W = 520;
  const H = 280;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "280px" }}>
      <text x={cx} y={14} textAnchor="middle" fill={TEXT_MUTED} fontSize="13" fontWeight="500">
        {title}
      </text>

      <text x={cx} y={cy - 4} textAnchor="middle" fill="#E2E8F0" fontSize="16" fontWeight="600">
        {fmt(total)}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={TEXT_DIM} fontSize="9">
        总计
      </text>

      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={COLORS[i % COLORS.length]} opacity="0.85" stroke="#0F172A" strokeWidth="1" />
      ))}

      {slices.map((s, i) => {
        const y = 36 + i * 26;
        return (
          <g key={i} transform={`translate(270, ${y})`}>
            <rect x="0" y="0" width="10" height="10" fill={COLORS[i % COLORS.length]} rx="2" opacity="0.9" />
            <text x="16" y="9" fill="#CBD5E1" fontSize="11">
              {s.label}
            </text>
            <text x="160" y="9" fill={COLORS[i % COLORS.length]} fontSize="11" textAnchor="end" fontFamily="monospace">
              {s.pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── 图表容器 ─────────────────────────────────
export function EChartWrapper({ chart }: { chart: AnalysisChart }) {
  return (
    <div className="bg-[#1A1F2E] rounded-xl p-4 border border-[#2D3748]">
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