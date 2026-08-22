"use client";

import { useI18n } from "@/app/contexts/I18nContext";

interface KPICardProps {
  labelKey: string;
  value: string;
  change: number;
  delay?: string;
}

function KPICard({ labelKey, value, change, delay }: KPICardProps) {
  const { t } = useI18n();
  const isPositive = change >= 0;
  const changeColor = isPositive ? "#10B981" : "#FB7185";
  const arrow = isPositive ? "↑" : "↓";

  return (
    <div className="card-in glass rounded-xl p-3" style={{ animationDelay: delay }}>
      <p className="text-[9px] text-[var(--text)]/50 tracking-wide">{t(labelKey as never)}</p>
      <p className="font-mono text-[18px] font-semibold text-[var(--text)] mt-0.5">{value}</p>
      <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: changeColor }}>
        <span>{arrow}</span>
        <span className="font-mono">{Math.abs(change)}%</span>
      </p>
    </div>
  );
}

interface LineChartProps {
  titleKey: string;
  subtitle?: string;
  delay?: string;
}

function LineChart({ titleKey, subtitle, delay }: LineChartProps) {
  const { t } = useI18n();
  return (
    <div className="card-in glass rounded-xl p-3" style={{ animationDelay: delay }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-medium text-[var(--text)]/80">{t(titleKey as never)}</p>
        {subtitle && <span className="text-[9px] text-[#38BDF8]">{subtitle}</span>}
      </div>
      <svg viewBox="0 0 300 80" className="w-full h-[70px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(148,163,184,0.12)" strokeDasharray="2,3" />
        <line x1="0" y1="40" x2="300" y2="40" stroke="rgba(148,163,184,0.12)" strokeDasharray="2,3" />
        <line x1="0" y1="60" x2="300" y2="60" stroke="rgba(148,163,184,0.12)" strokeDasharray="2,3" />
        <path
          d="M0,55 L25,48 L50,52 L75,40 L100,42 L125,35 L150,38 L175,28 L200,30 L225,22 L250,18 L275,20 L300,12 L300,80 L0,80 Z"
          fill="url(#areaGrad)"
        />
        <path
          d="M0,55 L25,48 L50,52 L75,40 L100,42 L125,35 L150,38 L175,28 L200,30 L225,22 L250,18 L275,20 L300,12"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-draw-line"
        />
        <circle cx="300" cy="12" r="3" fill="#38BDF8" />
      </svg>
      <div className="flex justify-between text-[8px] text-[var(--text)]/35 mt-1 font-mono">
        <span>8/1</span>
        <span>8/8</span>
        <span>8/15</span>
        <span>8/22</span>
        <span>8/31</span>
      </div>
    </div>
  );
}

interface ProgressBarItem {
  labelKey: string;
  value: number;
  colorStart: string;
  colorEnd: string;
  textColor?: string;
}

interface ProgressBarGroupProps {
  titleKey: string;
  items: ProgressBarItem[];
  delay?: string;
}

function ProgressBarGroup({ titleKey, items, delay }: ProgressBarGroupProps) {
  const { t } = useI18n();
  return (
    <div className="card-in glass rounded-xl p-3 space-y-2.5" style={{ animationDelay: delay }}>
      <p className="text-[11px] font-medium text-[var(--text)]/80">{t(titleKey as never)}</p>
      {items.map((item, index) => (
        <div key={item.labelKey}>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-[var(--text)]/70">{t(item.labelKey as never)}</span>
            <span className="font-mono" style={{ color: item.textColor || item.colorStart }}>
              {item.value}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--text)]/5 overflow-hidden">
            <div
              className="h-full rounded-full animate-bar-grow"
              style={{
                width: `${item.value}%`,
                background: `linear-gradient(90deg,${item.colorStart},${item.colorEnd})`,
                animationDelay: `${0.6 + index * 0.1}s`,
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface TableRow {
  nameKey: string;
  sales: string;
  revenue: string;
  change: number;
}

interface DataTableProps {
  titleKey: string;
  rows: TableRow[];
  delay?: string;
}

function DataTable({ titleKey, rows, delay }: DataTableProps) {
  const { t } = useI18n();
  return (
    <div className="card-in glass rounded-xl overflow-hidden" style={{ animationDelay: delay }}>
      <div className="px-3 py-2 border-b border-[var(--text)]/8 text-[11px] font-medium text-[var(--text)]/80">
        {t(titleKey as never)}
      </div>
      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-[var(--text)]/40 text-[9px] uppercase tracking-wider">
            <th className="text-left font-medium px-3 py-1.5">{t("colProduct")}</th>
            <th className="text-right font-medium px-3 py-1.5">{t("colSales")}</th>
            <th className="text-right font-medium px-3 py-1.5">{t("colRevenue")}</th>
            <th className="text-right font-medium px-3 py-1.5">{t("colChange")}</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((row) => (
            <tr key={row.nameKey} className="border-t border-[var(--text)]/5">
              <td className="px-3 py-1.5 text-[var(--text)]/80 font-sans">{t(row.nameKey as never)}</td>
              <td className="px-3 py-1.5 text-right text-[var(--text)]/70">{row.sales}</td>
              <td className="px-3 py-1.5 text-right text-[var(--text)]">{row.revenue}</td>
              <td className="px-3 py-1.5 text-right" style={{ color: row.change >= 0 ? "#10B981" : "#FB7185" }}>
                {row.change >= 0 ? "+" : ""}
                {row.change}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { KPICard, LineChart, ProgressBarGroup, DataTable };

export const sampleKPIs = [
  { labelKey: "kpiRevenue", value: "¥2,847K", change: 12.3 },
  { labelKey: "kpiOrders", value: "18,429", change: 8.7 },
  { labelKey: "kpiConversion", value: "4.82%", change: -0.3 },
  { labelKey: "kpiAvgOrder", value: "¥154.5", change: 3.3 },
];

export const sampleProgressBars = [
  { labelKey: "onlineStore", value: 48, colorStart: "#38BDF8", colorEnd: "#7DD3FC", textColor: "#38BDF8" },
  { labelKey: "offlineStore", value: 32, colorStart: "#10B981", colorEnd: "#34D399", textColor: "#10B981" },
  { labelKey: "thirdParty", value: 20, colorStart: "#94A3B8", colorEnd: "#CBD5E1", textColor: "#94A3B8" },
];

export const sampleTableRows: TableRow[] = [
  { nameKey: "product1", sales: "3,240", revenue: "¥486K", change: 18 },
  { nameKey: "product2", sales: "1,820", revenue: "¥410K", change: 9 },
  { nameKey: "product3", sales: "2,560", revenue: "¥307K", change: -4 },
];
