import { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  Users,
  Clock3,
  CheckCircle2,
  XCircle,
  Phone,
  Target,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Zap,
  Award,
  RefreshCw,
} from "lucide-react";

// ─── Utility ───────────────────────────────────────────────────────────────────
function useCountUp(target, duration = 900, active = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || target == null) return;
    const start = performance.now();
    const from = 0;
    const raf = (ts) => {
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [target, duration, active]);
  return value;
}

// ─── Animated counter cell ─────────────────────────────────────────────────────
function CountCell({ value, suffix = "", className = "" }) {
  const animated = useCountUp(value ?? 0, 800, value != null);
  return (
    <span className={className}>
      {value == null ? "—" : animated}
      {value != null && suffix}
    </span>
  );
}

// ─── Funnel step config ────────────────────────────────────────────────────────
const FUNNEL_STEPS = [
  {
    key: "total",
    label: "Total Leads",
    sublabel: "All assigned",
    icon: Users,
    gradient: "from-slate-600 to-slate-700",
    glow: "shadow-slate-500/20",
    ring: "ring-slate-500/30",
    bar: "bg-gradient-to-r from-slate-400 to-slate-500",
    textAccent: "text-slate-300",
  },
  {
    key: "inProcess",
    label: "In Process",
    sublabel: "Being worked",
    icon: Clock3,
    gradient: "from-amber-600 to-orange-700",
    glow: "shadow-amber-500/20",
    ring: "ring-amber-500/30",
    bar: "bg-gradient-to-r from-amber-400 to-orange-500",
    textAccent: "text-amber-300",
  },
  {
    key: "qa1",
    label: "Qualified L1",
    sublabel: "First tier",
    icon: Target,
    gradient: "from-blue-600 to-blue-800",
    glow: "shadow-blue-500/20",
    ring: "ring-blue-500/30",
    bar: "bg-gradient-to-r from-blue-400 to-blue-600",
    textAccent: "text-blue-300",
  },
  {
    key: "qa2",
    label: "Qualified L2",
    sublabel: "Second tier",
    icon: TrendingUp,
    gradient: "from-indigo-600 to-violet-800",
    glow: "shadow-indigo-500/20",
    ring: "ring-indigo-500/30",
    bar: "bg-gradient-to-r from-indigo-400 to-violet-500",
    textAccent: "text-indigo-300",
  },
  {
    key: "qa3",
    label: "Qualified L3",
    sublabel: "Top tier",
    icon: Award,
    gradient: "from-emerald-600 to-teal-700",
    glow: "shadow-emerald-500/20",
    ring: "ring-emerald-500/30",
    bar: "bg-gradient-to-r from-emerald-400 to-teal-500",
    textAccent: "text-emerald-300",
  },
];

// ─── Disposition config ────────────────────────────────────────────────────────
const DISP_CONFIG = {
  appointment: {
    color: "bg-emerald-500",
    text: "text-emerald-400",
    label: "Appointment",
  },
  followup: {
    color: "bg-amber-500",
    text: "text-amber-400",
    label: "Follow-up",
  },
  voicemail: {
    color: "bg-slate-500",
    text: "text-slate-400",
    label: "Voicemail",
  },
  "not-interested": {
    color: "bg-rose-500",
    text: "text-rose-400",
    label: "Not Interested",
  },
  "wrong-number": {
    color: "bg-orange-500",
    text: "text-orange-400",
    label: "Wrong Number",
  },
};

// ─── FunnelBar ─────────────────────────────────────────────────────────────────
function FunnelBar({ step, value, maxValue, index, isHighlighted, onClick }) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  const width = maxValue > 0 ? `${(value / maxValue) * 100}%` : "0%";
  const Icon = step.icon;
  const animatedPct = useCountUp(pct, 800 + index * 80);

  return (
    <button
      onClick={onClick}
      className={`group w-full cursor-pointer text-left transition-all duration-200 ${
        isHighlighted ? "scale-[1.01]" : "hover:scale-[1.005]"
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-xl border bg-slate-900 p-4 transition-all duration-200 ${
          isHighlighted
            ? `border-slate-500/60 ring-2 ${step.ring} shadow-xl ${step.glow}`
            : "border-slate-700/50 hover:border-slate-600/60"
        }`}
      >
        {/* Subtle bg glow on highlight */}
        {isHighlighted && (
          <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${step.gradient}`} />
        )}

        <div className="relative flex items-center gap-4">
          {/* Icon */}
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${step.gradient} shadow-lg ${step.glow}`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>

          {/* Labels */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-slate-200">
                {step.label}
              </span>
              <span className={`text-2xl font-bold tabular-nums ${step.textAccent}`}>
                <CountCell value={value} />
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${step.bar} transition-all duration-700 ease-out`}
                style={{ width, transitionDelay: `${index * 80}ms` }}
              />
            </div>

            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-slate-500">{step.sublabel}</span>
              <span className="text-xs font-medium text-slate-400">
                {animatedPct}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Disposition donut ─────────────────────────────────────────────────────────
function DispositionDonut({ data }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 text-sm">
        No disposition data
      </div>
    );
  }

  // Build SVG pie
  const cx = 80, cy = 80, r = 60, gap = 2;
  const colors = {
    appointment: "#10b981",
    followup: "#f59e0b",
    voicemail: "#64748b",
    "not-interested": "#f43f5e",
    "wrong-number": "#f97316",
  };

  let cumulative = 0;
  const slices = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([key, v]) => {
      const pct = v / total;
      const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
      cumulative += pct;
      const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
      const large = pct > 0.5 ? 1 : 0;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      return { key, v, pct, color: colors[key], d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
    });

  return (
    <div className="flex items-center gap-4">
      <svg width={160} height={160} viewBox="0 0 160 160" className="flex-shrink-0">
        {/* hole */}
        <circle cx={cx} cy={cy} r={36} fill="#0f172a" />
        {slices.map((s) => (
          <path key={s.key} d={s.d} fill={s.color} opacity={0.9} />
        ))}
        <circle cx={cx} cy={cy} r={36} fill="#0f172a" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#e2e8f0" fontSize={20} fontWeight="bold">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize={9}>
          total calls
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0">
        {slices.map((s) => {
          const cfg = DISP_CONFIG[s.key] || {};
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${cfg.color}`} />
              <span className="text-xs text-slate-400 truncate">{cfg.label || s.key}</span>
              <span className={`ml-auto text-xs font-bold tabular-nums ${cfg.text}`}>{s.v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Conversion rate badge ─────────────────────────────────────────────────────
function ConversionBadge({ label, from, to }) {
  const rate = from > 0 ? Math.round((to / from) * 100) : 0;
  const color =
    rate >= 50 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
    rate >= 25 ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
    "text-rose-400 border-rose-500/30 bg-rose-500/10";

  return (
    <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${color}`}>
      <span className="text-xs font-medium opacity-80">{label}</span>
      <span className="text-sm font-bold tabular-nums">{rate}%</span>
    </div>
  );
}

export default function AgentFunnelAnalytics({ stats, leads = [], isLoading, onRefresh }) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedStep, setHighlightedStep] = useState(null);

  // Fallback to current page counts if overall stats are unavailable.
  const pageDispositionCounts = leads.reduce((acc, lead) => {
    if (lead.disposition) {
      acc[lead.disposition] = (acc[lead.disposition] || 0) + 1;
    }
    return acc;
  }, {});
  const dispositionCounts =
    stats?.byDisposition && Object.keys(stats.byDisposition).length > 0
      ? stats.byDisposition
      : pageDispositionCounts;

  const maxValue = stats.total || 1;

  // Conversion rates
  const convRates = [
    { label: "Total → In Process", from: stats.total, to: stats.inProcess },
    { label: "In Process → L1", from: stats.inProcess, to: stats.qa1 },
    { label: "L1 → L2", from: stats.qa1, to: stats.qa2 },
    { label: "L2 → L3 (Top)", from: stats.qa2, to: stats.qa3 },
  ];

  const totalQualified = (stats.qa1 || 0) + (stats.qa2 || 0) + (stats.qa3 || 0);
  const overallConv = stats.total > 0 ? Math.round((totalQualified / stats.total) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-950 shadow-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-900/60"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white tracking-wide">Sales Funnel</p>
            <p className="text-xs text-slate-400">Your lead pipeline at a glance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Overall conversion pill */}
          <div
            className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
              overallConv >= 30
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : overallConv >= 10
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            <Zap className="h-3 w-3" />
            {overallConv}% overall conversion
          </div>

          {onRefresh && (
            <button
              onClick={(e) => { e.stopPropagation(); onRefresh(); }}
              disabled={isLoading}
              className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 transition hover:border-slate-600 hover:text-slate-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          )}

          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Body */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-slate-800 px-6 pb-6 pt-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Funnel Steps — takes 2 cols */}
            <div className="lg:col-span-2 space-y-2.5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Pipeline Stages
              </p>
              {FUNNEL_STEPS.map((step, i) => (
                <FunnelBar
                  key={step.key}
                  step={step}
                  value={stats[step.key] ?? 0}
                  maxValue={maxValue}
                  index={i}
                  isHighlighted={highlightedStep === step.key}
                  onClick={() =>
                    setHighlightedStep((prev) =>
                      prev === step.key ? null : step.key
                    )
                  }
                />
              ))}
            </div>

            {/* Right panel */}
            <div className="flex flex-col gap-4">
              {/* Conversion rates */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Stage Conversion
                </p>
                <div className="space-y-2">
                  {convRates.map((r) => (
                    <ConversionBadge key={r.label} {...r} />
                  ))}
                </div>
              </div>

              {/* Disposition donut */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Disposition Split
                  <span className="ml-1.5 text-slate-600 normal-case font-normal">(overall)</span>
                </p>
                <DispositionDonut data={dispositionCounts} />
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-700/50 bg-slate-900 p-3 text-center">
                  <p className="text-xs text-slate-500">Total Qualified</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-400 tabular-nums">
                    <CountCell value={totalQualified} />
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-900 p-3 text-center">
                  <p className="text-xs text-slate-500">Overall Conv.</p>
                  <p
                    className={`mt-1 text-2xl font-bold tabular-nums ${
                      overallConv >= 30 ? "text-emerald-400" :
                      overallConv >= 10 ? "text-amber-400" : "text-slate-400"
                    }`}
                  >
                    <CountCell value={overallConv} suffix="%" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}