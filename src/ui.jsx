/* =========================================================================
   Ayurveda Command Center — shared UI primitives & layout
   ========================================================================= */
const { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext } = React;
const H = window.AYUR.helpers;
const D = window.AYUR;

// ---------------------------------------------------------------------
// App-wide context: navigation, role, drawers
// ---------------------------------------------------------------------
const AppCtx = createContext(null);
function useApp() { return useContext(AppCtx); }

// Registry of top-level views, populated by modules1.jsx / modules2.jsx / modules3.jsx
const Views = {};

const ROLES = [
  { id: "vaidya", label: "Vaidya (Full clinical access)", perms: ["clinical", "business", "inventory", "orders", "appointments", "support"] },
  { id: "manager", label: "Clinic Manager", perms: ["business", "inventory", "orders", "appointments", "support"] },
  { id: "pharmacy", label: "Pharmacy Staff", perms: ["inventory", "orders"] },
  { id: "support", label: "Customer Support", perms: ["support", "appointments"] },
  { id: "founder", label: "Founder / Owner", perms: ["business"] },
  { id: "ai", label: "AI Agent (restricted)", perms: [] },
];
function hasPerm(role, perm) {
  const r = ROLES.find(x => x.id === role);
  return r ? r.perms.includes(perm) : false;
}

// ---------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------
function Icon({ name, size = 18, className = "" }) {
  const P = {
    home: "M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9",
    users: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm10.5 9v-1a3.5 3.5 0 0 0-2.5-3.36M15 3.13a3.5 3.5 0 0 1 0 6.75",
    whatsapp: "M20.5 12a8.5 8.5 0 1 1-3.86-7.14M8.5 10c.2 2 2.3 4.1 4.3 4.3M8.3 9.3c-.2-.6.1-1.6.6-1.9.4-.3 1-.2 1.3.3l.6 1c.2.4.1.8-.1 1.1l-.3.4c-.2.3-.2.6 0 .9.4.7 1.3 1.5 2 1.9.3.2.6.2.9 0l.4-.3c.3-.2.7-.3 1.1-.1l1 .6c.5.3.6.9.3 1.3-.3.5-1.3.8-1.9.6-1.9-.6-4.2-2.9-4.9-4.8Z",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z",
    calendar: "M8 2v4M16 2v4M3.5 9h17M4 5h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
    clock: "M12 7v5l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    box: "M21 8 12 3 3 8m18 0-9 5m9-5v9l-9 5M3 8l9 5m-9-5v9l9 5m0-9v9",
    truck: "M3 6h11v9H3zm11 3h4l3 3v3h-7zM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm12 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
    feedback: "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z",
    chart: "M3 3v18h18M7 15l4-5 3 3 5-7",
    bot: "M12 8V4H8m8 0h-4M5 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Zm2 6v.01M15 14v.01",
    bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35",
    shield: "M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Z",
    alert: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a1 1 0 0 0 .9 1.5h18.6a1 1 0 0 0 .9-1.5L13.7 3.9a1 1 0 0 0-1.7 0Z",
    check: "M20 6 9 17l-5-5",
    chev: "m9 18 6-6-6-6",
    chevDown: "m6 9 6 6 6-6",
    x: "M18 6 6 18M6 6l12 12",
    send: "m22 2-7 20-4-9-9-4Z",
    edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
    flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Zm0 0v7",
    sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8",
    doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M9 13h6M9 17h6M9 9h1",
    pill: "M4.5 12 12 4.5a5.3 5.3 0 0 1 7.5 7.5L12 19.5A5.3 5.3 0 0 1 4.5 12Zm3.5 3.5 8-8",
    money: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    refresh: "M3 12a9 9 0 0 1 15.3-6.5L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.3 6.5L3 16m0 5v-5h5",
    map: "m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Zm0 0V3m6 18V6",
    target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-6a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-2.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
    lock: "M6 10V7a6 6 0 1 1 12 0v3m-13 0h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z",
    trend: "M3 17l6-6 4 4 8-8M21 7h-6",
    heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z",
    filter: "M4 5h16l-6 8v6l-4 2v-8L4 5Z",
    layers: "m12 2 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
  };
  const d = P[name] || P.home;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

const STATUS_STYLES = {
  good: { bg: "var(--good-tint)", fg: "var(--good)" },
  warning: { bg: "var(--warning-tint)", fg: "var(--warning)" },
  serious: { bg: "var(--serious-tint)", fg: "var(--serious)" },
  critical: { bg: "var(--critical-tint)", fg: "var(--critical)" },
  neutral: { bg: "#f0efe9", fg: "#5c594f" },
  brand: { bg: "var(--brand-tint)", fg: "var(--brand-dark)" },
  accent: { bg: "var(--accent-tint)", fg: "var(--accent)" },
};
function Badge({ tone = "neutral", children, icon, className = "" }) {
  const s = STATUS_STYLES[tone] || STATUS_STYLES.neutral;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${className}`}
      style={{ background: s.bg, color: s.fg }}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

function priorityTone(p) {
  return p === "Critical" ? "critical" : p === "High" ? "serious" : p === "Medium" ? "warning" : "neutral";
}
function PriorityBadge({ priority }) {
  return <Badge tone={priorityTone(priority)}>{priority}</Badge>;
}

function Avatar({ name, size = 36 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const hue = Math.abs([...(name||"")].reduce((a,c)=>a+c.charCodeAt(0),0)) % 6;
  const colors = ["#1f6f5c","#b5731f","#2a78d6","#4a3aa7","#c2542c","#008300"];
  return (
    <div className="rounded-full flex items-center justify-center font-semibold text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, background: colors[hue] }}>
      {initials}
    </div>
  );
}

function Card({ children, className = "", ...rest }) {
  return <div className={`card ${className}`} {...rest}>{children}</div>;
}

function SectionHeader({ title, subtitle, action, icon }) {
  return (
    <div className="flex items-start justify-between mb-4 gap-3">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 rounded-lg p-2" style={{ background: "var(--brand-tint)", color: "var(--brand-dark)" }}><Icon name={icon} size={18} /></div>}
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--ink)]">{title}</h2>
          {subtitle && <p className="text-[13px] text-[var(--ink-muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Button({ variant = "primary", size = "md", children, className = "", disabled, title, ...rest }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-ring disabled:opacity-45 disabled:cursor-not-allowed";
  const sizes = { sm: "text-xs px-2.5 py-1.5", md: "text-[13px] px-3.5 py-2", lg: "text-sm px-5 py-2.5" };
  const variants = {
    primary: "text-white shadow-sm",
    secondary: "bg-white border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface-sunk)]",
    ghost: "text-[var(--ink-2)] hover:bg-[var(--surface-sunk)]",
    danger: "text-white",
    outlineBrand: "border border-[var(--brand)] text-[var(--brand-dark)] hover:bg-[var(--brand-tint)]",
  };
  const style = variant === "primary" ? { background: disabled ? "#a9a397" : "var(--brand)" }
    : variant === "danger" ? { background: "var(--critical)" } : {};
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} style={style} disabled={disabled} title={title} {...rest}>
      {children}
    </button>
  );
}

function EmptyState({ icon = "check", title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 text-[var(--ink-muted)]">
      <div className="rounded-full p-3 mb-3" style={{ background: "var(--good-tint)", color: "var(--good)" }}><Icon name={icon} size={22} /></div>
      <div className="text-sm font-medium text-[var(--ink-2)]">{title}</div>
      {subtitle && <div className="text-xs mt-1 max-w-xs">{subtitle}</div>}
    </div>
  );
}

function StatCard({ label, value, sub, icon, tone = "brand", onClick, delta }) {
  const s = STATUS_STYLES[tone] || STATUS_STYLES.brand;
  return (
    <button onClick={onClick} className="card p-4 text-left w-full hover:shadow-md hover:-translate-y-0.5 transition-all focus-ring group">
      <div className="flex items-center justify-between mb-2.5">
        <div className="rounded-lg p-1.5" style={{ background: s.bg, color: s.fg }}><Icon name={icon} size={16} /></div>
        {delta !== undefined && (
          <span className={`text-[11px] font-medium flex items-center gap-0.5 ${delta >= 0 ? "text-[var(--good)]" : "text-[var(--critical)]"}`}>
            <Icon name="trend" size={11} className={delta < 0 ? "rotate-90" : ""} />{delta >= 0 ? "+" : ""}{delta}%
          </span>
        )}
      </div>
      <div className="text-[22px] font-semibold text-[var(--ink)] tabular leading-none">{value}</div>
      <div className="text-[12.5px] text-[var(--ink-muted)] mt-1.5">{label}</div>
      {sub && <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">{sub}</div>}
    </button>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 border-b border-[var(--border-soft)] mb-5 overflow-x-auto scrollbar-thin">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors focus-ring ${active === t.id ? "border-[var(--brand)] text-[var(--brand-dark)]" : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-2)]"}`}>
          {t.label}{t.count !== undefined && <span className="ml-1.5 text-[11px] opacity-70">({t.count})</span>}
        </button>
      ))}
    </div>
  );
}

function Table({ columns, rows, onRowClick, empty }) {
  if (!rows || rows.length === 0) return <EmptyState title={empty || "Nothing here yet"} />;
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-[13px] min-w-[640px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--ink-muted)] border-b border-[var(--border-soft)]">
            {columns.map(c => <th key={c.key} className="py-2 px-3 font-medium">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i} onClick={() => onRowClick && onRowClick(row)}
              className={`border-b border-[var(--border-soft)] last:border-0 ${onRowClick ? "cursor-pointer hover:bg-[var(--surface-sunk)]" : ""}`}>
              {columns.map(c => <td key={c.key} className="py-2.5 px-3 align-middle">{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useEscapeToClose(open, onClose) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
}

function Modal({ open, onClose, title, children, width = "max-w-2xl" }) {
  useEscapeToClose(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(20,18,14,0.45)" }} onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full ${width} max-h-[88vh] overflow-y-auto fade-in`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-soft)] sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="font-semibold text-[15px]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-sunk)] focus-ring"><Icon name="x" size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Drawer({ open, onClose, title, children, width = "max-w-xl" }) {
  useEscapeToClose(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(20,18,14,0.4)" }} onClick={onClose}>
      <div className={`bg-[var(--paper)] w-full ${width} h-full overflow-y-auto fade-in shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-soft)] sticky top-0 bg-[var(--paper)] z-10">
          <h3 className="font-semibold text-[15px]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white focus-ring"><Icon name="x" size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ProvenanceTag({ kind }) {
  // kind: verified-clinic | classical | general | inference | unverified
  const map = {
    "classical": { tone: "brand", label: "Classical source", icon: "book" },
    "verified-clinic": { tone: "good", label: "Verified clinic knowledge", icon: "shield" },
    "general": { tone: "neutral", label: "General informational source", icon: "doc" },
    "inference": { tone: "accent", label: "AI inference", icon: "sparkle" },
    "unverified": { tone: "critical", label: "Reference not verified — Vaidya review required", icon: "alert" },
  };
  const m = map[kind] || map.inference;
  return <Badge tone={m.tone} icon={m.icon}>{m.label}</Badge>;
}

// ---------------------------------------------------------------------
// Hand-rolled SVG charts (no external chart library — fully self-contained)
// Follows dataviz guide: one axis, thin 2px marks, recessive gridlines,
// fixed categorical hue order, hover tooltip, legend for multi-series.
// ---------------------------------------------------------------------
const SERIES_HUES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

function niceTicks(max, count = 4) {
  if (max <= 0) return [0, 1];
  const step = Math.pow(10, Math.floor(Math.log10(max / count)));
  const err = (max / count) / step;
  const mult = err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
  const niceStep = step * mult;
  const ticks = [];
  for (let v = 0; v <= max + niceStep * 0.001; v += niceStep) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

function LineChart({ labels, series, height = 220, formatY = (v) => v, formatX = (v) => v, currency = false }) {
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);
  const pad = { l: 44, r: 14, t: 14, b: 26 };
  const w = 640, h = height;
  const maxVal = Math.max(1, ...series.flatMap(s => s.data));
  const ticks = niceTicks(maxVal, 4);
  const yMax = ticks[ticks.length - 1];
  const xN = labels.length;
  const xAt = (i) => pad.l + (i / Math.max(1, xN - 1)) * (w - pad.l - pad.r);
  const yAt = (v) => h - pad.b - (v / yMax) * (h - pad.t - pad.b);

  function onMove(e) {
    const rect = wrapRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * w;
    let idx = Math.round(((relX - pad.l) / (w - pad.l - pad.r)) * (xN - 1));
    idx = Math.max(0, Math.min(xN - 1, idx));
    setHover(idx);
  }

  return (
    <div className="relative" ref={wrapRef} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={height} preserveAspectRatio="none" style={{ overflow: "visible" }}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={yAt(t)} y2={yAt(t)} stroke="var(--gridline,#e6e2d6)" strokeWidth="1" />
            <text x={pad.l - 8} y={yAt(t) + 3} textAnchor="end" fontSize="9.5" fill="#8a877d">{currency ? "₹" + (t >= 1000 ? (t/1000)+"k" : t) : formatY(t)}</text>
          </g>
        ))}
        {labels.map((l, i) => (i % Math.ceil(xN / 6) === 0) && (
          <text key={i} x={xAt(i)} y={h - 6} textAnchor="middle" fontSize="9.5" fill="#8a877d">{formatX(l)}</text>
        ))}
        {series.map((s, si) => {
          const color = s.color || SERIES_HUES[si];
          const pts = s.data.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
          const area = `${pad.l},${yAt(0)} ${pts} ${xAt(xN-1)},${yAt(0)}`;
          return (
            <g key={si}>
              {s.area !== false && <polygon points={area} fill={color} opacity="0.08" />}
              <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
        {hover !== null && (
          <g>
            <line x1={xAt(hover)} x2={xAt(hover)} y1={pad.t} y2={h - pad.b} stroke="#c3c2b7" strokeWidth="1" strokeDasharray="3,3" />
            {series.map((s, si) => <circle key={si} cx={xAt(hover)} cy={yAt(s.data[hover])} r="4" fill="#fff" stroke={s.color || SERIES_HUES[si]} strokeWidth="2" />)}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="absolute bg-white border border-[var(--border)] rounded-lg shadow-md px-2.5 py-1.5 text-[11.5px] pointer-events-none z-10"
          style={{ left: `min(${(xAt(hover) / w) * 100}%, 78%)`, top: 0 }}>
          <div className="font-medium text-[var(--ink)] mb-0.5">{formatX(labels[hover])}</div>
          {series.map((s, si) => <div key={si} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: s.color || SERIES_HUES[si] }} />{s.name}: <span className="tabular font-medium">{currency ? H.fmtINR(s.data[hover]) : s.data[hover]}</span></div>)}
        </div>
      )}
      {series.length > 1 && (
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {series.map((s, si) => <div key={si} className="flex items-center gap-1.5 text-[11.5px] text-[var(--ink-2)]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color || SERIES_HUES[si] }} />{s.name}</div>)}
        </div>
      )}
    </div>
  );
}

function BarChart({ labels, series, height = 220, formatY = (v) => v, currency = false, horizontal = false }) {
  const [hover, setHover] = useState(null);
  const pad = { l: horizontal ? 96 : 44, r: 14, t: 10, b: horizontal ? 10 : 26 };
  const w = 640, h = height;
  const maxVal = Math.max(1, ...series.flatMap(s => s.data));
  const ticks = niceTicks(maxVal, 4);
  const yMax = ticks[ticks.length - 1];
  const n = labels.length;
  const groupW = (w - pad.l - pad.r) / n;
  const barW = Math.min(28, (groupW * 0.62) / series.length);

  if (horizontal) {
    const rowH = (h - pad.t - pad.b) / n;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={height}>
        {labels.map((l, i) => {
          const y = pad.t + i * rowH;
          const val = series[0].data[i];
          const bw = (val / yMax) * (w - pad.l - pad.r);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <text x={pad.l - 8} y={y + rowH * 0.55} textAnchor="end" fontSize="10.5" fill="#403e37">{l}</text>
              <rect x={pad.l} y={y + rowH * 0.18} width={w - pad.l - pad.r} height={rowH * 0.64} fill="#f0efe9" rx="4" />
              <rect x={pad.l} y={y + rowH * 0.18} width={Math.max(2, bw)} height={rowH * 0.64} fill={hover === i ? "#154e40" : "#1f6f5c"} rx="4" />
              <text x={pad.l + Math.max(2, bw) + 6} y={y + rowH * 0.55} fontSize="10.5" fill="#161512" fontWeight="600">{currency ? H.fmtINR(val) : val}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={height}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={h - pad.b - (t/yMax)*(h-pad.t-pad.b)} y2={h - pad.b - (t/yMax)*(h-pad.t-pad.b)} stroke="#e6e2d6" strokeWidth="1" />
            <text x={pad.l - 8} y={h - pad.b - (t/yMax)*(h-pad.t-pad.b) + 3} textAnchor="end" fontSize="9.5" fill="#8a877d">{currency ? "₹"+(t>=1000?(t/1000)+"k":t) : formatY(t)}</text>
          </g>
        ))}
        {labels.map((l, i) => {
          const gx = pad.l + i * groupW + groupW / 2 - (series.length * barW) / 2;
          return (
            <g key={i}>
              {series.map((s, si) => {
                const val = s.data[i];
                const bh = (val / yMax) * (h - pad.t - pad.b);
                const color = s.color || SERIES_HUES[si];
                return (
                  <rect key={si} x={gx + si * barW} y={h - pad.b - bh} width={barW - 3} height={bh} rx="3"
                    fill={color} opacity={hover && hover.i === i && hover.si !== si ? 0.45 : 1}
                    onMouseEnter={() => setHover({ i, si })} onMouseLeave={() => setHover(null)} />
                );
              })}
              <text x={pad.l + i * groupW + groupW / 2} y={h - 8} textAnchor="middle" fontSize="9.5" fill="#8a877d">{l}</text>
            </g>
          );
        })}
      </svg>
      {series.length > 1 && (
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {series.map((s, si) => <div key={si} className="flex items-center gap-1.5 text-[11.5px] text-[var(--ink-2)]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color || SERIES_HUES[si] }} />{s.name}</div>)}
        </div>
      )}
    </div>
  );
}

function ConfidenceMeter({ level }) {
  // level: high | medium | low
  const pct = level === "high" ? 85 : level === "medium" ? 55 : 25;
  const color = level === "high" ? "var(--good)" : level === "medium" ? "var(--warning)" : "var(--critical)";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-[var(--surface-sunk)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: pct + "%", background: color }} />
      </div>
      <span className="text-[11px] text-[var(--ink-muted)] capitalize">{level} confidence</span>
    </div>
  );
}
