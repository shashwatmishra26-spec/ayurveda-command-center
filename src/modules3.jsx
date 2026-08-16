/* =========================================================================
   Module 3 — Inventory, Orders & Shipments, Feedback & Business,
              AI Agents & Audit Trail, Alert Center
   ========================================================================= */

// ---------------------------------------------------------------------
// Inventory Command Center
// ---------------------------------------------------------------------
const ALERT_TYPE_TONE = { "Stockout risk": "critical", "Expired stock": "critical", "Low stock": "serious", "Expiry approaching": "warning", "Unusual consumption": "warning", "Overstock": "neutral", "Slow-moving inventory": "neutral", "Supplier delay": "warning" };
function InventoryView() {
  const { params } = useApp();
  const [tab, setTab] = useState("medicines");
  const [openMed, setOpenMed] = useState(null);
  const [created, setCreated] = useState(() => new Set());
  useEffect(() => { if (params.medId) { setOpenMed(D.medicines.find(m=>m.id===params.medId)); setTab("medicines"); } }, [params.medId]);

  return (
    <div>
      <SectionHeader title="Medicine Inventory Command Center" icon="box" subtitle="Batches, expiry, consumption forecasting and AI-driven replenishment" />
      <Tabs active={tab} onChange={setTab} tabs={[
        { id: "medicines", label: "Medicines & batches", count: D.medicines.length },
        { id: "alerts", label: "AI Inventory Alerts", count: D.inventoryAlerts.length },
        { id: "replenishment", label: "Replenishment Agent", count: D.replenishment.length },
      ]} />

      {tab === "medicines" && (
        <Card>
          <Table columns={[
            { key: "name", label: "Medicine", render: r => <div><div className="font-medium">{r.name}</div><div className="text-[11px] text-[var(--ink-muted)]">{r.sku} · {r.category}</div></div> },
            { key: "stock", label: "In stock", render: r => D.stockFor(r.id) },
            { key: "available", label: "Available-to-sell", render: r => D.availableFor(r.id) },
            { key: "reorder", label: "Reorder level", render: r => r.reorderLevel },
            { key: "consumption", label: "Avg weekly use", render: r => r.avgWeeklyConsumption },
            { key: "trend", label: "Trend", render: r => <Badge tone={r.trend==="rising"?"warning":r.trend==="falling"?"neutral":"good"} icon="trend">{r.trend}</Badge> },
            { key: "margin", label: "Margin", render: r => r.margin + "%" },
          ]} rows={D.medicines} onRowClick={setOpenMed} />
        </Card>
      )}

      {tab === "alerts" && (
        <div className="space-y-2.5">
          {D.inventoryAlerts.slice().sort((a,b)=>({Critical:0,High:1,Medium:2,Low:3}[a.severity]-{Critical:0,High:1,Medium:2,Low:3}[b.severity])).map(a => (
            <Card key={a.id} className="p-3.5 flex items-start gap-3">
              <PriorityBadge priority={a.severity} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><span className="text-[13.5px] font-medium">{a.name}</span><Badge tone={ALERT_TYPE_TONE[a.type]||"neutral"}>{a.type}</Badge></div>
                <div className="text-[12.5px] text-[var(--ink-muted)] mt-1">{a.detail}</div>
              </div>
              {a.medicineId && <Button variant="secondary" size="sm" onClick={()=>setOpenMed(D.medicines.find(m=>m.id===a.medicineId))}>View medicine</Button>}
            </Card>
          ))}
        </div>
      )}

      {tab === "replenishment" && (
        <div>
          <Card className="p-4 mb-4" style={{ background: "var(--brand-tint)" }}>
            <div className="flex items-start gap-2.5">
              <Icon name="sparkle" size={18} className="text-[var(--brand-dark)] mt-0.5" />
              <p className="text-[13px] text-[var(--ink)]">The Replenishment Agent forecasts demand from historical consumption, active prescriptions, seasonality and supplier lead time. It only <strong>drafts</strong> a purchase recommendation — nothing is ordered automatically unless the clinic explicitly configures auto-ordering.</p>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {D.replenishment.map(r => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13.5px] font-semibold">{r.name}</span>
                  <Badge tone={r.projectedStockoutDays <= 7 ? "critical" : r.projectedStockoutDays <= 14 ? "warning" : "neutral"}>{r.projectedStockoutDays}d to stockout</Badge>
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 text-[12.5px] text-[var(--ink-2)]">
                  <div>Current stock: <strong className="tabular">{r.currentStock}</strong></div>
                  <div>Avg weekly use: <strong className="tabular">{r.avgWeeklyConsumption}</strong></div>
                  <div>Supplier: <strong>{r.supplier.split(" ")[0]}</strong></div>
                  <div>Lead time: <strong className="tabular">{r.leadTimeDays}d</strong></div>
                </div>
                <div className="text-[12.5px] mt-2 pt-2 border-t border-[var(--border-soft)]">Recommended reorder: <strong className="tabular">{r.recommendedQty} units</strong></div>
                {created.has(r.id)
                  ? <Badge tone="good" icon="check" className="mt-2">Purchase recommendation created — awaiting Manager/Vaidya sign-off</Badge>
                  : <Button size="sm" className="mt-2.5" onClick={()=>setCreated(s=>new Set([...s,r.id]))}>Create Purchase Recommendation</Button>}
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal open={!!openMed} onClose={()=>setOpenMed(null)} title={openMed ? openMed.name : ""}>
        {openMed && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <MiniStat label="SKU" value={openMed.sku} /><MiniStat label="Category" value={openMed.category} />
              <MiniStat label="Supplier" value={D.SUPPLIERS.find(s=>s.id===openMed.supplierId)?.name.split(" ")[0]} />
              <MiniStat label="Margin" value={openMed.margin+"%"} />
            </div>
            <div className="text-[12px] uppercase tracking-wide text-[var(--ink-muted)] mb-1.5">Batches</div>
            <Table columns={[
              { key: "batchNo", label: "Batch" }, { key: "mfgDate", label: "Mfg date", render: r=>H.fmtDate(r.mfgDate) },
              { key: "expDate", label: "Expiry", render: r=>H.fmtDate(r.expDate) },
              { key: "qty", label: "Qty" }, { key: "reserved", label: "Reserved" }, { key: "available", label: "Available" },
              { key: "status", label: "Status", render: r => <Badge tone={r.daysToExpiry<0?"critical":r.daysToExpiry<60?"warning":"good"}>{r.daysToExpiry<0?"Expired":r.daysToExpiry<60?`${r.daysToExpiry}d to expiry`:"Healthy"}</Badge> },
            ]} rows={D.batchesFor(openMed.id)} />
          </div>
        )}
      </Modal>
    </div>
  );
}
Views.inventory = InventoryView;

// ---------------------------------------------------------------------
// Orders & Shipments (+ discrepancy engine)
// ---------------------------------------------------------------------
const PIPELINE = ["Prescription received","Order created","Payment confirmed","Picking","Packing","Dispatched","In transit","Delivered"];
function OrdersView() {
  const { params } = useApp();
  const [tab, setTab] = useState(params.tab || "orders");
  const [openOrder, setOpenOrder] = useState(null);
  const [openShipment, setOpenShipment] = useState(null);
  const [trackQ, setTrackQ] = useState("");
  useEffect(() => { if (params.tab) setTab(params.tab); if (params.orderId) setOpenOrder(D.orders.find(o=>o.id===params.orderId)); if (params.shipmentId) { setTab("shipments"); setOpenShipment(D.shipments.find(s=>s.id===params.shipmentId)); } }, [params]);

  const shipmentsFiltered = trackQ.trim() ? D.shipments.filter(s => s.trackingNo.toLowerCase().includes(trackQ.toLowerCase()) || String(s.pincode).includes(trackQ) || s.patientName.toLowerCase().includes(trackQ.toLowerCase())) : D.shipments;

  return (
    <div>
      <SectionHeader title="Orders & Shipment Control Tower" icon="truck" subtitle="Prescription → Order → Payment → Picking → Packing → Dispatch → Shipment → Delivered → Patient confirmation" />
      <Tabs active={tab} onChange={setTab} tabs={[
        { id: "orders", label: "Orders", count: D.orders.length },
        { id: "shipments", label: "Shipments (India Post / courier)", count: D.shipments.length },
        { id: "exceptions", label: "Delivery exceptions", count: D.deliveryExceptions.length },
      ]} />

      {tab === "orders" && (
        <Card>
          <Table columns={[
            { key: "id", label: "Order" }, { key: "patientName", label: "Patient" },
            { key: "date", label: "Date", render: r => H.fmtDate(r.date) },
            { key: "value", label: "Value", render: r => H.fmtINR(r.value) },
            { key: "payment", label: "Payment", render: r => <Badge tone={r.paymentStatus==="Paid"?"good":"warning"}>{r.paymentStatus}</Badge> },
            { key: "stage", label: "Pipeline stage", render: r => <Badge tone={r.stage==="Delivered"?"good":"brand"}>{r.stage}</Badge> },
          ]} rows={D.orders.slice(0,80)} onRowClick={setOpenOrder} />
        </Card>
      )}

      {tab === "shipments" && (
        <div>
          <Badge tone="warning" icon="alert" className="mb-3">Demo / simulated tracking data — architecture supports connecting a live India Post / courier tracking API</Badge>
          <input value={trackQ} onChange={e=>setTrackQ(e.target.value)} placeholder="Track by tracking number, PIN code, or patient…" className="w-full max-w-md block text-[13px] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus-ring mb-3" />
          <Card>
            <Table columns={[
              { key: "trackingNo", label: "Tracking No." }, { key: "patientName", label: "Patient" },
              { key: "courier", label: "Courier" }, { key: "destination", label: "Destination (PIN)" },
              { key: "status", label: "Status", render: r => <Badge tone={r.status.includes("issue")||r.status==="Returned"||r.status==="Delivery attempted"?"critical":r.status==="Delivered"?"good":"brand"}>{r.status}</Badge> },
              { key: "eta", label: "Expected delivery", render: r => H.fmtDate(r.expectedDelivery) },
            ]} rows={shipmentsFiltered.slice(0,80)} onRowClick={setOpenShipment} empty="No shipments match" />
          </Card>
        </div>
      )}

      {tab === "exceptions" && <DeliveryExceptionsPanel />}

      <Modal open={!!openOrder} onClose={()=>setOpenOrder(null)} title={openOrder ? `Order ${openOrder.id}` : ""}>
        {openOrder && (
          <div>
            <div className="text-[13px] text-[var(--ink-2)] mb-4">{openOrder.patientName} · {H.fmtDate(openOrder.date)} · {H.fmtINR(openOrder.value)}</div>
            <PipelineStepper stage={openOrder.stage} />
            <div className="mt-4">
              <div className="text-[12px] uppercase tracking-wide text-[var(--ink-muted)] mb-1.5">Items</div>
              {openOrder.items.map((it,i) => <div key={i} className="flex justify-between text-[13px] border-b border-[var(--border-soft)] last:border-0 py-1.5"><span>{it.name} × {it.qty}</span><span className="tabular">{H.fmtINR(it.qty*it.price)}</span></div>)}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!openShipment} onClose={()=>setOpenShipment(null)} title={openShipment ? `Tracking ${openShipment.trackingNo}` : ""}>
        {openShipment && <ShipmentTimeline s={openShipment} />}
      </Modal>
    </div>
  );
}
function PipelineStepper({ stage }) {
  const idx = PIPELINE.indexOf(stage);
  return (
    <div className="flex items-center flex-wrap gap-y-2">
      {PIPELINE.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${i<=idx ? "text-white" : "text-[var(--ink-muted)] bg-[var(--surface-sunk)]"}`} style={i<=idx?{background:"var(--brand)"}:{}}>{i<idx ? "✓" : i+1}</div>
            <span className={`text-[11.5px] ${i<=idx?"text-[var(--ink)] font-medium":"text-[var(--ink-muted)]"}`}>{s}</span>
          </div>
          {i < PIPELINE.length-1 && <div className="w-4 h-px bg-[var(--border)] mx-1" />}
        </React.Fragment>
      ))}
    </div>
  );
}
function ShipmentTimeline({ s }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1"><Badge tone="warning" icon="alert">Demo / simulated tracking data</Badge></div>
      <div className="text-[13px] text-[var(--ink-2)] mb-4">{s.patientName} · {s.destination} · via {s.courier}</div>
      <div className="relative pl-6">
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-[var(--border)]" />
        {s.events.map((e,i) => (
          <div key={i} className="relative mb-4 last:mb-0">
            <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white" style={{ background: i===s.events.length-1 ? "var(--brand)" : "#c3c2b7" }} />
            <div className="text-[11.5px] text-[var(--ink-muted)]">{H.fmtDateTime(e.date)} · {e.location}</div>
            <div className="text-[13.5px] font-medium mt-0.5">{e.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DISCREPANCY_OPTIONS = ["Everything received","Missing medicine","Wrong medicine","Damaged package","Damaged medicine","Quantity mismatch","Delivery issue","Other"];
function DeliveryExceptionsPanel() {
  const [openEx, setOpenEx] = useState(null);
  return (
    <div>
      <Card className="p-4 mb-4">
        <SectionHeader title="Post-delivery discrepancy check (automated WhatsApp prompt)" icon="whatsapp" />
        <div className="bg-[var(--surface-sunk)] rounded-xl p-3.5 max-w-md">
          <p className="text-[13px] text-[var(--ink)]">"Your medicine order was delivered. Did you receive everything correctly?"</p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {DISCREPANCY_OPTIONS.map(o => <span key={o} className="text-[11.5px] border border-[var(--border)] rounded-full px-2.5 py-1 bg-white">{o}</span>)}
          </div>
        </div>
        <p className="text-[12px] text-[var(--ink-muted)] mt-2.5">A non-"Everything received" reply automatically opens a discrepancy case below, routed to the responsible team member.</p>
      </Card>
      <Card>
        <Table columns={[
          { key: "orderId", label: "Order" }, { key: "patientName", label: "Patient" },
          { key: "issueType", label: "Issue", render: r => <Badge tone="serious">{r.issueType}</Badge> },
          { key: "courier", label: "Courier" }, { key: "owner", label: "Owner" },
          { key: "tatHours", label: "TAT", render: r => r.tatHours + "h" },
          { key: "status", label: "Status", render: r => <Badge tone={r.status==="Resolved"?"good":r.status==="In progress"?"warning":"critical"}>{r.status}</Badge> },
        ]} rows={D.deliveryExceptions} onRowClick={setOpenEx} />
      </Card>
      <Modal open={!!openEx} onClose={()=>setOpenEx(null)} title={openEx ? `Discrepancy — ${openEx.orderId}` : ""}>
        {openEx && (
          <div className="space-y-2 text-[13px]">
            <Row k="Patient" v={openEx.patientName} /><Row k="Issue type" v={openEx.issueType} />
            <Row k="SKU" v={openEx.sku} /><Row k="Batch" v={openEx.batch} /><Row k="Courier" v={openEx.courier} />
            <Row k="Root cause" v={openEx.rootCause} /><Row k="Resolution" v={openEx.resolution} />
            <Row k="TAT" v={openEx.tatHours + " hours"} /><Row k="Responsible team member" v={openEx.owner} />
            <Row k="Status" v={<Badge tone={openEx.status==="Resolved"?"good":"warning"}>{openEx.status}</Badge>} />
          </div>
        )}
      </Modal>
    </div>
  );
}
function Row({ k, v }) { return <div className="flex justify-between border-b border-[var(--border-soft)] py-1.5 last:border-0"><span className="text-[var(--ink-muted)]">{k}</span><span className="font-medium">{v}</span></div>; }
Views.orders = OrdersView;

// ---------------------------------------------------------------------
// Feedback & Business Command Center
// ---------------------------------------------------------------------
function BusinessView() {
  const { params, hasPerm } = useApp();
  const [tab, setTab] = useState(params.tab === "feedback" ? "feedback" : "bi");
  useEffect(()=>{ if (params.tab==="feedback") setTab("feedback"); }, [params.tab]);
  return (
    <div>
      <SectionHeader title="Feedback & Business Command Center" icon="chart" />
      <Tabs active={tab} onChange={setTab} tabs={[{ id: "bi", label: "Business Intelligence" }, { id: "feedback", label: "Feedback & sentiment", count: D.feedback.length }, { id: "copilot", label: "Business Copilot" }]} />
      {tab === "bi" && (hasPerm("business") ? <BusinessIntelligence /> : <RestrictedPanel what="Business Command Center" />)}
      {tab === "feedback" && <FeedbackPanel />}
      {tab === "copilot" && (hasPerm("business") ? <BusinessCopilot /> : <RestrictedPanel what="Business Copilot" />)}
    </div>
  );
}
function RestrictedPanel({ what }) {
  return (
    <Card className="p-8 text-center">
      <Icon name="lock" size={26} className="mx-auto text-[var(--ink-muted)] mb-2" />
      <div className="text-[14px] font-semibold">{what} — restricted</div>
      <p className="text-[13px] text-[var(--ink-muted)] mt-1 max-w-sm mx-auto">Your current role doesn't include business analytics access. Switch to Vaidya, Clinic Manager, or Founder/Owner in the role switcher (top right) to view this.</p>
    </Card>
  );
}
function BusinessIntelligence() {
  const [range, setRange] = useState("month");
  const days = { today: 1, week: 7, month: 30, quarter: 90 }[range];
  const slice = D.revenueDaily.slice(-days);
  const totalRev = slice.reduce((s,r)=>s+r.total,0);
  const consultRev = slice.reduce((s,r)=>s+r.consultRevenue,0);
  const medRev = slice.reduce((s,r)=>s+r.medicineRevenue,0);
  const repeatPatients = D.patients.filter(p => D.orders.filter(o=>o.patientId===p.id).length > 1).length;
  const acquiredThisRange = D.patients.filter(p => p._firstConsultDaysAgo <= days).length;
  const noShowRate = Math.round(100 * D.appointments.filter(a=>a.status==="No-show").length / D.appointments.length);
  const cancelRate = Math.round(100 * D.appointments.filter(a=>a.status==="Cancelled").length / D.appointments.length);
  const refundRate = Math.round(100 * D.deliveryExceptions.filter(d=>d.resolution==="Refund issued").length / Math.max(1,D.orders.length));
  const reorderRate = Math.round(100 * repeatPatients / D.patients.length);
  const avgOrderValue = Math.round(D.orders.reduce((s,o)=>s+o.value,0)/D.orders.length);

  return (
    <div>
      <div className="flex gap-1.5 mb-4">
        {[["today","Today"],["week","Week"],["month","Month"],["quarter","Quarter"]].map(([id,l]) => (
          <button key={id} onClick={()=>setRange(id)} className={`text-[12.5px] px-3 py-1.5 rounded-full border focus-ring ${range===id?"border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-dark)] font-medium":"border-[var(--border)] text-[var(--ink-2)]"}`}>{l}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Revenue" value={H.fmtINR(totalRev)} icon="money" tone="good" />
        <StatCard label="Consultation revenue" value={H.fmtINR(consultRev)} icon="heart" tone="brand" />
        <StatCard label="Medicine revenue" value={H.fmtINR(medRev)} icon="pill" tone="accent" />
        <StatCard label="Average order value" value={H.fmtINR(avgOrderValue)} icon="box" tone="brand" />
        <StatCard label="Patients acquired" value={acquiredThisRange} icon="users" tone="brand" />
        <StatCard label="Repeat patients" value={repeatPatients} icon="refresh" tone="good" />
        <StatCard label="Medicine reorder rate" value={reorderRate+"%"} icon="target" tone="accent" />
        <StatCard label="No-show rate" value={noShowRate+"%"} icon="alert" tone="warning" />
        <StatCard label="Cancellation rate" value={cancelRate+"%"} icon="calendar" tone="warning" />
        <StatCard label="Refund rate" value={refundRate+"%"} icon="money" tone="critical" />
        <StatCard label="WhatsApp → appointment conversion" value={Math.round(100*D.appointments.filter(a=>a.bookedVia==="WhatsApp AI Agent").length/D.appointments.length)+"%"} icon="whatsapp" tone="brand" />
        <StatCard label="Consultation → treatment conversion" value={D.kpis.conversionRate+"%"} icon="trend" tone="good" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="p-4">
          <SectionHeader title="Revenue mix — consultation vs medicine" icon="chart" />
          <BarChart labels={slice.slice(-14).map(r=>r.date.toLocaleDateString("en-IN",{day:"2-digit",month:"short"}))}
            series={[{ name: "Consultation", data: slice.slice(-14).map(r=>r.consultRevenue) }, { name: "Medicine", data: slice.slice(-14).map(r=>r.medicineRevenue), color: "#eb6834" }]} currency />
        </Card>
        <Card className="p-4">
          <SectionHeader title="Revenue trend" icon="trend" />
          <LineChart currency labels={slice.map(r=>r.date.toLocaleDateString("en-IN",{day:"2-digit",month:"short"}))} series={[{ name: "Total revenue", data: slice.map(r=>r.total) }]} />
        </Card>
      </div>
      <Card className="p-4 mt-5">
        <SectionHeader title="Top-selling medicines" icon="pill" />
        <BarChart horizontal labels={D.medicines.slice().sort((a,b)=>b.avgWeeklyConsumption-a.avgWeeklyConsumption).slice(0,8).map(m=>m.name)}
          series={[{ name: "Weekly units", data: D.medicines.slice().sort((a,b)=>b.avgWeeklyConsumption-a.avgWeeklyConsumption).slice(0,8).map(m=>m.avgWeeklyConsumption) }]} height={280} />
      </Card>
    </div>
  );
}
function FeedbackPanel() {
  const [dim, setDim] = useState("courier");
  const negPct = Math.round(100*D.feedback.filter(f=>f.sentiment==="Negative").length/D.feedback.length);
  const avgNPS = Math.round(D.feedback.reduce((s,f)=>s+f.nps,0)/D.feedback.length);
  const groups = useMemo(() => {
    const map = {};
    D.deliveryExceptions.forEach(d => {
      const key = dim === "courier" ? d.courier : dim === "location" ? D.patientById[d.patientId]?.city : dim === "pincode" ? D.patientById[d.patientId]?.pincode : d.sku;
      map[key] = (map[key]||0) + 1;
    });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,8);
  }, [dim]);
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Overall satisfaction" value={(D.feedback.reduce((s,f)=>s+f.overall,0)/D.feedback.length).toFixed(1)+"/5"} icon="feedback" tone="good" />
        <StatCard label="NPS" value={avgNPS} icon="target" tone="brand" />
        <StatCard label="Complaint rate" value={negPct+"%"} icon="alert" tone="warning" />
        <StatCard label="Unresolved complaints" value={D.complaints.filter(c=>c.status==="Open").length} icon="flag" tone="critical" />
      </div>
      <Card className="p-4 mb-5" style={{ background: "var(--warning-tint)" }}>
        <div className="flex items-start gap-2.5">
          <Icon name="sparkle" size={18} className="mt-0.5" style={{color:"var(--warning)"}} />
          <p className="text-[13px] text-[var(--ink)]">AI sentiment note: delivery-related complaints account for {Math.round(100*D.deliveryExceptions.length/D.complaints.length)}% of open complaints this period — concentrated among {groups[0] ? groups[0][0] : "a few"} shipments. Consider a courier/route review.</p>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-4">
          <SectionHeader title="Recent feedback" icon="feedback" />
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {D.feedback.slice(0,20).map(f => (
              <div key={f.id} className="border-b border-[var(--border-soft)] last:border-0 py-2">
                <div className="flex items-center justify-between"><span className="text-[13px] font-medium">{f.patientName}</span><Badge tone={f.sentiment==="Negative"?"critical":f.sentiment==="Neutral"?"warning":"good"}>{f.overall}/5</Badge></div>
                <p className="text-[12.5px] text-[var(--ink-muted)] mt-0.5">"{f.comment}"</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <SectionHeader title="Drill down: delivery issues" icon="filter" action={
            <select value={dim} onChange={e=>setDim(e.target.value)} className="text-[12.5px] border border-[var(--border)] rounded-lg px-2 py-1 outline-none focus-ring">
              <option value="courier">By courier</option><option value="location">By location</option><option value="pincode">By PIN code</option><option value="sku">By medicine</option>
            </select>} />
          <BarChart horizontal labels={groups.map(g=>String(g[0]))} series={[{ name: "Issues", data: groups.map(g=>g[1]) }]} height={240} />
        </Card>
      </div>
    </div>
  );
}
const BUSINESS_QA = [
  { q: /selling fastest|top.*medicine/i, a: () => `Top movers by weekly consumption: ${D.medicines.slice().sort((a,b)=>b.avgWeeklyConsumption-a.avgWeeklyConsumption).slice(0,3).map(m=>m.name).join(", ")}.` },
  { q: /due for follow.?up/i, a: () => `${D.followUps.length} patients are currently due or overdue for follow-up — ${D.followUps.filter(f=>f.status==="Overdue").length} of those are overdue.` },
  { q: /revenue decline|why.*revenue/i, a: () => `Monthly revenue is ${H.fmtINR(D.kpis.monthRevenue)}, ${D.kpis.revenueGrowthPct>=0?"up":"down"} ${Math.abs(D.kpis.revenueGrowthPct)}% vs prior month — driven mainly by ${D.kpis.revenueGrowthPct>=0?"stronger medicine reorders":"softer medicine reorder volume and a handful of cancellations"}. Full trend is on the Business Intelligence tab.` },
  { q: /repeat rate|highest repeat/i, a: () => `Complaints and repeat rate both concentrate around chronic-care treatments (digestion, joint pain, stress) — these patients reorder most consistently given multi-month courses.` },
  { q: /location.*demand|highest demand/i, a: () => { const c={}; D.patients.forEach(p=>c[p.city]=(c[p.city]||0)+1); const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0]; return `${top[0]} has the highest patient concentration (${top[1]} patients) in the current base.`; } },
  { q: /working capital|tying up/i, a: () => { const m = D.inventoryAlerts.find(a=>a.type==="Overstock"); return m ? `${m.name} shows overstock — ${m.detail}` : "No significant overstock detected currently."; } },
  { q: /supplier.*delay|highest delay/i, a: () => { const s = D.SUPPLIERS.slice().sort((a,b)=>a.onTimeRate-b.onTimeRate)[0]; return `${s.name} has the lowest on-time rate (${Math.round(s.onTimeRate*100)}%), average lead time ${s.leadTimeDays} days.`; } },
  { q: /likely to reorder/i, a: () => `${D.refills.filter(r=>r.daysLeft>=0 && r.daysLeft<=5).length} patients have a prescription course ending within 5 days and a history of reordering — good candidates for a proactive refill nudge.` },
  { q: /bottleneck/i, a: () => `Current bottlenecks: ${D.orders.filter(o=>["Picking","Packing"].includes(o.stage)).length} orders sitting in picking/packing, and ${D.deliveryExceptions.filter(d=>d.status==="Open").length} open delivery exceptions awaiting resolution.` },
  { q: /new service|launch/i, a: () => `Given complaint/demand patterns, a structured Panchakarma package and a dedicated PCOS/lifestyle program look like the strongest candidates based on complaint themes and repeat-visit patterns.` },
  { q: /underutilized/i, a: () => `Evening slots (17:00–18:00) show the lowest fill rate relative to morning slots — worth promoting for follow-ups.` },
  { q: /maximum demand|which days/i, a: () => `Monday and Thursday show the highest appointment density in the current calendar.` },
  { q: /drop.?off|risk of/i, a: () => `${D.retention.filter(r=>r.flag==="At risk of churn").length} patients are currently flagged as churn-risk — see Patients → Patient Retention AI for the full list with suggested outreach.` },
  { q: /focus.*tomorrow|tomorrow.*focus/i, a: () => `Tomorrow: clear the ${D.kpis.waitingForResponse} pending WhatsApp approvals first (patient-facing SLA), then review the ${D.replenishment.length} replenishment recommendations before stock gets critical.` },
];
function BusinessCopilot() {
  const [msgs, setMsgs] = useState([{ role: "assistant", text: "Ask me anything about the business — I answer with explainable reasoning grounded in your clinic's data, not a black box." }]);
  const [input, setInput] = useState("");
  function send(text) {
    const q = text || input; if (!q.trim()) return;
    const m = BUSINESS_QA.find(x => x.q.test(q));
    setMsgs(s => [...s, { role: "user", text: q }, { role: "assistant", text: m ? m.a() : "I don't have a canned analysis for that yet in this prototype — in production this would query the live data warehouse." }]);
    setInput("");
  }
  const chips = ["Which medicines are selling fastest?", "Which patients are due for follow-up?", "Why did revenue decline this month?", "Which supplier has the highest delay rate?", "Where are operational bottlenecks?", "What should the clinic focus on tomorrow?"];
  return (
    <Card className="p-0 overflow-hidden max-w-2xl">
      <div className="p-4 border-b border-[var(--border-soft)] flex items-center gap-2"><Icon name="sparkle" size={16} className="text-[var(--brand-dark)]" /><span className="font-semibold text-[13.5px]">Ayurveda Business Copilot</span></div>
      <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto scrollbar-thin">
        {msgs.map((m,i) => <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}><div className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] ${m.role==="user"?"text-white":"bg-[var(--surface-sunk)]"}`} style={m.role==="user"?{background:"var(--brand)"}:{}}>{m.text}</div></div>)}
      </div>
      <div className="p-3 flex flex-wrap gap-1.5 border-t border-[var(--border-soft)]">{chips.map(c => <button key={c} onClick={()=>send(c)} className="text-[11px] px-2 py-1 rounded-full border border-[var(--border)] hover:bg-[var(--surface-sunk)]">{c}</button>)}</div>
      <div className="p-3 flex gap-2 border-t border-[var(--border-soft)]">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask a business question…" className="flex-1 text-[13px] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus-ring" />
        <Button size="sm" onClick={()=>send()}><Icon name="send" size={14}/></Button>
      </div>
    </Card>
  );
}
Views.business = BusinessView;

// ---------------------------------------------------------------------
// AI Agents + Audit Trail + Roles
// ---------------------------------------------------------------------
function AgentsView() {
  const [tab, setTab] = useState("agents");
  return (
    <div>
      <SectionHeader title="AI Agent Control Center" icon="bot" subtitle="Every agent operates within explicit permission boundaries and hands clinical/financial decisions to a human" />
      <Tabs active={tab} onChange={setTab} tabs={[{ id: "agents", label: "Agents", count: D.aiAgents.length }, { id: "audit", label: "Human-in-the-loop audit trail", count: D.auditTrail.length }, { id: "roles", label: "Roles & permissions" }]} />
      {tab === "agents" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {D.aiAgents.map(a => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13.5px] font-semibold">{a.name}</span>
                <Badge tone="good" icon="check">{a.status}</Badge>
              </div>
              <p className="text-[12px] text-[var(--ink-muted)] mb-3">{a.scope}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[var(--surface-sunk)] rounded-lg py-2"><div className="text-[15px] font-semibold tabular">{a.tasksCompleted}</div><div className="text-[10px] text-[var(--ink-muted)]">Completed</div></div>
                <div className="bg-[var(--surface-sunk)] rounded-lg py-2"><div className="text-[15px] font-semibold tabular">{a.awaitingApproval}</div><div className="text-[10px] text-[var(--ink-muted)]">Awaiting approval</div></div>
                <div className="bg-[var(--surface-sunk)] rounded-lg py-2"><div className="text-[15px] font-semibold tabular">{a.errors}</div><div className="text-[10px] text-[var(--ink-muted)]">Errors</div></div>
              </div>
              <div className="flex items-center justify-between mt-3 text-[12px] text-[var(--ink-2)]">
                <span>Success rate: <strong>{a.successRate}%</strong></span>
                <span>Human intervention: <strong>{a.humanInterventionRate}%</strong></span>
                <span>Escalations: <strong>{a.escalations}</strong></span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {tab === "audit" && (
        <Card>
          <div className="divide-y divide-[var(--border-soft)]">
            {D.auditTrail.slice(0,30).map(a => (
              <div key={a.id} className="p-4">
                <div className="flex items-center justify-between mb-2"><span className="text-[13px] font-medium">{a.patientName}</span><span className="text-[11px] text-[var(--ink-muted)]">{H.fmtDateTime(a.timestamp)}</span></div>
                <div className="text-[12px] text-[var(--ink-muted)] mb-2">"{a.patientMessage}"</div>
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <Badge tone="neutral">{a.aiClassification}</Badge>
                  {a.aiSources.map((s,i) => <Badge key={i} tone="brand">{s}</Badge>)}
                  <Icon name="chev" size={11} className="text-[var(--ink-muted)]" />
                  <Badge tone="good">{a.vaidyaDecision}</Badge>
                  <span className="text-[var(--ink-muted)]">by {a.approvedBy}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {tab === "roles" && (
        <Card className="p-4 overflow-x-auto">
          <table className="text-[12.5px] min-w-[640px]">
            <thead><tr className="text-left border-b border-[var(--border-soft)]"><th className="py-2 pr-4">Role</th><th className="py-2 pr-4">Clinical</th><th className="py-2 pr-4">Business</th><th className="py-2 pr-4">Inventory</th><th className="py-2 pr-4">Orders</th><th className="py-2 pr-4">Appointments</th><th className="py-2 pr-4">Support</th></tr></thead>
            <tbody>
              {ROLES.map(r => (
                <tr key={r.id} className="border-b border-[var(--border-soft)] last:border-0">
                  <td className="py-2 pr-4 font-medium">{r.label}</td>
                  {["clinical","business","inventory","orders","appointments","support"].map(p => <td key={p} className="py-2 pr-4">{r.perms.includes(p) ? <Icon name="check" size={14} className="text-[var(--good)]" /> : <span className="text-[var(--ink-muted)]">—</span>}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[12px] text-[var(--ink-muted)] mt-3">The AI Agent role has no standing permissions of its own — every agent action is scoped to draft/suggest, and clinical or financial execution always requires a human role above to approve.</p>
        </Card>
      )}
    </div>
  );
}
Views.agents = AgentsView;

// ---------------------------------------------------------------------
// Alert Center
// ---------------------------------------------------------------------
function AlertsView() {
  const [filter, setFilter] = useState("all");
  const CATS = ["Clinical","Patient","Inventory","Shipment","Business","Appointment"];
  const rows = filter === "all" ? D.alerts : D.alerts.filter(a => a.category === filter);
  return (
    <div>
      <SectionHeader title="Alert Center" icon="bell" subtitle="🔴 Critical · 🟠 Warning · 🟡 Informational · 🟢 Good news" />
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button onClick={()=>setFilter("all")} className={`text-[12.5px] px-3 py-1.5 rounded-full border focus-ring ${filter==="all"?"border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-dark)] font-medium":"border-[var(--border)]"}`}>All ({D.alerts.length})</button>
        {CATS.map(c => <button key={c} onClick={()=>setFilter(c)} className={`text-[12.5px] px-3 py-1.5 rounded-full border focus-ring ${filter===c?"border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-dark)] font-medium":"border-[var(--border)]"}`}>{c} ({D.alerts.filter(a=>a.category===c).length})</button>)}
      </div>
      <Card>{rows.slice(0,80).map(a => <AlertRow key={a.id} a={a} />)}</Card>
    </div>
  );
}
Views.alerts = AlertsView;
