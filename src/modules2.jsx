/* =========================================================================
   Module 2 — WhatsApp AI Agent, Ayurveda Knowledge Copilot,
              Appointments, Follow-ups & Refills
   ========================================================================= */

// ---------------------------------------------------------------------
// Shared: local "sent/approved" state layer (simulated human-in-the-loop)
// ---------------------------------------------------------------------
const ActionLog = { sent: new Set(), approvedNotes: {} };

// ---------------------------------------------------------------------
// Clinical assessment synthesis (RAG-style demo) for a WhatsApp message
// ---------------------------------------------------------------------
const RED_FLAG_KEYWORDS = [/chest pain/i, /breath/i, /bleeding/i, /unconscious|fainted|faint/i, /slurred|one side|paraly/i, /swelling.*rapid|rapid.*swelling|allergic/i, /don't want to live|suicid|self.?harm|pointless/i, /dizzy and confused|severe/i];

function classicalContext(text) {
  const t = text.toLowerCase();
  if (/digest|bloat|appetite|acidity/.test(t)) return {
    concepts: ["Agnimandya (weakened digestive fire)", "Ama (undigested metabolic residue) accumulation", "Vata-Kapha involvement in bloating"],
    kb: [{ id: "KB-CS", verified: true, note: "General principles of Agni (digestive fire) and its role in disease — chapter/verse reference to be confirmed by Vaidya before quoting." }, { id: "KB-CLINIC-SOP", verified: true, note: "Clinic-approved Agnimandya assessment checklist." }],
  };
  if (/side.?effect|thyroid|bp|pressure|tablet/.test(t)) return {
    concepts: ["Dravya-guna (pharmacological property) interaction check", "Possible Pitta aggravation from formulation"],
    kb: [{ id: "KB-CLINIC-DOSE", verified: true, note: "Clinic formulary — standard dosing & interaction notes." }, { id: "KB-BP", verified: true, note: "Materia medica reference for the formulation in question — verse-level citation pending Vaidya confirmation." }],
  };
  if (/rash|skin|allerg/.test(t)) return {
    concepts: ["Possible Pitta-Rakta involvement", "Dravya (substance) sensitivity to be ruled out"],
    kb: [{ id: "KB-UNVERIFIED-01", verified: false, note: "Uploaded practitioner note references a similar presentation — not yet verified against a primary source." }],
  };
  if (/pregnan/.test(t)) return {
    concepts: ["Garbhini paricharya (pregnancy-safe practice) screening required"],
    kb: [{ id: "KB-CLINIC-SOP", verified: true, note: "Clinic policy requires explicit Vaidya sign-off before advising on any formulation during pregnancy." }],
  };
  return {
    concepts: ["General constitutional (Prakriti-Vikriti) context review"],
    kb: [{ id: "KB-CLINIC-DOSE", verified: true, note: "Clinic formulary cross-reference." }],
  };
}

function buildClinicalAssessment(patient, message) {
  const isRedFlag = message.redFlag || RED_FLAG_KEYWORDS.some(r => r.test(message.text));
  const ctx = classicalContext(message.text);
  const history = patient ? `${patient.chiefComplaints.join(", ")}. Prakriti: ${patient.prakriti}, current Vikriti: ${patient.vikriti}. Last consultation ${H.fmtDate(patient.lastConsultDate)} (${patient.daysSinceLastConsult} days ago).` : "No linked patient record found.";
  const currentMeds = patient && patient.currentPrescription ? patient.currentPrescription.items.map(i => i.name).join(", ") : "None on file";
  const missing = isRedFlag ? ["Exact onset time and severity", "Any known cardiac/respiratory history", "Whether emergency services have been contacted"]
    : ["Duration and time-of-day pattern of symptom", "Any recent dietary or lifestyle change", "Whether symptom is worsening, stable, or improving"];
  const questions = isRedFlag
    ? ["Has the patient contacted emergency services (108 / nearest hospital)?", "Is there anyone with the patient right now?"]
    : ["Since when has this been troubling you?", "Any change in diet, sleep or stress recently?", "Is the current medication being taken as prescribed?"];
  return { isRedFlag, ctx, history, currentMeds, missing, questions };
}

// ---------------------------------------------------------------------
// WhatsApp AI Agent
// ---------------------------------------------------------------------
const CLASS_TONE = {
  "Urgent clinical concern": "critical", "Side-effect concern": "serious", "Delivery issue": "serious", "Payment issue": "warning",
  "New patient inquiry": "brand", "Existing patient query": "brand", "Medicine question": "accent", "Prescription question": "accent",
  "Follow-up request": "warning", "Appointment request": "warning", "Order status": "neutral", "General information": "neutral",
};
function WhatsAppView() {
  const { params, navigate, hasPerm } = useApp();
  const [selectedId, setSelectedId] = useState(params.convId || (D.conversations[0] && D.conversations[0].id));
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  useEffect(() => { if (params.convId) setSelectedId(params.convId); }, [params.convId]);
  const [, force] = useState(0);

  const filtered = useMemo(() => {
    let list = D.conversations;
    if (filter === "redflag") list = list.filter(c => c.redFlag);
    if (filter === "pending") list = list.filter(c => c.lastMessage.status === "Pending Vaidya approval");
    if (filter === "sent") list = list.filter(c => ActionLog.sent.has(c.lastMessage.id) || c.lastMessage.status === "Approved & sent");
    if (q.trim()) { const s = q.toLowerCase(); list = list.filter(c => c.patientName.toLowerCase().includes(s)); }
    return list;
  }, [filter, q]);

  const selected = D.conversations.find(c => c.id === selectedId) || filtered[0];
  const patient = selected ? D.patientById[selected.patientId] : null;
  const demoConv = D.conversations.find(c => c.messages.some(m => /digestion has been poor/i.test(m.text)));

  return (
    <div>
      <SectionHeader title="WhatsApp AI Agent" icon="whatsapp" subtitle="Patient → Message → AI interpretation → Suggested response → Vaidya approval → WhatsApp response"
        action={demoConv && <Button variant="outlineBrand" size="sm" onClick={() => setSelectedId(demoConv.id)}><Icon name="sparkle" size={14} />Open clinical workflow demo</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 h-[calc(100vh-190px)] min-h-[560px]">
        <Card className="flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[var(--border-soft)] space-y-2">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search patient…" className="w-full text-[13px] border border-[var(--border)] rounded-lg px-3 py-1.5 outline-none focus-ring" />
            <div className="flex gap-1.5 flex-wrap">
              {[["all","All"],["redflag","Red-flag"],["pending","Pending approval"],["sent","Sent"]].map(([id,l]) => (
                <button key={id} onClick={()=>setFilter(id)} className={`text-[11.5px] px-2.5 py-1 rounded-full border focus-ring ${filter===id?"border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-dark)] font-medium":"border-[var(--border)] text-[var(--ink-2)]"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filtered.map(c => (
              <button key={c.id} onClick={() => setSelectedId(c.id)} className={`w-full text-left px-3.5 py-3 border-b border-[var(--border-soft)] flex gap-2.5 hover:bg-[var(--surface-sunk)] ${selected && selected.id === c.id ? "bg-[var(--brand-tint)]" : ""}`}>
                <Avatar name={c.patientName} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[13px] font-medium truncate">{c.patientName}</span>
                    <span className="text-[10.5px] text-[var(--ink-muted)] shrink-0">{H.timeAgo(c.lastMessage.timestamp)}</span>
                  </div>
                  <div className="text-[12px] text-[var(--ink-muted)] truncate mt-0.5">{c.lastMessage.text}</div>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {c.redFlag && <Badge tone="critical" icon="alert">Red-flag</Badge>}
                    <Badge tone={CLASS_TONE[c.lastMessage.classification] || "neutral"}>{c.lastMessage.classification}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {selected ? (
          <div className="overflow-y-auto scrollbar-thin pr-1">
            <ConversationDetail key={selected.id} conv={selected} patient={patient} hasPerm={hasPerm} onNavigatePatient={() => navigate("patients", { patientId: patient.id })} refresh={() => force(x => x + 1)} />
          </div>
        ) : <Card className="flex items-center justify-center"><EmptyState title="Select a conversation" /></Card>}
      </div>
    </div>
  );
}

function ConversationDetail({ conv, patient, hasPerm, onNavigatePatient, refresh }) {
  const msg = conv.lastMessage;
  const assessment = useMemo(() => buildClinicalAssessment(patient, msg), [msg.id]);
  const [edited, setEdited] = useState(msg.suggestedResponse);
  const [showAssessment, setShowAssessment] = useState(true);
  const isSent = ActionLog.sent.has(msg.id) || msg.status === "Approved & sent";
  const canApprove = hasPerm("clinical") || hasPerm("support");

  function approveAndSend() {
    ActionLog.sent.add(msg.id);
    D.auditTrail.unshift({ id: H.uid("AUD"), patientId: patient.id, patientName: patient.name, patientMessage: msg.text, aiClassification: msg.classification, aiSources: assessment.ctx.kb.filter(k=>k.verified).map(k=>D.KB_SOURCES.find(s=>s.id===k.id)?.title).filter(Boolean), aiSuggestion: msg.suggestedResponse, vaidyaDecision: edited === msg.suggestedResponse ? "Approved as-is" : "Approved with edits", finalResponse: edited, timestamp: new Date(), approvedBy: D.meta.vaidya + " (Vaidya)" });
    refresh();
  }

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onNavigatePatient} className="flex items-center gap-2.5 hover:opacity-80 focus-ring">
            <Avatar name={conv.patientName} size={38} />
            <div className="text-left">
              <div className="text-[14px] font-semibold">{conv.patientName}</div>
              <div className="text-[11.5px] text-[var(--ink-muted)]">{conv.phone} · View patient 360 →</div>
            </div>
          </button>
          <Badge tone={CLASS_TONE[msg.classification] || "neutral"}>{msg.classification}</Badge>
        </div>
        <div className="space-y-2.5">
          {conv.messages.map(m => (
            <div key={m.id} className="flex justify-start">
              <div className="max-w-[80%] bg-[var(--surface-sunk)] rounded-xl rounded-tl-sm px-3.5 py-2.5">
                <div className="text-[13.5px] text-[var(--ink)] leading-snug">{m.text}</div>
                <div className="text-[10.5px] text-[var(--ink-muted)] mt-1">{H.fmtDateTime(m.timestamp)}</div>
              </div>
            </div>
          ))}
          {isSent && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-xl rounded-tr-sm px-3.5 py-2.5 text-white" style={{ background: "var(--brand)" }}>
                <div className="text-[13.5px] leading-snug">{edited}</div>
                <div className="text-[10.5px] text-white/70 mt-1">Sent by Vaidya · {H.fmtDateTime(new Date())}</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {assessment.isRedFlag && (
        <Card className="p-4 border-2" style={{ borderColor: "var(--critical)", background: "var(--critical-tint)" }}>
          <div className="flex items-start gap-3">
            <Icon name="alert" size={22} className="text-[var(--critical)] mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-[14px]" style={{ color: "var(--critical)" }}>Potential clinical escalation detected</div>
              <p className="text-[13px] text-[var(--ink)] mt-1 leading-relaxed">This message contains language consistent with a potential medical emergency. The AI has <strong>not</strong> generated routine Ayurvedic self-care advice. This conversation is flagged for immediate Vaidya review, and the patient should be advised to seek urgent medical attention / call emergency services if symptoms are severe.</p>
              <div className="flex gap-2 mt-3">
                <Button variant="danger" size="sm">Escalate to Vaidya now</Button>
                <Button variant="secondary" size="sm">Call patient</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <button onClick={() => setShowAssessment(s => !s)} className="w-full flex items-center justify-between focus-ring">
          <SectionHeader title="AI Assessment" subtitle="Detect → Understand → Recommend — Vaidya approval required before anything is sent" icon="sparkle" />
          <Icon name={showAssessment ? "chevDown" : "chev"} size={16} />
        </button>
        {showAssessment && (
          <div className="space-y-4 mt-1">
            <AssessRow label="What the patient said">
              <p className="text-[13px] text-[var(--ink-2)] italic">"{msg.text}"</p>
            </AssessRow>
            <AssessRow label="Relevant patient history">
              <p className="text-[13px] text-[var(--ink-2)]">{assessment.history}</p>
              <p className="text-[12px] text-[var(--ink-muted)] mt-1">Current medicines: {assessment.currentMeds}</p>
            </AssessRow>
            <AssessRow label="Possible Ayurvedic concepts to consider">
              <div className="flex flex-wrap gap-1.5">{assessment.ctx.concepts.map((c,i) => <Badge key={i} tone="brand">{c}</Badge>)}</div>
              <ConfidenceMeter level={assessment.isRedFlag ? "low" : "medium"} />
            </AssessRow>
            <AssessRow label="Relevant knowledge-base references">
              <div className="space-y-2">
                {assessment.ctx.kb.map((k, i) => {
                  const src = D.KB_SOURCES.find(s => s.id === k.id);
                  return (
                    <div key={i} className="border border-[var(--border-soft)] rounded-lg p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12.5px] font-medium">{src ? src.title : "Unverified source"}</span>
                        <ProvenanceTag kind={k.verified ? (src && src.id.startsWith("KB-CLINIC") ? "verified-clinic" : "classical") : "unverified"} />
                      </div>
                      <p className="text-[12px] text-[var(--ink-muted)] mt-1">{k.note}</p>
                    </div>
                  );
                })}
              </div>
            </AssessRow>
            <AssessRow label="Red-flag screening">
              <Badge tone={assessment.isRedFlag ? "critical" : "good"} icon={assessment.isRedFlag ? "alert" : "check"}>{assessment.isRedFlag ? "Escalation criteria matched" : "No red-flag terms detected"}</Badge>
            </AssessRow>
            <AssessRow label="Missing information">
              <ul className="text-[13px] text-[var(--ink-2)] list-disc pl-4 space-y-0.5">{assessment.missing.map((m,i) => <li key={i}>{m}</li>)}</ul>
            </AssessRow>
            <AssessRow label="Suggested questions for the patient">
              <ul className="text-[13px] text-[var(--ink-2)] list-disc pl-4 space-y-0.5">{assessment.questions.map((m,i) => <li key={i}>{m}</li>)}</ul>
            </AssessRow>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <SectionHeader title="Suggested patient-facing response" icon="send" />
        <textarea value={edited} onChange={e => setEdited(e.target.value)} rows={4} disabled={assessment.isRedFlag || isSent}
          className="w-full text-[13.5px] border border-[var(--border)] rounded-lg p-3 outline-none focus-ring disabled:bg-[var(--surface-sunk)] disabled:text-[var(--ink-muted)]" />
        <div className="flex flex-wrap gap-2 mt-3">
          <Button disabled={assessment.isRedFlag || isSent || !canApprove} title={!canApprove ? "Requires Vaidya or Support role" : ""} onClick={approveAndSend}><Icon name="check" size={14} />Approve & Send</Button>
          <Button variant="secondary" size="md" disabled={assessment.isRedFlag || isSent}><Icon name="edit" size={14} />Edit Response</Button>
          <Button variant="secondary" size="md" disabled={isSent}><Icon name="whatsapp" size={14} />Ask Patient More Questions</Button>
          <Button variant="danger" size="md">Escalate</Button>
        </div>
        {isSent && <div className="mt-3"><Badge tone="good" icon="check">Sent to patient · logged to audit trail</Badge></div>}
        <p className="text-[11.5px] text-[var(--ink-muted)] mt-3">The AI never diagnoses, prescribes, changes dosage, or sends a clinical message without explicit Vaidya approval.</p>
      </Card>
    </div>
  );
}
function AssessRow({ label, children }) {
  return (
    <div>
      <div className="text-[11.5px] uppercase tracking-wide text-[var(--ink-muted)] mb-1.5">{label}</div>
      {children}
    </div>
  );
}
Views.whatsapp = WhatsAppView;

// ---------------------------------------------------------------------
// Ayurveda Knowledge Copilot
// ---------------------------------------------------------------------
function KnowledgeView() {
  const [tab, setTab] = useState("sources");
  const [openDoc, setOpenDoc] = useState(null);
  return (
    <div>
      <SectionHeader title="Ayurveda Clinical Copilot" icon="book" subtitle="Retrieval-augmented knowledge base — every answer shows its source and verification status. Nothing is presented as classical fact unless verified." />
      <Tabs active={tab} onChange={setTab} tabs={[{ id: "sources", label: "Classical & clinic sources", count: D.KB_SOURCES.length }, { id: "docs", label: "Clinic documents & protocols", count: D.knowledgeDocs.length }, { id: "demo", label: "Try a query" }]} />

      {tab === "sources" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {D.KB_SOURCES.map(k => (
            <Card key={k.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOpenDoc(k)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="rounded-lg p-2 shrink-0" style={{ background: k.verified ? "var(--brand-tint)" : "var(--critical-tint)", color: k.verified ? "var(--brand-dark)" : "var(--critical)" }}><Icon name="book" size={16} /></div>
                  <div>
                    <div className="text-[13.5px] font-medium">{k.title}</div>
                    <div className="text-[12px] text-[var(--ink-muted)] mt-0.5">{k.type}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3"><ProvenanceTag kind={k.verified ? "classical" : "unverified"} /></div>
            </Card>
          ))}
        </div>
      )}

      {tab === "docs" && (
        <Card>
          <Table columns={[
            { key: "title", label: "Document" }, { key: "category", label: "Category", render: r => <Badge tone="neutral">{r.category}</Badge> },
            { key: "uploadedBy", label: "Uploaded by" }, { key: "date", label: "Date", render: r => H.fmtDate(r.date) },
            { key: "verified", label: "Status", render: r => r.verified ? <Badge tone="good" icon="shield">Verified</Badge> : <Badge tone="critical" icon="alert">Needs review</Badge> },
          ]} rows={D.knowledgeDocs} />
          <div className="p-3 border-t border-[var(--border-soft)]"><Button variant="secondary" size="sm"><Icon name="doc" size={14}/>Upload new document</Button></div>
        </Card>
      )}

      {tab === "demo" && <ClinicalQueryDemo />}

      <Modal open={!!openDoc} onClose={() => setOpenDoc(null)} title={openDoc ? openDoc.title : ""}>
        {openDoc && (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><Badge tone="neutral">{openDoc.type}</Badge><ProvenanceTag kind={openDoc.verified ? "classical" : "unverified"} /></div>
            {openDoc.verified ? (
              <p className="text-[13.5px] text-[var(--ink-2)] leading-relaxed">This source is available in the clinic's verified reference library. Chapter, section and verse-level citations are retrieved at query time and always shown with their exact location — this prototype does not fabricate specific verse numbers. When the copilot cannot verify an exact citation, it explicitly says so rather than guessing.</p>
            ) : (
              <p className="text-[13.5px]" style={{ color: "var(--critical)" }}>Reference not verified — Vaidya review required. This item was uploaded but has not yet been checked against a primary source, so the AI will not present it as an authoritative classical statement until a Vaidya verifies it.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

const DEMO_STAGES = ["Patient Query","Patient History","Previous Consultation","Current Medicines","Relevant Knowledge Base","Potential Considerations","Red-flag Screening","Questions for Vaidya","Vaidya Approval","Patient-facing WhatsApp Response"];
function ClinicalQueryDemo() {
  const [stage, setStage] = useState(0);
  const patient = D.patients.find(p => p.currentPrescription) || D.patients[0];
  const query = "My digestion has been poor for the last few days and I feel bloated after meals. What should I do?";
  const assessment = useMemo(() => buildClinicalAssessment(patient, { text: query, redFlag: false }), []);
  return (
    <Card className="p-5">
      <SectionHeader title="Clinical query workflow — worked example" icon="sparkle" subtitle="Demonstrates the full detect → understand → recommend → approve pipeline with sample data" />
      <div className="flex items-center gap-1 mb-5 flex-wrap">
        {DEMO_STAGES.map((s, i) => (
          <React.Fragment key={i}>
            <button onClick={() => setStage(i)} className={`text-[11px] px-2.5 py-1.5 rounded-full border focus-ring whitespace-nowrap ${i===stage ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-dark)] font-medium" : i<stage ? "border-[var(--good)] text-[var(--good)]" : "border-[var(--border)] text-[var(--ink-muted)]"}`}>{i+1}. {s}</button>
            {i < DEMO_STAGES.length -1 && <Icon name="chev" size={11} className="text-[var(--ink-muted)]" />}
          </React.Fragment>
        ))}
      </div>
      <div className="min-h-[220px]">
        {stage === 0 && <div><div className="text-[11.5px] uppercase text-[var(--ink-muted)] mb-1.5">Patient message</div><Card className="p-4 bg-[var(--surface-sunk)]"><p className="text-[14px] italic">"{query}"</p><p className="text-[12px] text-[var(--ink-muted)] mt-2">From {patient.name} · {H.fmtDateTime(H.daysAgo(0))}</p></Card></div>}
        {stage === 1 && <AssessRow label="Patient history"><p className="text-[13.5px] text-[var(--ink-2)]">{assessment.history}</p></AssessRow>}
        {stage === 2 && <AssessRow label="Previous consultation"><p className="text-[13.5px] text-[var(--ink-2)]">{patient.consultations[patient.consultations.length-1].assessment}</p></AssessRow>}
        {stage === 3 && <AssessRow label="Current medicines"><p className="text-[13.5px] text-[var(--ink-2)]">{assessment.currentMeds}</p></AssessRow>}
        {stage === 4 && <AssessRow label="Relevant knowledge base (RAG retrieval)"><div className="space-y-2">{assessment.ctx.kb.map((k,i) => { const src = D.KB_SOURCES.find(s=>s.id===k.id); return <div key={i} className="border border-[var(--border-soft)] rounded-lg p-2.5"><div className="flex items-center justify-between"><span className="text-[12.5px] font-medium">{src?.title}</span><ProvenanceTag kind="classical" /></div><p className="text-[12px] text-[var(--ink-muted)] mt-1">{k.note}</p></div>; })}</div></AssessRow>}
        {stage === 5 && <AssessRow label="Potential Ayurvedic considerations"><div className="flex flex-wrap gap-1.5 mb-2">{assessment.ctx.concepts.map((c,i)=><Badge key={i} tone="brand">{c}</Badge>)}</div><p className="text-[12.5px] text-[var(--ink-muted)]">These are possibilities for the Vaidya to weigh — not a diagnosis or treatment instruction.</p></AssessRow>}
        {stage === 6 && <AssessRow label="Red-flag screening"><Badge tone="good" icon="check">No red-flag terms detected — safe to proceed as a routine clinical query</Badge></AssessRow>}
        {stage === 7 && <AssessRow label="Suggested questions for Vaidya to ask"><ul className="list-disc pl-4 text-[13.5px] text-[var(--ink-2)] space-y-1">{assessment.questions.map((q,i)=><li key={i}>{q}</li>)}</ul></AssessRow>}
        {stage === 8 && <AssessRow label="Vaidya approval"><p className="text-[13.5px] text-[var(--ink-2)] mb-3">The Vaidya reviews the assessment above and approves, edits, or requests more information before anything reaches the patient.</p><div className="flex gap-2"><Button size="sm">Approve & Send</Button><Button variant="secondary" size="sm">Edit Response</Button><Button variant="secondary" size="sm">Ask Patient More Questions</Button></div></AssessRow>}
        {stage === 9 && <AssessRow label="Final patient-facing WhatsApp response"><Card className="p-3.5 bg-[var(--brand-tint)]"><p className="text-[13.5px] text-[var(--ink)]">Hi {patient.name.split(" ")[0]}, thanks for letting us know. Based on your history, this sounds consistent with Agnimandya (weakened digestion). Please try light, warm, freshly-cooked meals and avoid cold/heavy food for a couple of days. Vaidhya {D.meta.vaidya.split(" ")[1]} would like to check a couple of things — can you tell us since when this has been happening, and whether it's worse after any particular food?</p></Card><div className="mt-2"><Badge tone="good" icon="check">Approved by {D.meta.vaidya} · sent via WhatsApp</Badge></div></AssessRow>}
      </div>
      <div className="flex justify-between mt-5 pt-4 border-t border-[var(--border-soft)]">
        <Button variant="secondary" size="sm" disabled={stage===0} onClick={()=>setStage(s=>s-1)}>Back</Button>
        <Button size="sm" disabled={stage===DEMO_STAGES.length-1} onClick={()=>setStage(s=>s+1)}>Next stage <Icon name="chev" size={13}/></Button>
      </div>
    </Card>
  );
}
Views.knowledge = KnowledgeView;

// ---------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------
const APT_TABS = [
  { id: "today", label: "Today", f: a => a.dayKey === new Date(D.meta.generatedAt).toISOString().slice(0,10) },
  { id: "upcoming", label: "Upcoming", f: a => a.date > D.meta.generatedAt && a.status !== "Cancelled" },
  { id: "pending", label: "Pending confirmation", f: a => a.status === "Pending confirmation" },
  { id: "cancelled", label: "Cancelled / Rescheduled", f: a => a.status === "Cancelled" || a.status === "Rescheduled" },
  { id: "noshow", label: "No-show", f: a => a.status === "No-show" },
  { id: "all", label: "All", f: () => true },
];
function AppointmentsView() {
  const [tab, setTab] = useState("today");
  const [bookOpen, setBookOpen] = useState(false);
  const active = APT_TABS.find(t => t.id === tab);
  const rows = D.appointments.filter(active.f).slice().sort((a,b)=>a.date-b.date);
  return (
    <div>
      <SectionHeader title="Appointments" icon="calendar" subtitle="AI Appointment Agent: receives WhatsApp requests, checks the calendar, offers slots, confirms — never double-books"
        action={<Button size="sm" onClick={() => setBookOpen(true)}><Icon name="sparkle" size={14}/>New AI-assisted booking</Button>} />
      <Tabs active={tab} onChange={setTab} tabs={APT_TABS.map(t => ({ id: t.id, label: t.label, count: D.appointments.filter(t.f).length }))} />
      <Card>
        <Table columns={[
          { key: "patientName", label: "Patient", render: r => <span className="font-medium">{r.patientName}</span> },
          { key: "date", label: "Date & time", render: r => `${H.fmtDate(r.date)} · ${r.time}` },
          { key: "type", label: "Type" }, { key: "mode", label: "Mode", render: r => <Badge tone="neutral">{r.mode}</Badge> },
          { key: "bookedVia", label: "Booked via" },
          { key: "status", label: "Status", render: r => <Badge tone={r.status==="Confirmed"?"good":r.status==="Pending confirmation"?"warning":r.status==="Cancelled"||r.status==="No-show"?"critical":r.status==="Completed"?"neutral":"brand"}>{r.status}</Badge> },
          { key: "reminder", label: "Reminder", render: r => r.reminderSent ? <Badge tone="good" icon="check">Sent</Badge> : <Badge tone="neutral">—</Badge> },
        ]} rows={rows} empty="No appointments in this view" />
      </Card>
      <Modal open={bookOpen} onClose={() => setBookOpen(false)} title="AI Appointment Agent — new booking" width="max-w-lg">
        <BookingWizard onDone={() => setBookOpen(false)} />
      </Modal>
    </div>
  );
}
function BookingWizard({ onDone }) {
  const [step, setStep] = useState(0);
  const [patientQ, setPatientQ] = useState("");
  const [patient, setPatient] = useState(null);
  const [date, setDate] = useState(D.meta.generatedAt.toISOString().slice(0,10));
  const [slot, setSlot] = useState(null);
  const matches = patientQ.length > 1 ? D.patients.filter(p => p.name.toLowerCase().includes(patientQ.toLowerCase())).slice(0,5) : [];
  const bookedToday = new Set(D.appointments.filter(a => a.dayKey === date).map(a => a.time));
  const allSlots = ["09:00","09:30","10:00","10:30","11:00","11:30","15:00","15:30","16:00","16:30","17:00","17:30"];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--ink-muted)]">
        {["Identify patient","Check calendar","Offer & confirm slot","Booked"].map((s,i) => <React.Fragment key={i}><span className={i<=step?"text-[var(--brand-dark)] font-medium":""}>{s}</span>{i<3 && <Icon name="chev" size={10}/>}</React.Fragment>)}
      </div>
      {step === 0 && (
        <div>
          <input value={patientQ} onChange={e=>setPatientQ(e.target.value)} placeholder="Search patient by name…" className="w-full text-[13px] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus-ring" />
          <div className="mt-2 space-y-1">{matches.map(p => <button key={p.id} onClick={()=>{setPatient(p);setStep(1);}} className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--surface-sunk)] flex items-center gap-2 focus-ring"><Avatar name={p.name} size={26}/><span className="text-[13px]">{p.name}</span><span className="text-[11.5px] text-[var(--ink-muted)]">{p.id}</span></button>)}</div>
        </div>
      )}
      {step === 1 && patient && (
        <div>
          <div className="flex items-center gap-2 mb-3"><Avatar name={patient.name} size={30}/><span className="text-[13.5px] font-medium">{patient.name}</span></div>
          <label className="text-[12px] text-[var(--ink-muted)]">Preferred date</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full text-[13px] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus-ring mt-1" />
          <Button className="mt-3" size="sm" onClick={()=>setStep(2)}>Check availability <Icon name="chev" size={13}/></Button>
        </div>
      )}
      {step === 2 && (
        <div>
          <div className="text-[12px] text-[var(--ink-muted)] mb-2">Available slots for {date} (already-booked slots are disabled — the agent will never double-book the Vaidya):</div>
          <div className="grid grid-cols-3 gap-2">
            {allSlots.map(s => (
              <button key={s} disabled={bookedToday.has(s)} onClick={()=>setSlot(s)} className={`text-[12.5px] px-2 py-2 rounded-lg border focus-ring ${bookedToday.has(s) ? "border-[var(--border-soft)] text-[var(--ink-muted)] bg-[var(--surface-sunk)] cursor-not-allowed line-through" : slot===s ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-dark)] font-medium" : "border-[var(--border)] hover:bg-[var(--surface-sunk)]"}`}>{s}</button>
            ))}
          </div>
          <Button className="mt-3" size="sm" disabled={!slot} onClick={()=>setStep(3)}>Confirm {slot} <Icon name="chev" size={13}/></Button>
        </div>
      )}
      {step === 3 && (
        <div className="text-center py-4">
          <div className="rounded-full p-3 mb-3 inline-flex" style={{ background: "var(--good-tint)", color: "var(--good)" }}><Icon name="check" size={24}/></div>
          <div className="text-[14px] font-semibold">Appointment confirmed</div>
          <p className="text-[13px] text-[var(--ink-2)] mt-1">{patient.name} · {date} at {slot}. Confirmation + reminder will be sent via WhatsApp. Dashboard updated.</p>
          <Button className="mt-4" size="sm" onClick={onDone}>Done</Button>
        </div>
      )}
    </div>
  );
}
Views.appointments = AppointmentsView;

// ---------------------------------------------------------------------
// Follow-ups & Refills
// ---------------------------------------------------------------------
function FollowUpsView() {
  const [tab, setTab] = useState("followups");
  const [, force] = useState(0);
  return (
    <div>
      <SectionHeader title="Follow-up Engine" icon="clock" subtitle="Identifies due, overdue, and unresponsive patients — every reminder needs Approve & Send" />
      <Tabs active={tab} onChange={setTab} tabs={[{ id: "followups", label: "Follow-ups", count: D.followUps.length }, { id: "refills", label: "Medicine refills", count: D.refills.length }]} />
      {tab === "followups" && (
        <div className="space-y-2.5">
          {D.followUps.map(f => <FollowUpRow key={f.id} f={f} onSent={() => force(x=>x+1)} />)}
        </div>
      )}
      {tab === "refills" && (
        <div className="space-y-2.5">
          {D.refills.map(r => <RefillRow key={r.id} r={r} onSent={() => force(x=>x+1)} />)}
        </div>
      )}
    </div>
  );
}
function FollowUpRow({ f, onSent }) {
  const { navigate } = useApp();
  const sent = ActionLog.sent.has(f.id);
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <Avatar name={f.patientName} size={36} />
          <div>
            <button onClick={()=>navigate("patients",{patientId:f.patientId})} className="text-[13.5px] font-medium hover:underline focus-ring">{f.patientName}</button>
            <div className="text-[12.5px] text-[var(--ink-muted)] mt-0.5">{f.reason}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge tone={f.status==="Overdue"?"critical":f.status==="Due today/soon"?"warning":"neutral"}>{f.status}{f.overdueDays>0 && ` · ${f.overdueDays}d`}</Badge>
              <span className="text-[11.5px] text-[var(--ink-muted)]">Due {H.fmtDate(f.dueDate)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sent ? <Badge tone="good" icon="check">Reminder sent</Badge> : <Button size="sm" onClick={() => { ActionLog.sent.add(f.id); onSent(); }}>Approve & Send reminder</Button>}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-[var(--border-soft)] text-[12.5px] text-[var(--ink-2)] bg-[var(--surface-sunk)] rounded-lg p-2.5">"{f.suggestedMessage}"</div>
    </Card>
  );
}
function RefillRow({ r, onSent }) {
  const { navigate } = useApp();
  const sent = ActionLog.sent.has(r.id);
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <Avatar name={r.patientName} size={36} />
          <div>
            <button onClick={()=>navigate("patients",{patientId:r.patientId})} className="text-[13.5px] font-medium hover:underline focus-ring">{r.patientName}</button>
            <div className="text-[12.5px] text-[var(--ink-muted)] mt-0.5">{r.medicines.join(", ")}</div>
            <Badge tone={r.daysLeft < 0 ? "critical" : r.daysLeft <= 3 ? "warning" : "neutral"} className="mt-1.5">{r.message}</Badge>
          </div>
        </div>
        {sent ? <Badge tone="good" icon="check">Reminder sent</Badge> : <Button size="sm" onClick={() => { ActionLog.sent.add(r.id); onSent(); }}>Send refill reminder?</Button>}
      </div>
      <p className="text-[11.5px] text-[var(--ink-muted)] mt-2">Any change to dosage or formulation is routed to the Vaidya — the AI only offers a like-for-like refill reminder.</p>
    </Card>
  );
}
Views.followups = FollowUpsView;
