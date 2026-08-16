const NAV = [
  { id: "dashboard", label: "Command Center", icon: "home" },
  { id: "patients", label: "Patients", icon: "users" },
  { id: "whatsapp", label: "WhatsApp Agent", icon: "whatsapp", badgeKey: "waitingForResponse" },
  { id: "knowledge", label: "Ayurveda Copilot", icon: "book" },
  { id: "appointments", label: "Appointments", icon: "calendar" },
  { id: "followups", label: "Follow-ups & Refills", icon: "clock", badgeKey: "followUpsDueToday" },
  { id: "inventory", label: "Inventory", icon: "box", badgeKey: "medsToReplenish" },
  { id: "orders", label: "Orders & Shipments", icon: "truck" },
  { id: "business", label: "Feedback & Business", icon: "chart" },
  { id: "agents", label: "AI Agents", icon: "bot" },
  { id: "alerts", label: "Alert Center", icon: "bell" }
];
function Sidebar({ view, setView, kpis, role }) {
  return /* @__PURE__ */ React.createElement("aside", { className: "w-[236px] shrink-0 h-full flex flex-col text-white", style: { background: "linear-gradient(180deg,#163d34,#0f2b25)" } }, /* @__PURE__ */ React.createElement("div", { className: "px-5 pt-5 pb-4 flex items-center gap-2.5 border-b border-white/10" }, /* @__PURE__ */ React.createElement("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center", style: { background: "rgba(255,255,255,0.12)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "sparkle", size: 19 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "font-semibold text-[14.5px] leading-tight" }, "Ayurveda", /* @__PURE__ */ React.createElement("br", null), "Command Center"))), /* @__PURE__ */ React.createElement("nav", { className: "flex-1 overflow-y-auto py-3 px-2.5 scrollbar-thin" }, NAV.map((n) => {
    const active = view === n.id;
    const badge = n.badgeKey ? kpis[n.badgeKey] : null;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: n.id,
        onClick: () => setView(n.id),
        className: `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium mb-0.5 transition-colors focus-ring ${active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/8 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement(Icon, { name: n.icon, size: 17 }),
      /* @__PURE__ */ React.createElement("span", { className: "flex-1 text-left" }, n.label),
      !!badge && /* @__PURE__ */ React.createElement("span", { className: "text-[10.5px] font-semibold rounded-full px-1.5 py-0.5", style: { background: active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)" } }, badge)
    );
  })), /* @__PURE__ */ React.createElement("div", { className: "p-3 border-t border-white/10" }, /* @__PURE__ */ React.createElement("div", { className: "rounded-xl p-3", style: { background: "rgba(255,255,255,0.08)" } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-[12px] text-white/70 mb-1" }, /* @__PURE__ */ React.createElement(Icon, { name: "shield", size: 13 }), "Demo data only"), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-white/50 leading-snug" }, "All patients, orders & conversations are synthetic — for prototype demonstration."))));
}
function RoleSwitcher({ role, setRole }) {
  const [open, setOpen] = useState(false);
  const r = ROLES.find((x) => x.id === role);
  return /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setOpen((o) => !o), className: "flex items-center gap-2 border border-[var(--border)] rounded-lg px-3 py-1.5 text-[12.5px] font-medium hover:bg-[var(--surface-sunk)] focus-ring" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 14 }), " ", r.label.split(" (")[0], " ", /* @__PURE__ */ React.createElement(Icon, { name: "chevDown", size: 14 })), open && /* @__PURE__ */ React.createElement("div", { className: "absolute right-0 top-full mt-1.5 w-72 bg-white border border-[var(--border)] rounded-xl shadow-lg py-1.5 z-40 fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "px-3 py-1.5 text-[11px] uppercase tracking-wide text-[var(--ink-muted)]" }, "View as role"), ROLES.map((x) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: x.id,
      onClick: () => {
        setRole(x.id);
        setOpen(false);
      },
      className: `w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--surface-sunk)] flex items-center justify-between ${role === x.id ? "font-semibold text-[var(--brand-dark)]" : ""}`
    },
    x.label,
    role === x.id && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 14 })
  )), /* @__PURE__ */ React.createElement("div", { className: "px-3 pt-2 pb-1 text-[11px] text-[var(--ink-muted)] border-t border-[var(--border-soft)] mt-1" }, "Switching role changes what actions are permitted — the AI agent itself always has the most restricted access.")));
}
function GlobalSearch({ onNavigate }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    if (q.trim().length < 2) return null;
    const query = q.trim().toLowerCase();
    const out = [];
    D.patients.filter((p) => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)).slice(0, 5).forEach((p) => out.push({ type: "Patient", label: p.name, sub: `${p.id} \xB7 ${p.city}`, go: () => onNavigate("patients", { patientId: p.id }) }));
    D.orders.filter((o) => o.id.toLowerCase().includes(query) || o.patientName.toLowerCase().includes(query)).slice(0, 4).forEach((o) => out.push({ type: "Order", label: o.id, sub: `${o.patientName} \xB7 ${H.fmtINR(o.value)}`, go: () => onNavigate("orders", { tab: "orders", orderId: o.id }) }));
    D.medicines.filter((m) => m.name.toLowerCase().includes(query)).slice(0, 4).forEach((m) => out.push({ type: "Medicine", label: m.name, sub: m.sku, go: () => onNavigate("inventory", { medId: m.id }) }));
    D.appointments.filter((a) => a.patientName.toLowerCase().includes(query)).slice(0, 3).forEach((a) => out.push({ type: "Appointment", label: a.patientName, sub: `${H.fmtDate(a.date)} \xB7 ${a.time}`, go: () => onNavigate("appointments", {}) }));
    D.conversations.filter((c) => c.patientName.toLowerCase().includes(query)).slice(0, 3).forEach((c) => out.push({ type: "WhatsApp", label: c.patientName, sub: c.lastMessage.classification, go: () => onNavigate("whatsapp", { convId: c.id }) }));
    D.shipments.filter((s) => s.trackingNo.toLowerCase().includes(query) || String(s.pincode).includes(query)).slice(0, 3).forEach((s) => out.push({ type: "Shipment", label: s.trackingNo, sub: `${s.destination}`, go: () => onNavigate("orders", { tab: "shipments", shipmentId: s.id }) }));
    D.knowledgeDocs.filter((k) => k.title.toLowerCase().includes(query)).slice(0, 3).forEach((k) => out.push({ type: "Knowledge", label: k.title, sub: k.category, go: () => onNavigate("knowledge", {}) }));
    return out.slice(0, 12);
  }, [q]);
  return /* @__PURE__ */ React.createElement("div", { className: "relative flex-1 max-w-md" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 border border-[var(--border)] rounded-lg px-3 py-1.5 bg-white" }, /* @__PURE__ */ React.createElement(Icon, { name: "search", size: 15, className: "text-[var(--ink-muted)]" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: q,
      onChange: (e) => {
        setQ(e.target.value);
        setOpen(true);
      },
      onFocus: () => setOpen(true),
      placeholder: "Search patients, orders, medicines, shipments, WhatsApp…",
      className: "flex-1 text-[13px] outline-none bg-transparent placeholder:text-[var(--ink-muted)]"
    }
  ), q && /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setQ("");
  } }, /* @__PURE__ */ React.createElement(Icon, { name: "x", size: 14, className: "text-[var(--ink-muted)]" }))), open && results && /* @__PURE__ */ React.createElement("div", { className: "absolute left-0 top-full mt-1.5 w-full bg-white border border-[var(--border)] rounded-xl shadow-lg py-1.5 z-40 max-h-96 overflow-y-auto fade-in", onMouseLeave: () => setOpen(false) }, results.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "px-3 py-3 text-[13px] text-[var(--ink-muted)]" }, 'No matches for "', q, '"'), results.map((r, i) => /* @__PURE__ */ React.createElement("button", { key: i, onClick: () => {
    r.go();
    setOpen(false);
    setQ("");
  }, className: "w-full text-left px-3 py-2 hover:bg-[var(--surface-sunk)] flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "text-[13px] font-medium truncate" }, r.label), /* @__PURE__ */ React.createElement("div", { className: "text-[11.5px] text-[var(--ink-muted)] truncate" }, r.sub)), /* @__PURE__ */ React.createElement(Badge, { tone: "neutral" }, r.type)))));
}
function NotificationPanel({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const critical = D.alerts.filter((a) => a.level === "critical" || a.level === "warning").length;
  return /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setOpen((o) => !o), className: "relative p-2 rounded-lg hover:bg-[var(--surface-sunk)] focus-ring" }, /* @__PURE__ */ React.createElement(Icon, { name: "bell", size: 18 }), critical > 0 && /* @__PURE__ */ React.createElement("span", { className: "absolute top-1 right-1 w-2 h-2 rounded-full pulse-dot", style: { background: "var(--critical)" } })), open && /* @__PURE__ */ React.createElement("div", { className: "absolute right-0 top-full mt-1.5 w-96 bg-white border border-[var(--border)] rounded-xl shadow-lg z-40 fade-in", onMouseLeave: () => setOpen(false) }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between px-4 py-3 border-b border-[var(--border-soft)]" }, /* @__PURE__ */ React.createElement("div", { className: "font-semibold text-[13.5px]" }, "Notifications"), /* @__PURE__ */ React.createElement("button", { className: "text-[12px] text-[var(--brand-dark)] font-medium", onClick: () => {
    setOpen(false);
    onNavigate("alerts", {});
  } }, "View all")), /* @__PURE__ */ React.createElement("div", { className: "max-h-96 overflow-y-auto" }, D.alerts.slice(0, 8).map((a) => /* @__PURE__ */ React.createElement(AlertRow, { key: a.id, a, compact: true })))));
}
const ALERT_META = {
  critical: { emoji: "\u{1F534}", tone: "critical" },
  warning: { emoji: "\u{1F7E0}", tone: "serious" },
  info: { emoji: "\u{1F7E1}", tone: "warning" },
  good: { emoji: "\u{1F7E2}", tone: "good" }
};
function AlertRow({ a, compact }) {
  const m = ALERT_META[a.level] || ALERT_META.info;
  return /* @__PURE__ */ React.createElement("div", { className: `flex items-start gap-2.5 px-4 ${compact ? "py-2.5" : "py-3"} border-b border-[var(--border-soft)] last:border-0` }, /* @__PURE__ */ React.createElement("span", { className: "text-[13px] leading-none mt-0.5" }, m.emoji), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-[13px] text-[var(--ink)] leading-snug" }, a.text), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-[var(--ink-muted)] mt-0.5 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(Badge, { tone: "neutral", className: "!py-0.5 !px-1.5" }, a.category), H.timeAgo(a.time))));
}
const ASSISTANT_QA = [
  { q: /follow.?up/i, a: () => `There are ${D.followUps.length} patients needing follow-up attention, ${D.followUps.filter((f) => f.status === "Overdue").length} of them overdue. Highest priority: ${D.followUps.slice(0, 3).map((f) => f.patientName).join(", ")}.`, nav: "followups" },
  { q: /shipment|delay/i, a: () => `${D.shipments.filter((s) => ["Delivery attempted", "Returned"].includes(s.status)).length} shipments currently show delivery issues, and ${D.shipments.filter((s) => ["Dispatched", "In transit"].includes(s.status)).length} are in transit. Demo/simulated tracking data.`, nav: "orders" },
  { q: /replenish|stock|inventory|low stock/i, a: () => `${D.replenishment.length} medicines are projected to stock out within 21 days. Most urgent: ${D.replenishment[0] ? D.replenishment[0].name + " (~" + D.replenishment[0].projectedStockoutDays + " days)" : "none"}.`, nav: "inventory" },
  { q: /summariz.*quer|today.*quer|patient quer/i, a: () => `${D.kpis.newQueries} new patient inquiries and ${D.kpis.waitingForResponse} conversations are awaiting a response today, classified across order status, medicine questions and clinical concerns.`, nav: "whatsapp" },
  { q: /unanswered|draft response/i, a: () => `${D.kpis.waitingForResponse} WhatsApp threads have an AI-drafted response pending your approval. Opening the WhatsApp Agent so you can review and approve each one individually — the AI never sends without approval.`, nav: "whatsapp" },
  { q: /reorder|not reorder/i, a: () => `${D.refills.filter((r) => r.daysLeft < 0).length} patients look overdue for a medicine refill based on their prescribed course length, and haven't placed a new order yet.`, nav: "followups" },
  { q: /operational problem|this month/i, a: () => `Top operational themes this month: delivery exceptions (${D.deliveryExceptions.filter((d) => d.status !== "Resolved").length} open), follow-up gaps (${D.followUps.filter((f) => f.status === "Overdue").length} overdue), and ${D.inventoryAlerts.filter((a) => a.severity === "Critical").length} critical inventory alerts.`, nav: "alerts" },
  { q: /briefing|tomorrow/i, a: () => `Tomorrow's projected load: ${D.appointments.filter((a) => a.dayKey === new Date(H.daysFromNow(1)).toISOString().slice(0, 10)).length} appointments, ${D.followUps.length} open follow-ups, and ${D.replenishment.length} inventory items awaiting a purchase decision.`, nav: "dashboard" },
  { q: /treatment.*ending|course.*ending/i, a: () => `${D.refills.length} patients have a prescription course ending within \xB110 days. I can draft refill-reminder messages for your approval — nothing is sent automatically.`, nav: "followups" },
  { q: /revenue|business|decline/i, a: () => `This month's revenue is ${H.fmtINR(D.kpis.monthRevenue)}, ${D.kpis.revenueGrowthPct >= 0 ? "up" : "down"} ${Math.abs(D.kpis.revenueGrowthPct)}% vs the prior month. Medicine sales and consultations both contribute — see Business Command Center for the full breakdown.`, nav: "business" }
];
function AssistantWidget({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "assistant", text: `Hi, I'm your Ayurveda Command Center assistant. Ask me things like "Which patients need follow-up today?" or "Show delayed medicine shipments." I only surface information and drafts — the Vaidya approves every clinical action.` }]);
  const [input, setInput] = useState("");
  function send(text) {
    const q = text || input;
    if (!q.trim()) return;
    const match = ASSISTANT_QA.find((x) => x.q.test(q));
    const answer = match ? match.a() : "Here's what I found across the clinic records — opening the most relevant module so you can review the underlying data.";
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "assistant", text: answer, nav: match && match.nav }]);
    setInput("");
  }
  const suggestions = ["Which patients need follow-up today?", "Show delayed medicine shipments.", "What medicines need replenishment?", "Summarize today's patient queries.", "Give me tomorrow's clinic briefing."];
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { onClick: () => setOpen((o) => !o), className: "fixed bottom-5 right-5 z-40 rounded-full shadow-lg text-white flex items-center gap-2 px-4 py-3 hover:brightness-110 focus-ring", style: { background: "var(--brand)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "sparkle", size: 18 }), " ", /* @__PURE__ */ React.createElement("span", { className: "text-[13px] font-semibold hidden sm:inline" }, "Ask Command Center")), open && /* @__PURE__ */ React.createElement("div", { className: "fixed bottom-20 right-5 z-40 w-[380px] max-w-[92vw] h-[520px] bg-white rounded-2xl shadow-2xl border border-[var(--border)] flex flex-col fade-in overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "px-4 py-3 text-white flex items-center justify-between", style: { background: "var(--brand)" } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-[13.5px] font-semibold" }, /* @__PURE__ */ React.createElement(Icon, { name: "sparkle", size: 16 }), "Ask Ayurveda Command Center"), /* @__PURE__ */ React.createElement("button", { onClick: () => setOpen(false) }, /* @__PURE__ */ React.createElement(Icon, { name: "x", size: 16 }))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-thin" }, msgs.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: `flex ${m.role === "user" ? "justify-end" : "justify-start"}` }, /* @__PURE__ */ React.createElement("div", { className: `max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-snug ${m.role === "user" ? "text-white" : "bg-[var(--surface-sunk)] text-[var(--ink)]"}`, style: m.role === "user" ? { background: "var(--brand)" } : {} }, m.text, m.nav && /* @__PURE__ */ React.createElement("button", { onClick: () => onNavigate(m.nav, {}), className: "block mt-1.5 text-[12px] font-semibold underline", style: { color: "var(--brand-dark)" } }, "Open module →"))))), /* @__PURE__ */ React.createElement("div", { className: "px-3.5 pb-2 flex gap-1.5 flex-wrap" }, suggestions.slice(0, 3).map((s) => /* @__PURE__ */ React.createElement("button", { key: s, onClick: () => send(s), className: "text-[11px] px-2 py-1 rounded-full border border-[var(--border)] hover:bg-[var(--surface-sunk)]" }, s))), /* @__PURE__ */ React.createElement("div", { className: "p-3 border-t border-[var(--border-soft)] flex gap-2" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: input,
      onChange: (e) => setInput(e.target.value),
      onKeyDown: (e) => e.key === "Enter" && send(),
      placeholder: "Ask a question…",
      className: "flex-1 text-[13px] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus-ring"
    }
  ), /* @__PURE__ */ React.createElement(Button, { size: "sm", onClick: () => send() }, /* @__PURE__ */ React.createElement(Icon, { name: "send", size: 14 })))));
}
function App() {
  const [view, setViewRaw] = useState("dashboard");
  const [params, setParams] = useState({});
  const [role, setRole] = useState("vaidya");
  const kpis = D.kpis;
  function navigate(v, p = {}) {
    setViewRaw(v);
    setParams(p);
    window.scrollTo(0, 0);
  }
  const ctx = { view, params, role, navigate, hasPerm: (perm) => hasPerm(role, perm) };
  let ViewComp = Views[view] || Views.dashboard;
  return /* @__PURE__ */ React.createElement(AppCtx.Provider, { value: ctx }, /* @__PURE__ */ React.createElement("div", { className: "h-screen flex overflow-hidden" }, /* @__PURE__ */ React.createElement(Sidebar, { view, setView: (v) => navigate(v, {}), kpis, role }), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("header", { className: "h-[60px] shrink-0 border-b border-[var(--border-soft)] bg-white flex items-center gap-4 px-5" }, /* @__PURE__ */ React.createElement(GlobalSearch, { onNavigate: navigate }), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }), /* @__PURE__ */ React.createElement("div", { className: "hidden md:flex items-center gap-1.5 text-[12px] text-[var(--ink-muted)] mr-1" }, /* @__PURE__ */ React.createElement(Icon, { name: "calendar", size: 13 }), H.fmtDate(D.meta.generatedAt)), /* @__PURE__ */ React.createElement(NotificationPanel, { onNavigate: navigate }), /* @__PURE__ */ React.createElement(RoleSwitcher, { role, setRole }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 pl-2 border-l border-[var(--border-soft)]" }, /* @__PURE__ */ React.createElement(Avatar, { name: D.meta.vaidya, size: 32 }), /* @__PURE__ */ React.createElement("div", { className: "hidden lg:block leading-tight" }, /* @__PURE__ */ React.createElement("div", { className: "text-[12.5px] font-semibold" }, D.meta.vaidya), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-[var(--ink-muted)]" }, D.meta.clinicName)))), /* @__PURE__ */ React.createElement("main", { className: "flex-1 overflow-y-auto scrollbar-thin" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-[1400px] mx-auto p-6" }, /* @__PURE__ */ React.createElement(ViewComp, null))))), /* @__PURE__ */ React.createElement(AssistantWidget, { onNavigate: navigate }));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ React.createElement(App, null));
