import { useEffect, useState } from "react";

/* ── Radial Progress (circular gauge) ── */
type RadialProgressProps = {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
  sublabel?: string;
};

export function RadialProgress({
  value, max, size = 130, strokeWidth = 10,
  color = "#6366f1", label, sublabel
}: RadialProgressProps) {
  const [anim, setAnim] = useState(0);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(anim / Math.max(max, 1), 1);
  const offset = circ * (1 - pct);
  const c = size / 2;

  useEffect(() => { const t = setTimeout(() => setAnim(value), 80); return () => clearTimeout(t); }, [value]);

  return (
    <div className="radial-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={`url(#rg-${label})`} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${c} ${c})`}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 8px ${color}50)` }} />
        <defs>
          <linearGradient id={`rg-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}aa`} />
          </linearGradient>
        </defs>
      </svg>
      <div className="radial-text">
        <strong>{label}</strong>
        {sublabel && <small>{sublabel}</small>}
      </div>
    </div>
  );
}

/* ── Bar Chart ── */
type BarChartProps = {
  bars: Array<{ label: string; value: number }>;
  maxValue?: number;
  color?: string;
  height?: number;
};

export function BarChart({ bars, maxValue, color = "#6366f1", height = 150 }: BarChartProps) {
  const mx = maxValue || Math.max(...bars.map(b => b.value), 1);
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 80); return () => clearTimeout(t); }, []);

  return (
    <div className="bar-chart" style={{ height }}>
      <div className="bar-chart-bars">
        {bars.map((b, i) => {
          const pct = (b.value / mx) * 100;
          return (
            <div key={i} className="bar-col">
              <div className="bar-wrap">
                <div className="bar-fill" style={{
                  height: go ? `${pct}%` : "0%",
                  background: `linear-gradient(180deg, ${color}, ${color}66)`,
                  transitionDelay: `${i * 70}ms`
                }}>
                  {b.value > 0 && <span className="bar-val">{b.value}</span>}
                </div>
              </div>
              <span className="bar-lbl">{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Score Bar (horizontal) ── */
type ScoreBarProps = { score: number; maxScore?: number };

export function ScoreBar({ score, maxScore = 100 }: ScoreBarProps) {
  const pct = Math.min((score / maxScore) * 100, 100);
  const hue = Math.round((pct / 100) * 120);
  return (
    <div className="score-bar">
      <div className="score-track">
        <div className="score-fill" style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, hsl(${hue},72%,48%), hsl(${hue + 20},72%,58%))`
        }} />
      </div>
      <span className="score-label">{score}</span>
    </div>
  );
}
