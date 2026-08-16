/* =========================================================================
   Module 1 — Command Center Dashboard, Patient 360
   ========================================================================= */

// ---------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------
const BRIEF_META = {
  clinical: { label: "Clinical", icon: "heart", view: "whatsapp" },
  appointments: { label: "Appointments", icon: "calendar", view: "appointments" },
  followups: { label: "Patient Follow-ups", icon: "clock", view: "followups" },
  inventory: { label: "Medicine Inventory", icon: "box", view: "inventory" },
  shipments: { label: "Shipments", icon: "truck", view: "orders" },
  business: { label: "Business", icon: "trend", view: "business" },
};

function MorningBriefing() {
  const { navigate } = useApp();
  const b = D.briefing;
  return (
    <Card className="p-5 mb-6" style={{ background: "linear-gradient(120deg,#f3efe2,#f7f5ef)" }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[18px] font-semibold text-[var(--ink)]">Good morning, {D.meta.vaidya.replace("Vaidhya ", "")} 👋</div>
          <p className="text-[13.5px] text-[var(--ink-2)] mt-1">Your clinic has <strong>{b.total} items</strong> requiring attention today. Grouped below — click a number to jump straight into that workflow.</p>
        </div>
        <Badge tone="brand" icon="sparkle">AI Daily Action Plan ready</Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4">
        {Object.entries(BRIEF_META).map(([key, m]) => (
          <button key={key} onClick={() => navigate(m.view, {})} className="bg-white border border-[var(--border-soft)] rounded-xl p-3 text-left hover:shadow-sm hover:-translate-y-0.5 transition-all focus-ring">
            <div className="flex items-center justify-between">
              <Icon name={m.icon} size={15} className="text-[var(--brand-dark)]" />
              <span className="text-[20px] font-semibold tabular">{b[key]}</span>
            </div>
            <div className="text-[11.5px] text-[var(--ink-muted)] mt-1">{m.label}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function Dashboard() {
  const { navigate } = useApp();
  const k = D.kpis;
  const cards = [
    { label: "Today's appointments", value: k.todaysAppointments, icon: "calendar", tone: "brand", view: "appointments" },
    { label: "Patients waiting for response", value: k.waitingForResponse, icon: "whatsapp", tone: "serious", view: "whatsapp" },
    { label: "New patient queries", value: k.newQueries, icon: "users", tone: "warning", view: "whatsapp" },
    { label: "Follow-ups due today", value: k.followUpsDueToday, icon: "clock", tone: "warning", view: "followups" },
    { label: "Medicines to replenish", value: k.medsToReplenish, icon: "box", tone: "serious", view: "inventory" },
    { label: "Orders awaiting dispatch", value: k.ordersAwaitingDispatch, icon: "pill", tone: "brand", view: "orders", params: { tab: "orders" } },
    { label: "Shipments in transit", value: k.shipmentsInTransit, icon: "truck", tone: "brand", view: "orders", params: { tab: "shipments" } },
    { label: "Delivery exceptions", value: k.deliveryExceptionsCount, icon: "alert", tone: "critical", view: "orders", params: { tab: "exceptions" } },
    { label: "Unresolved complaints", value: k.unresolvedComplaints, icon: "feedback", tone: "critical", view: "business", params: { tab: "feedback" } },
    { label: "Today's revenue", value: H.fmtINR(k.todayRevenue), icon: "money", tone: "good", view: "business", params: { tab: "bi" } },
    { label: "Monthly revenue", value: H.fmtINR(k.monthRevenue), icon: "money", tone: "good", view: "business", params: { tab: "bi" }, delta: k.revenueGrowthPct },
    { label: "Consultation → treatment conversion", value: k.conversionRate + "%", icon: "target", tone: "accent", view: "business", params: { tab: "bi" } },
  ];
  return (
    <div>
      <MorningBriefing />
      <SectionHeader title="Key metrics" subtitle="Click any card to drill into the underlying records" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-7">
        {cards.map((c, i) => <StatCard key={i} {...c} onClick={() => navigate(c.view, c.params || {})} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <SectionHeader title="AI Priority Queue" subtitle="Ranked by clinical importance, patient impact and urgency" icon="sparkle" />
          <div className="space-y-2.5">
            {D.priorityQueue.slice(0, 9).map(item => <PriorityQueueRow key={item.id} item={item} />)}
          </div>
        </div>
        <div className="space-y-5">
          <Card className="p-4">
            <SectionHeader title="Needs My Attention" icon="target" />
            <div className="space-y-1">
              {[
                { label: "Critical clinical queries", n: D.messages.filter(m=>m.redFlag).length, view: "whatsapp", tone: "critical" },
                { label: "Pending approvals (WhatsApp)", n: k.waitingForResponse, view: "whatsapp", tone: "warning" },
                { label: "Overdue follow-ups", n: D.followUps.filter(f=>f.status==="Overdue").length, view: "followups", tone: "warning" },
                { label: "Purchase recommendations", n: D.replenishment.length, view: "inventory", tone: "brand" },
                { label: "Open delivery exceptions", n: D.deliveryExceptions.filter(d=>d.status!=="Resolved").length, view: "orders", tone: "serious" },
              ].map((r, i) => (
                <button key={i} onClick={() => navigate(r.view, {})} className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-[var(--surface-sunk)] text-left focus-ring">
                  <span className="text-[13px] text-[var(--ink-2)]">{r.label}</span>
                  <Badge tone={r.tone}>{r.n}</Badge>
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <SectionHeader title="Revenue — last 30 days" icon="trend" />
            <LineChart height={160} currency
              labels={D.revenueDaily.slice(-30).map(r => r.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }))}
              series={[{ name: "Revenue", data: D.revenueDaily.slice(-30).map(r => r.total) }]} />
          </Card>
        </div>
      </div>

      <div className="mt-7">
        <SectionHeader title="Recent alerts" icon="bell" action={<Button variant="secondary" size="sm" onClick={() => navigate("alerts", {})}>View alert center</Button>} />
        <Card>
          {D.alerts.slice(0, 6).map(a => <AlertRow key={a.id} a={a} />)}
        </Card>
      </div>
    </div>
  );
}

function PriorityQueueRow({ item }) {
  const { navigate } = useApp();
  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <PriorityBadge priority={item.priority} />
          <div className="min-w-0">
            <div className="text-[13.5px] font-medium text-[var(--ink)]">{item.title}</div>
            <div className="text-[12.5px] text-[var(--ink-muted)] mt-1 leading-snug">{item.reason}</div>
            <div className="mt-1.5"><Badge tone="neutral">{item.category}</Badge></div>
          </div>
        </div>
        <Button variant="secondary" size="sm" className="shrink-0" onClick={() => navigate(item.link.module, item.link.id ? { convId: item.link.id, patientId: item.patientId, id: item.link.id, medId: item.link.id, shipmentId: item.link.id } : {})}>
          Review <Icon name="chev" size={13} />
        </Button>
      </div>
    </Card>
  );
}

Views.dashboard = Dashboard;

// ---------------------------------------------------------------------
// Patients — list + Patient 360
// ---------------------------------------------------------------------
function PatientsView() {
  const { params, navigate } = useApp();
  const [selected, setSelected] = useState(params.patientId || null);
  const [tab, setTab] = useState("directory");
  useEffect(() => { if (params.patientId) setSelected(params.patientId); }, [params.patientId]);
  if (selected) {
    const p = D.patientById[selected];
    if (p) return <Patient360 patient={p} onBack={() => setSelected(null)} />;
  }
  return (
    <div>
      <Tabs active={tab} onChange={setTab} tabs={[{ id: "directory", label: "Patient directory", count: D.patients.length }, { id: "retention", label: "Patient Retention AI", count: D.retention.length }]} />
      {tab === "directory" ? <PatientList onOpen={(id) => setSelected(id)} /> : <RetentionList onOpen={(id) => setSelected(id)} />}
    </div>
  );
}

function RetentionList({ onOpen }) {
  const sent = useRef(new Set());
  const [, force] = useState(0);
  return (
    <div>
      <SectionHeader title="Patient Retention AI" icon="heart" subtitle="High-value, churn-risk and unresponsive patients — each with a reason, recommended action and a draft message for your approval" />
      <div className="space-y-2.5">
        {D.retention.map(r => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-3">
                <Avatar name={r.patientName} size={36} />
                <div>
                  <button onClick={() => onOpen(r.patientId)} className="text-[13.5px] font-medium hover:underline focus-ring">{r.patientName}</button>
                  <div className="mt-1"><Badge tone={r.flag === "At risk of churn" ? "critical" : r.flag === "High-value patient" ? "accent" : "warning"}>{r.flag}</Badge></div>
                  <div className="text-[12.5px] text-[var(--ink-muted)] mt-1.5">{r.why}</div>
                  <div className="text-[12px] text-[var(--ink-2)] mt-1"><strong>Recommended:</strong> {r.action}</div>
                </div>
              </div>
              {sent.current.has(r.id) ? <Badge tone="good" icon="check">Sent</Badge> : <Button size="sm" onClick={() => { sent.current.add(r.id); force(x=>x+1); }}>Approve & Send</Button>}
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--border-soft)] text-[12.5px] text-[var(--ink-2)] bg-[var(--surface-sunk)] rounded-lg p-2.5">"{r.message}"</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PatientList({ onOpen }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => {
    let list = D.patients;
    if (filter === "followup") list = list.filter(p => p.tags.includes("follow-up-overdue"));
    if (filter === "vip") list = list.filter(p => p.tags.includes("vip"));
    if (filter === "churn") list = list.filter(p => p.tags.includes("churn-risk"));
    if (q.trim()) { const s = q.toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(s) || p.id.toLowerCase().includes(s) || p.city.toLowerCase().includes(s)); }
    return list;
  }, [q, filter]);
  return (
    <div>
      <SectionHeader title="Patients" subtitle={`${D.patients.length} patients on record (synthetic demo data)`} icon="users"
        action={
          <div className="flex items-center gap-2">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, ID, city…" className="text-[13px] border border-[var(--border)] rounded-lg px-3 py-1.5 outline-none focus-ring w-56" />
          </div>
        } />
      <div className="flex items-center gap-2 mb-4">
        {[["all","All patients"],["followup","Follow-up overdue"],["vip","High-value"],["churn","Churn risk"]].map(([id,label]) => (
          <button key={id} onClick={()=>setFilter(id)} className={`text-[12.5px] px-3 py-1.5 rounded-full border focus-ring ${filter===id ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-dark)] font-medium" : "border-[var(--border)] text-[var(--ink-2)] hover:bg-[var(--surface-sunk)]"}`}>{label}</button>
        ))}
      </div>
      <Card>
        <Table
          columns={[
            { key: "name", label: "Patient", render: r => <div className="flex items-center gap-2.5"><Avatar name={r.name} size={30} /><div><div className="font-medium text-[var(--ink)]">{r.name}</div><div className="text-[11.5px] text-[var(--ink-muted)]">{r.id} · {r.age}{r.gender[0]}</div></div></div> },
            { key: "city", label: "Location", render: r => <span>{r.city}, {r.state} <span className="text-[var(--ink-muted)]">— {r.pincode}</span></span> },
            { key: "complaint", label: "Chief complaint", render: r => r.chiefComplaints[0] },
            { key: "prakriti", label: "Prakriti", render: r => <Badge tone="brand">{r.prakriti}</Badge> },
            { key: "last", label: "Last consult", render: r => H.fmtDate(r.lastConsultDate) },
            { key: "next", label: "Next consult", render: r => r.nextConsultDate ? H.fmtDate(r.nextConsultDate) : <span className="text-[var(--ink-muted)]">Not booked</span> },
            { key: "tags", label: "Flags", render: r => <div className="flex gap-1 flex-wrap">{r.tags.includes("follow-up-overdue") && <Badge tone="warning">Follow-up</Badge>}{r.tags.includes("vip") && <Badge tone="accent">High-value</Badge>}{r.tags.includes("churn-risk") && <Badge tone="critical">Churn risk</Badge>}</div> },
          ]}
          rows={filtered.slice(0, 60)}
          onRowClick={(r) => onOpen(r.id)}
        />
        {filtered.length > 60 && <div className="text-center text-[12px] text-[var(--ink-muted)] py-3 border-t border-[var(--border-soft)]">Showing 60 of {filtered.length} matching patients</div>}
      </Card>
    </div>
  );
}

function buildTimeline(p) {
  const events = [];
  p.consultations.forEach(c => events.push({ date: c.date, type: "Consultation", icon: "heart", tone: "brand", text: `${c.type} (${c.mode}) — ${c.chiefComplaint}`, detail: c.assessment }));
  D.prescriptions.filter(r => r.patientId === p.id).forEach(r => events.push({ date: r.date, type: "Prescription", icon: "pill", tone: "accent", text: `${r.items.length} medicines prescribed`, detail: r.items.map(i => i.name).join(", ") }));
  D.orders.filter(o => o.patientId === p.id).forEach(o => events.push({ date: o.date, type: "Order", icon: "box", tone: "good", text: `Order ${o.id} placed — ${H.fmtINR(o.value)}`, detail: `Status: ${o.stage}` }));
  D.shipments.filter(s => s.patientId === p.id).forEach(s => events.push({ date: s.dispatchDate, type: "Shipment", icon: "truck", tone: "brand", text: `Shipment dispatched via ${s.courier}`, detail: `Tracking ${s.trackingNo} — ${s.status}` }));
  D.feedback.filter(f => f.patientId === p.id).forEach(f => events.push({ date: f.date, type: "Feedback", icon: "feedback", tone: f.sentiment === "Negative" ? "critical" : "good", text: `Feedback submitted — ${f.overall}/5`, detail: f.comment }));
  D.appointments.filter(a => a.patientId === p.id).forEach(a => events.push({ date: a.date, type: "Appointment", icon: "calendar", tone: "neutral", text: `${a.type} — ${a.status}`, detail: `${H.fmtDate(a.date)} at ${a.time} (${a.mode})` }));
  D.messages.filter(m => m.patientId === p.id).forEach(m => events.push({ date: m.timestamp, type: "WhatsApp", icon: "whatsapp", tone: m.redFlag ? "critical" : "neutral", text: `Message — ${m.classification}`, detail: m.text }));
  events.sort((a, b) => b.date - a.date);
  return events;
}

function Patient360({ patient: p, onBack }) {
  const { navigate, hasPerm } = useApp();
  const [tab, setTab] = useState("overview");
  const timeline = useMemo(() => buildTimeline(p), [p.id]);
  const orders = D.orders.filter(o => o.patientId === p.id);
  const shipmentsForPatient = D.shipments.filter(s => s.patientId === p.id);
  const feedbackForPatient = D.feedback.filter(f => f.patientId === p.id);
  const convo = D.conversations.find(c => c.patientId === p.id);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-[var(--ink-2)] mb-4 hover:text-[var(--ink)] focus-ring"><Icon name="chev" size={14} className="rotate-180" />Back to patients</button>

      <Card className="p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={p.name} size={56} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[19px] font-semibold">{p.name}</h1>
                {p.tags.includes("vip") && <Badge tone="accent">High-value</Badge>}
                {p.tags.includes("churn-risk") && <Badge tone="critical">Churn risk</Badge>}
              </div>
              <div className="text-[13px] text-[var(--ink-muted)] mt-0.5">{p.id} · {p.age} yrs, {p.gender} · {p.city}, {p.state} – {p.pincode}</div>
              <div className="text-[13px] text-[var(--ink-2)] mt-0.5">{p.phone} · WhatsApp: <Badge tone={p.whatsappStatus === "Active" ? "good" : "neutral"}>{p.whatsappStatus}</Badge></div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => convo && navigate("whatsapp", { convId: convo.id })} disabled={!convo}><Icon name="whatsapp" size={14} />WhatsApp thread</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("appointments", { patientId: p.id })}><Icon name="calendar" size={14} />Book appointment</Button>
            <Button size="sm" disabled={!hasPerm("clinical")} title={!hasPerm("clinical") ? "Requires Vaidya role" : ""}><Icon name="edit" size={14} />New consultation note</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[var(--border-soft)]">
          <MiniStat label="First consultation" value={H.fmtDate(p.firstConsultDate)} />
          <MiniStat label="Last consultation" value={H.fmtDate(p.lastConsultDate)} />
          <MiniStat label="Next consultation" value={p.nextConsultDate ? H.fmtDate(p.nextConsultDate) : "Not booked"} />
          <MiniStat label="Medicine adherence" value={p.adherence + "%"} />
        </div>
      </Card>

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: "overview", label: "Clinical overview" },
        { id: "timeline", label: "Timeline", count: timeline.length },
        { id: "orders", label: "Orders & shipments", count: orders.length },
        { id: "feedback", label: "Feedback & payments", count: feedbackForPatient.length },
        { id: "documents", label: "Documents" },
      ]} />

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="p-5 lg:col-span-2">
            <SectionHeader title="Ayurvedic assessment" icon="heart" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <MiniStat label="Prakriti (constitution)" value={p.prakriti} />
              <MiniStat label="Vikriti (current imbalance)" value={p.vikriti} />
            </div>
            <div className="mb-4">
              <div className="text-[12px] uppercase tracking-wide text-[var(--ink-muted)] mb-1.5">Chief complaints</div>
              <div className="flex flex-wrap gap-1.5">{p.chiefComplaints.map((c, i) => <Badge key={i} tone="warning">{c}</Badge>)}</div>
            </div>
            <div className="mb-4">
              <div className="text-[12px] uppercase tracking-wide text-[var(--ink-muted)] mb-1.5">Latest assessment note</div>
              <p className="text-[13.5px] text-[var(--ink-2)] leading-relaxed">{p.consultations[p.consultations.length-1].assessment}</p>
            </div>
            {p.currentPrescription && (
              <div>
                <div className="text-[12px] uppercase tracking-wide text-[var(--ink-muted)] mb-1.5">Current prescription</div>
                <div className="space-y-1.5">
                  {p.currentPrescription.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-[13px] border-b border-[var(--border-soft)] last:border-0 py-1.5">
                      <span className="font-medium">{it.name}</span>
                      <span className="text-[var(--ink-muted)]">{it.dosage} · {it.durationDays}d</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
          <div className="space-y-5">
            <Card className="p-4">
              <SectionHeader title="Adherence" icon="target" />
              <div className="flex items-center gap-3">
                <div className="text-[28px] font-semibold tabular">{p.adherence}%</div>
                <div className="flex-1 h-2 rounded-full bg-[var(--surface-sunk)] overflow-hidden"><div className="h-full rounded-full" style={{ width: p.adherence + "%", background: p.adherence > 75 ? "var(--good)" : p.adherence > 55 ? "var(--warning)" : "var(--critical)" }} /></div>
              </div>
              <p className="text-[12px] text-[var(--ink-muted)] mt-2">Estimated from reorder timing vs. prescribed course length.</p>
            </Card>
            <Card className="p-4">
              <SectionHeader title="Consultation history" icon="book" />
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {p.consultations.slice().reverse().map(c => (
                  <div key={c.id} className="text-[12.5px] border-b border-[var(--border-soft)] last:border-0 pb-2">
                    <div className="flex justify-between"><span className="font-medium">{c.type}</span><span className="text-[var(--ink-muted)]">{H.fmtDate(c.date)}</span></div>
                    <div className="text-[var(--ink-muted)]">{c.mode} · {c.chiefComplaint}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "timeline" && (
        <Card className="p-5">
          <SectionHeader title="Patient journey" subtitle="Chronological view across consultations, prescriptions, orders, shipments, appointments and messages" icon="layers" />
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-[var(--border)]" />
            {timeline.map((e, i) => (
              <div key={i} className="relative mb-4 last:mb-0">
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white" style={{ background: STATUS_STYLES[e.tone] ? STATUS_STYLES[e.tone].fg : "#8a877d" }} />
                <div className="text-[11.5px] text-[var(--ink-muted)]">{H.fmtDateTime(e.date)}</div>
                <div className="text-[13.5px] font-medium mt-0.5">{e.text}</div>
                {e.detail && <div className="text-[12.5px] text-[var(--ink-muted)] mt-0.5">{e.detail}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "orders" && (
        <div className="space-y-5">
          <Card className="p-4">
            <SectionHeader title="Order history" icon="box" />
            <Table columns={[
              { key: "id", label: "Order" }, { key: "date", label: "Date", render: r => H.fmtDate(r.date) },
              { key: "items", label: "Medicines", render: r => r.items.map(i=>i.name).join(", ") },
              { key: "value", label: "Value", render: r => H.fmtINR(r.value) },
              { key: "payment", label: "Payment", render: r => <Badge tone={r.paymentStatus === "Paid" ? "good" : "warning"}>{r.paymentStatus}</Badge> },
              { key: "stage", label: "Status", render: r => <Badge tone={r.stage === "Delivered" ? "good" : "brand"}>{r.stage}</Badge> },
            ]} rows={orders} empty="No orders yet" />
          </Card>
          <Card className="p-4">
            <SectionHeader title="Shipment history" icon="truck" subtitle="Demo / simulated tracking data" />
            <Table columns={[
              { key: "trackingNo", label: "Tracking No." }, { key: "courier", label: "Courier" },
              { key: "destination", label: "Destination" },
              { key: "status", label: "Status", render: r => <Badge tone={r.status.includes("issue")||r.status==="Returned" ? "critical" : r.status==="Delivered" ? "good" : "brand"}>{r.status}</Badge> },
              { key: "eta", label: "Expected", render: r => H.fmtDate(r.expectedDelivery) },
            ]} rows={shipmentsForPatient} empty="No shipments yet" />
          </Card>
        </div>
      )}

      {tab === "feedback" && (
        <div className="space-y-5">
          <Card className="p-4">
            <SectionHeader title="Feedback" icon="feedback" />
            {feedbackForPatient.length === 0 && <EmptyState title="No feedback submitted yet" />}
            {feedbackForPatient.map(f => (
              <div key={f.id} className="border-b border-[var(--border-soft)] last:border-0 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Badge tone={f.sentiment === "Negative" ? "critical" : f.sentiment === "Neutral" ? "warning" : "good"}>{f.overall}/5 · {f.sentiment}</Badge><span className="text-[11.5px] text-[var(--ink-muted)]">{H.fmtDate(f.date)}</span></div>
                  <span className="text-[11.5px] text-[var(--ink-muted)]">NPS {f.nps}</span>
                </div>
                <p className="text-[13px] text-[var(--ink-2)] mt-1.5">"{f.comment}"</p>
              </div>
            ))}
          </Card>
          <Card className="p-4">
            <SectionHeader title="Payment history" icon="money" />
            <Table columns={[
              { key: "id", label: "Order" }, { key: "date", label: "Date", render: r => H.fmtDate(r.date) },
              { key: "value", label: "Amount", render: r => H.fmtINR(r.value) },
              { key: "payment", label: "Status", render: r => <Badge tone={r.paymentStatus === "Paid" ? "good" : "warning"}>{r.paymentStatus}</Badge> },
            ]} rows={orders} empty="No payment records" />
          </Card>
        </div>
      )}

      {tab === "documents" && (
        <Card className="p-4">
          <SectionHeader title="Uploaded documents" icon="doc" subtitle="Prescriptions, lab reports & consent forms (demo placeholders)" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {["Initial consultation prescription.pdf","Lab report — Thyroid panel.pdf","Consent & telehealth form.pdf"].map((d,i) => (
              <div key={i} className="border border-[var(--border-soft)] rounded-xl p-3 flex items-start gap-2.5">
                <Icon name="doc" size={18} className="text-[var(--brand-dark)] mt-0.5" />
                <div>
                  <div className="text-[12.5px] font-medium leading-snug">{d}</div>
                  <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">Uploaded {H.fmtDate(H.daysAgo(20+i*40))} · OCR-indexed</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <div className="text-[15px] font-semibold text-[var(--ink)]">{value}</div>
      <div className="text-[11.5px] text-[var(--ink-muted)] mt-0.5">{label}</div>
    </div>
  );
}

Views.patients = PatientsView;
