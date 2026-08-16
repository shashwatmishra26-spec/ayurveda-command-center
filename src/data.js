/* =========================================================================
   Ayurveda Command Center — synthetic demo data generator
   ---------------------------------------------------------------------
   Everything in this file is FAKE / HYPOTHETICAL DATA generated with a
   seeded PRNG so the demo is stable across reloads. No real patient,
   clinic, or business information is used anywhere in this prototype.
   ========================================================================= */

(function () {
  "use strict";

  // ---------- seeded RNG (mulberry32) --------------------------------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(20260815);
  const R = () => rng();
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  const pickN = (arr, n) => {
    const copy = arr.slice();
    const out = [];
    for (let i = 0; i < n && copy.length; i++) {
      out.push(copy.splice(Math.floor(R() * copy.length), 1)[0]);
    }
    return out;
  };
  const int = (min, max) => Math.floor(R() * (max - min + 1)) + min;
  const chance = (p) => R() < p;
  let __uid = 1000;
  const uid = (prefix) => `${prefix}-${__uid++}`;

  const NOW = new Date("2026-08-15T09:00:00+05:30");
  function daysAgo(n) { const d = new Date(NOW); d.setDate(d.getDate() - n); return d; }
  function daysFromNow(n) { const d = new Date(NOW); d.setDate(d.getDate() + n); return d; }
  function fmtDate(d) { if (!d) return "—"; const dt = (d instanceof Date) ? d : new Date(d); return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  function fmtDateTime(d) { if (!d) return "—"; const dt = (d instanceof Date) ? d : new Date(d); return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + ", " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }
  function fmtTime(d) { const dt = (d instanceof Date) ? d : new Date(d); return dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }
  function fmtINR(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }
  function timeAgo(d) {
    const dt = (d instanceof Date) ? d : new Date(d);
    const diffMs = NOW - dt;
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    const days = Math.round(hrs / 24);
    if (days < 30) return days + "d ago";
    return fmtDate(dt);
  }

  // ---------- reference lists -----------------------------------------
  const MALE_FIRST = ["Aarav","Vivaan","Aditya","Rohan","Kabir","Arjun","Rajesh","Suresh","Manoj","Sanjay","Vikram","Anil","Deepak","Ramesh","Ashok","Nikhil","Rahul","Karthik","Siddharth","Pranav","Harish","Gaurav","Amit","Sunil","Vinod","Prakash","Mahesh","Naveen","Ravi","Yash"];
  const FEMALE_FIRST = ["Aanya","Diya","Ishita","Saanvi","Ananya","Priya","Sunita","Kavita","Meena","Pooja","Neha","Anjali","Shreya","Kritika","Rekha","Geeta","Lakshmi","Radha","Swati","Nisha","Divya","Deepa","Sneha","Vidya","Manisha","Ritu","Payal","Asha","Uma","Preeti"];
  const SURNAMES = ["Sharma","Verma","Iyer","Nair","Menon","Reddy","Rao","Gupta","Agarwal","Joshi","Kulkarni","Deshmukh","Patel","Shah","Mehta","Bose","Chatterjee","Mukherjee","Pillai","Nambiar","Krishnan","Subramaniam","Bhatt","Trivedi","Pandey","Tiwari","Yadav","Chauhan","Kaur","Singh","Malhotra","Kapoor","Bhardwaj","Rastogi","Saxena"];
  const CITIES = [
    ["Bengaluru","KA",560001],["Bengaluru","KA",560034],["Bengaluru","KA",560078],
    ["Mumbai","MH",400001],["Mumbai","MH",400050],["Pune","MH",411001],["Pune","MH",411045],
    ["Delhi","DL",110001],["Delhi","DL",110016],["Gurugram","HR",122001],["Noida","UP",201301],
    ["Chennai","TN",600001],["Chennai","TN",600040],["Coimbatore","TN",641001],
    ["Hyderabad","TS",500001],["Hyderabad","TS",500034],
    ["Kochi","KL",682001],["Thiruvananthapuram","KL",695001],["Kozhikode","KL",673001],
    ["Ahmedabad","GJ",380001],["Surat","GJ",395003],
    ["Jaipur","RJ",302001],["Lucknow","UP",226001],["Kanpur","UP",208001],
    ["Kolkata","WB",700001],["Bhubaneswar","OD",751001],
    ["Nagpur","MH",440001],["Indore","MP",452001],["Bhopal","MP",462001],
    ["Chandigarh","CH",160001],["Dehradun","UK",248001],["Patna","BR",800001],
    ["Guwahati","AS",781001],["Visakhapatnam","AP",530001],["Vijayawada","AP",520001],
  ];
  const PRAKRITI = ["Vata","Pitta","Kapha","Vata-Pitta","Pitta-Kapha","Vata-Kapha","Tridoshic"];
  const COMPLAINTS = [
    "Chronic indigestion & bloating","Acidity / hyperacidity","Joint pain (knees)","Low back pain",
    "Migraine / recurring headache","Insomnia","Anxiety & stress","Skin allergy / eczema","PCOS related irregular cycles",
    "Hypothyroidism management","Type 2 diabetes management","Hypertension management","Chronic constipation",
    "Seasonal allergic rhinitis","Cervical spondylosis","Hair fall","Obesity / weight management","Piles (early stage)",
    "Post-viral fatigue","Menopausal symptoms","Migraine with nausea","IBS symptoms","Sciatica","Frozen shoulder",
  ];
  const COURIERS = ["India Post – Speed Post","India Post – Registered","Delhivery","DTDC","Blue Dart"];
  const SUPPLIERS = [
    { id: "SUP-01", name: "Kerala Ayurveda Pharmacy Pvt Ltd", city: "Athani, KL", leadTimeDays: 6, onTimeRate: 0.94 },
    { id: "SUP-02", name: "Vaidyaratnam Oushadhasala", city: "Thrissur, KL", leadTimeDays: 8, onTimeRate: 0.88 },
    { id: "SUP-03", name: "Arya Vaidya Sala, Kottakkal", city: "Kottakkal, KL", leadTimeDays: 10, onTimeRate: 0.81 },
    { id: "SUP-04", name: "Dabur Ayurvedic Specialities", city: "Ghaziabad, UP", leadTimeDays: 5, onTimeRate: 0.96 },
    { id: "SUP-05", name: "Patanjali Ayurved Ltd", city: "Haridwar, UK", leadTimeDays: 4, onTimeRate: 0.9 },
    { id: "SUP-06", name: "Sitaram Ayurveda Herbals", city: "Jaipur, RJ", leadTimeDays: 9, onTimeRate: 0.79 },
    { id: "SUP-07", name: "Himalaya Wellness Company (OTC distributor)", city: "Bengaluru, KA", leadTimeDays: 5, onTimeRate: 0.92 },
  ];

  const MEDICINES = [
    ["Ashwagandha Tablets","Rasayana / Vati","500mg",1],["Triphala Churna","Churna","100g",2],
    ["Chyawanprash","Rasayana","500g",3],["Dashmoolarishta","Asava/Arishta","450ml",4],
    ["Saraswatarishta","Asava/Arishta","450ml",4],["Ashokarishta","Asava/Arishta","450ml",4],
    ["Mahasudarshan Churna","Churna","100g",2],["Hingvastak Churna","Churna","100g",2],
    ["Avipattikar Churna","Churna","100g",2],["Sitopaladi Churna","Churna","50g",2],
    ["Talisadi Churna","Churna","50g",2],["Yograj Guggulu","Vati/Gutika","500mg",1],
    ["Kaishore Guggulu","Vati/Gutika","500mg",1],["Punarnavadi Guggulu","Vati/Gutika","500mg",1],
    ["Trayodashang Guggulu","Vati/Gutika","500mg",1],["Mahayograj Guggulu","Vati/Gutika","500mg",1],
    ["Chandraprabha Vati","Vati/Gutika","500mg",1],["Arogyavardhini Vati","Vati/Gutika","250mg",1],
    ["Gokshuradi Guggulu","Vati/Gutika","500mg",1],["Brahmi Vati","Vati/Gutika","250mg",1],
    ["Mahanarayan Taila","Taila (oil)","200ml",5],["Ksheerabala Taila","Taila (oil)","200ml",5],
    ["Dhanwantharam Taila","Taila (oil)","200ml",5],["Kottamchukkadi Taila","Taila (oil)","200ml",5],
    ["Bala Ashwagandha Taila","Taila (oil)","200ml",5],["Panchatikta Ghrita","Ghrita (ghee)","200g",6],
    ["Brahmi Ghrita","Ghrita (ghee)","200g",6],["Shatavari Churna","Churna","100g",2],
    ["Shatavari Kalpa","Rasayana","250g",3],["Guduchi Satva","Rasayana","50g",3],
    ["Livomap Syrup","Proprietary Syrup","200ml",7],["Diabecon Tablets","Proprietary Vati","60 tabs",7],
    ["Rumalaya Forte","Proprietary Vati","60 tabs",7],["Septilin Tablets","Proprietary Vati","60 tabs",7],
    ["Pilex Tablets","Proprietary Vati","60 tabs",7],["Himcocid Suspension","Proprietary Syrup","200ml",7],
  ];

  const KB_SOURCES = [
    { id: "KB-CS", title: "Charaka Samhita", type: "Classical Samhita", verified: true },
    { id: "KB-SS", title: "Sushruta Samhita", type: "Classical Samhita", verified: true },
    { id: "KB-AH", title: "Ashtanga Hridaya", type: "Classical Compendium", verified: true },
    { id: "KB-AS", title: "Ashtanga Sangraha", type: "Classical Compendium", verified: true },
    { id: "KB-MN", title: "Madhava Nidana", type: "Classical Nidana (diagnosis) text", verified: true },
    { id: "KB-BP", title: "Bhavaprakasha", type: "Classical Materia Medica", verified: true },
    { id: "KB-SG", title: "Sharangadhara Samhita", type: "Classical Formulary", verified: true },
    { id: "KB-CLINIC-SOP", title: "Clinic SOP — Agnimandya (weak digestion) protocol", type: "Clinic-approved SOP", verified: true },
    { id: "KB-CLINIC-DOSE", title: "Clinic Formulary — standard dosing reference", type: "Clinic-approved formulary", verified: true },
    { id: "KB-CLINIC-CONSENT", title: "Consent & Telehealth Consultation Policy", type: "Clinic SOP", verified: true },
    { id: "KB-CLINIC-SHIP", title: "Shipping & Delivery Policy", type: "Clinic policy", verified: true },
    { id: "KB-CLINIC-REFUND", title: "Refund & Replacement Policy", type: "Clinic policy", verified: true },
    { id: "KB-UNVERIFIED-01", title: "Regional practitioner notes — Kutajarishta in IBS (uploaded, not yet reviewed)", type: "Unverified upload", verified: false },
  ];

  // ---------- Suppliers / Medicines / Batches --------------------------
  const medicines = MEDICINES.map(([name, category, unit, supIdx], i) => {
    const sku = "AYU-" + String(1000 + i);
    const purchasePrice = int(40, 260);
    const margin = R() * 0.35 + 0.35; // 35-70%
    const sellingPrice = Math.round(purchasePrice / (1 - margin) / 5) * 5;
    const avgWeeklyConsumption = int(20, 220);
    const reorderLevel = Math.round(avgWeeklyConsumption * 1.3);
    const reorderQty = Math.round(avgWeeklyConsumption * 2.5);
    return {
      id: uid("MED"), sku, name, category, unit,
      supplierId: SUPPLIERS[supIdx - 1].id,
      purchasePrice, sellingPrice,
      margin: Math.round((sellingPrice - purchasePrice) / sellingPrice * 100),
      avgWeeklyConsumption, reorderLevel, reorderQty,
      trend: pick(["rising","stable","stable","stable","falling"]),
    };
  });

  const batches = [];
  medicines.forEach((m) => {
    const nBatches = int(1, 3);
    for (let b = 0; b < nBatches; b++) {
      const mfgDaysAgo = int(30, 540);
      const shelfLifeDays = int(540, 1080);
      const mfgDate = daysAgo(mfgDaysAgo);
      const expDate = new Date(mfgDate); expDate.setDate(expDate.getDate() + shelfLifeDays);
      const qty = int(0, 900);
      const reserved = Math.min(qty, int(0, Math.round(qty * 0.3)));
      batches.push({
        id: uid("BATCH"), medicineId: m.id, medicineName: m.name, sku: m.sku,
        batchNo: "B" + (2400 + int(0, 599)),
        mfgDate, expDate, qty, reserved, available: qty - reserved,
        daysToExpiry: Math.round((expDate - NOW) / 86400000),
      });
    }
  });
  function batchesFor(medId) { return batches.filter(b => b.medicineId === medId); }
  function stockFor(medId) { return batchesFor(medId).reduce((s, b) => s + b.qty, 0); }
  function availableFor(medId) { return batchesFor(medId).reduce((s, b) => s + b.available, 0); }

  // ---------- Patients ---------------------------------------------------
  const WA_STATUSES = ["Active","Active","Active","Active","Opted-out","Unreachable"];
  const patients = [];
  for (let i = 0; i < 128; i++) {
    const gender = chance(0.56) ? "Female" : "Male";
    const first = gender === "Female" ? pick(FEMALE_FIRST) : pick(MALE_FIRST);
    const last = pick(SURNAMES);
    const [city, state, pin] = pick(CITIES);
    const age = int(19, 78);
    const firstConsultDaysAgo = int(10, 730);
    const patientId = "PT-" + String(10234 + i);
    const complaints = pickN(COMPLAINTS, int(1, 2));
    const prakriti = pick(PRAKRITI);
    const vikriti = pick(PRAKRITI.filter(p => p !== prakriti).concat(["Vata aggravation","Pitta aggravation","Kapha aggravation"]));
    patients.push({
      id: patientId,
      name: `${first} ${last}`,
      age, gender,
      city, state, pincode: pin,
      phone: "+91 " + int(70000, 99999) + " " + int(10000, 99999),
      whatsappStatus: pick(WA_STATUSES),
      firstConsultDate: daysAgo(firstConsultDaysAgo),
      prakriti, vikriti,
      chiefComplaints: complaints,
      tags: [],
      _firstConsultDaysAgo: firstConsultDaysAgo,
    });
  }
  const patientById = Object.fromEntries(patients.map(p => [p.id, p]));

  // ---------- Consultations / Prescriptions ------------------------------
  const ASSESSMENT_NOTES = [
    "Agnimandya (weakened digestive fire) with Ama accumulation noted; advised dietary regulation alongside deepana-pachana therapy.",
    "Vata-Pitta imbalance contributing to joint discomfort; Panchakarma (Basti) considered for next phase.",
    "Signs of Pitta prakopa — recommend cooling diet, avoid excess spice/sour foods, continue Sheeta virya formulations.",
    "Kapha accumulation with sluggish metabolism; advised Udvartana and Trikatu-based formulations.",
    "Stress-related Vata vitiation affecting sleep; Medhya Rasayana and lifestyle counselling advised.",
    "Rakta-Pitta involvement suspected in skin presentation; continue Raktashodhak Churna, monitor response.",
  ];
  const consultations = [];
  const prescriptions = [];
  patients.forEach((p) => {
    const n = int(1, 5);
    let lastDate = null, nextDate = null;
    const cList = [];
    for (let i = 0; i < n; i++) {
      const daysBack = Math.max(1, Math.round(p._firstConsultDaysAgo * (1 - i / n)) - int(0, 15));
      const date = daysAgo(daysBack);
      const consult = {
        id: uid("CONS"), patientId: p.id, date,
        type: i === 0 ? "New consultation" : "Follow-up consultation",
        mode: pick(["Video","In-clinic","Phone"]),
        assessment: pick(ASSESSMENT_NOTES),
        chiefComplaint: pick(p.chiefComplaints),
      };
      cList.push(consult);
      consultations.push(consult);

      const meds = pickN(medicines, int(2, 4));
      const rx = {
        id: uid("RX"), consultId: consult.id, patientId: p.id, date,
        items: meds.map(m => ({
          medicineId: m.id, name: m.name,
          dosage: pick(["1 tab twice daily after food","2 tsp with warm water before food","1 tab thrice daily","10ml with equal water twice daily","1/2 tsp with honey at bedtime"]),
          durationDays: pick([15, 30, 30, 45, 60]),
        })),
        courseLengthDays: pick([15, 30, 30, 45, 60]),
      };
      prescriptions.push(rx);
      lastDate = date;
    }
    p.consultations = cList.sort((a, b) => a.date - b.date);
    p.lastConsultDate = lastDate;
    const daysSinceLast = Math.round((NOW - lastDate) / 86400000);
    p.nextConsultDate = chance(0.4) ? daysFromNow(int(1, 21)) : null;
    p.daysSinceLastConsult = daysSinceLast;
    p.currentPrescription = prescriptions.filter(r => r.patientId === p.id).slice(-1)[0];
    p.adherence = int(55, 99);
    if (daysSinceLast > 45 && !p.nextConsultDate) p.tags.push("follow-up-overdue");
    if (chance(0.12)) p.tags.push("vip");
    if (chance(0.1)) p.tags.push("churn-risk");
  });

  // ---------- Appointments ------------------------------------------------
  const SLOT_TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","15:00","15:30","16:00","16:30","17:00","17:30","18:00"];
  const appointments = [];
  const bookedSlotsByDay = {};
  function bookSlot(dayKey, time) {
    bookedSlotsByDay[dayKey] = bookedSlotsByDay[dayKey] || new Set();
    if (bookedSlotsByDay[dayKey].has(time)) return false;
    bookedSlotsByDay[dayKey].add(time);
    return true;
  }
  for (let i = 0; i < 64; i++) {
    const p = pick(patients);
    const offset = int(-10, 10);
    const date = offset < 0 ? daysAgo(-offset) : daysFromNow(offset);
    const dayKey = date.toISOString().slice(0, 10);
    let time = pick(SLOT_TIMES), tries = 0;
    while (!bookSlot(dayKey, time) && tries < 10) { time = pick(SLOT_TIMES); tries++; }
    let status;
    if (offset < 0) status = pick(["Completed","Completed","Completed","No-show","Cancelled"]);
    else if (offset === 0) status = pick(["Confirmed","Confirmed","Pending confirmation"]);
    else status = pick(["Confirmed","Pending confirmation","Pending confirmation","Rescheduled"]);
    appointments.push({
      id: uid("APT"), patientId: p.id, patientName: p.name,
      date, dayKey, time,
      type: chance(0.4) ? "New consultation" : "Follow-up",
      mode: pick(["Video","In-clinic","Phone"]),
      status,
      bookedVia: pick(["WhatsApp AI Agent","Manual (Reception)","WhatsApp AI Agent","Website"]),
      reminderSent: chance(0.7),
    });
  }
  appointments.sort((a, b) => a.date - b.date);

  // ---------- WhatsApp conversations & messages ---------------------------
  const CLASSIFICATIONS = [
    "New patient inquiry","Existing patient query","Medicine question","Prescription question",
    "Side-effect concern","Follow-up request","Appointment request","Order status",
    "Delivery issue","Payment issue","General information","Urgent clinical concern",
  ];
  const RED_FLAG_TEXTS = [
    "I'm having severe chest pain and it's hard to breathe since this morning.",
    "My father suddenly can't move one side of his body and his speech is slurred.",
    "There is heavy bleeding that hasn't stopped for an hour, I'm scared.",
    "I feel like I don't want to live anymore, everything feels pointless.",
    "My face is swelling rapidly and I'm having trouble breathing after taking the tablet.",
    "I fainted twice today and feel extremely dizzy and confused.",
  ];
  const NORMAL_TEXTS = [
    "My digestion has been poor for the last few days and I feel bloated after meals. What should I do?",
    "Can I take the Triphala Churna along with my BP tablets?",
    "I forgot to take yesterday's evening dose, should I double up today?",
    "When should I come for my next follow-up?",
    "Is it normal to feel slightly more thirsty after starting Chandraprabha Vati?",
    "My order hasn't arrived yet, it's been 5 days.",
    "Can I get an appointment this week, preferably evening?",
    "I received the package but one bottle is missing.",
    "The payment got deducted twice for my last order, please check.",
    "Does Ashwagandha have any side effects for someone with thyroid issues?",
    "I've been feeling much better after 2 weeks, should I continue the same dose?",
    "What is Agnimandya? The doctor mentioned it during my consultation.",
    "Can you share the diet chart discussed in my last visit?",
    "I want to reschedule tomorrow's appointment to next week.",
    "Is Dashmoolarishta safe during pregnancy?",
    "My skin rash has gotten worse since I started the new oil, should I stop?",
  ];
  const AI_REPLY_TEMPLATES = {
    "Order status": "Hi {name}, your order {order} is currently '{status}' with {courier}. Expected delivery: {eta}. Reply if you need the tracking link.",
    "Delivery issue": "Hi {name}, sorry to hear about the delivery issue. I've logged a discrepancy case for order {order} — our pharmacy team will resolve this within 48 hours.",
    "Payment issue": "Hi {name}, thanks for flagging this — I've forwarded the payment discrepancy for order {order} to our billing team for verification.",
    "Appointment request": "Hi {name}, I can see the following open slots with Vaidya this week: {slots}. Please reply with your preferred slot to confirm.",
    "Follow-up request": "Hi {name}, your follow-up looks due — shall I book you a slot with Vaidya on {slots}?",
    "General information": "Hi {name}, thank you for reaching out — sharing the relevant clinic information for your query shortly.",
  };
  const conversations = [];
  const messages = [];
  const activePatients = pickN(patients, 92);
  activePatients.forEach((p) => {
    const conv = { id: uid("WAC"), patientId: p.id, patientName: p.name, phone: p.phone };
    const isRedFlag = chance(0.045);
    const nMsgs = int(1, 3);
    const lastMsgs = [];
    for (let i = 0; i < nMsgs; i++) {
      const cls = isRedFlag && i === nMsgs - 1 ? "Urgent clinical concern" : pick(CLASSIFICATIONS.filter(c => c !== "Urgent clinical concern"));
      const text = isRedFlag && i === nMsgs - 1 ? pick(RED_FLAG_TEXTS) : pick(NORMAL_TEXTS);
      const minsAgo = int(3, 4200);
      const isRedFlagMsg = cls === "Urgent clinical concern";
      let status;
      if (isRedFlagMsg) status = "Escalated — awaiting Vaidya";
      else status = pick(["Pending Vaidya approval","Pending Vaidya approval","Approved & sent","Approved & sent","Approved & sent","Awaiting patient reply"]);
      const template = AI_REPLY_TEMPLATES[cls];
      const suggested = isRedFlagMsg
        ? "⚠️ Do not send an automated Ayurvedic self-care response. This message has been escalated for immediate Vaidya / emergency-care guidance."
        : template
          ? template.replace("{name}", p.name.split(" ")[0]).replace("{order}", "ORD-" + int(10000, 99999)).replace("{status}", pick(["In transit","Out for delivery","Dispatched"])).replace("{courier}", pick(COURIERS)).replace("{eta}", fmtDate(daysFromNow(int(1,4)))).replace("{slots}", SLOT_TIMES.slice(0,3).join(", "))
          : `Hi ${p.name.split(" ")[0]}, thank you for your message. Based on your history, here are some general considerations — Vaidya will confirm before this is sent.`;
      const msg = {
        id: uid("MSG"), convId: conv.id, patientId: p.id, patientName: p.name,
        direction: "inbound", text, classification: cls,
        timestamp: new Date(NOW - minsAgo * 60000),
        redFlag: isRedFlagMsg,
        aiInterpretation: isRedFlagMsg
          ? "Message contains language consistent with a potential medical emergency / safety risk. Immediate escalation triggered; AI will not generate self-care advice."
          : `Classified as "${cls}". ` + (cls === "Urgent clinical concern" ? "Escalating for review." : "Retrieved relevant patient history and knowledge-base context to prepare a draft for Vaidya review."),
        suggestedResponse: suggested,
        status,
      };
      messages.push(msg);
      lastMsgs.push(msg);
    }
    conv.lastMessage = lastMsgs[lastMsgs.length - 1];
    conv.messages = lastMsgs;
    conv.unread = chance(0.55);
    conv.redFlag = isRedFlag;
    conversations.push(conv);
  });
  conversations.sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);

  // ---------- Orders / Shipments / Delivery exceptions ---------------------
  const ORDER_STAGES = ["Prescription received","Order created","Payment confirmed","Picking","Packing","Dispatched","In transit","Delivered"];
  const orders = [];
  const shipments = [];
  const deliveryExceptions = [];
  for (let i = 0; i < 132; i++) {
    const p = pick(patients);
    const items = pickN(medicines, int(1, 4)).map(m => ({ medicineId: m.id, name: m.name, qty: int(1, 3), price: m.sellingPrice }));
    const value = items.reduce((s, it) => s + it.qty * it.price, 0);
    const daysBackOrder = int(0, 75);
    const orderDate = daysAgo(daysBackOrder);
    let stageIdx;
    if (daysBackOrder > 10) stageIdx = 7;
    else if (daysBackOrder > 6) stageIdx = int(5, 7);
    else if (daysBackOrder > 2) stageIdx = int(2, 6);
    else stageIdx = int(0, 4);
    const stage = ORDER_STAGES[stageIdx];
    const paymentStatus = stageIdx >= 2 ? "Paid" : pick(["Paid", "Pending", "Paid"]);
    const orderId = "ORD-" + String(58000 + i);
    const order = {
      id: orderId, patientId: p.id, patientName: p.name, city: p.city, pincode: p.pincode,
      items, value, date: orderDate, stage, paymentStatus,
      linkedRxId: p.currentPrescription ? p.currentPrescription.id : null,
    };
    orders.push(order);

    if (stageIdx >= 5) {
      const courier = pick(COURIERS);
      const dispatchDate = new Date(orderDate); dispatchDate.setDate(dispatchDate.getDate() + int(1, 2));
      const transitDays = int(2, 8);
      const expectedDelivery = new Date(dispatchDate); expectedDelivery.setDate(expectedDelivery.getDate() + transitDays);
      let shipStatus, actualDelivery = null, exceptionType = null;
      const roll = R();
      if (stage === "Delivered") {
        if (roll < 0.86) { shipStatus = "Delivered"; actualDelivery = new Date(expectedDelivery); actualDelivery.setDate(actualDelivery.getDate() + int(-1, 2)); }
        else if (roll < 0.93) { shipStatus = "Delivered — reported issue"; actualDelivery = expectedDelivery; exceptionType = pick(["Missing medicine","Wrong medicine","Damaged package","Damaged medicine","Quantity mismatch"]); }
        else { shipStatus = "Returned"; exceptionType = "Address issue"; }
      } else {
        shipStatus = pick(["Booked","Dispatched","In transit","Arrived at destination","Out for delivery","Delivery attempted"]);
        if (shipStatus === "Delivery attempted" && chance(0.5)) exceptionType = "Address issue";
      }
      const trackingNo = "EE" + int(100000000, 999999999) + "IN";
      const events = [];
      events.push({ status: "Booked", date: dispatchDate, location: p.city });
      if (["Dispatched","In transit","Arrived at destination","Out for delivery","Delivered","Delivered — reported issue","Returned","Delivery attempted"].includes(shipStatus) || true) {
        const d1 = new Date(dispatchDate); d1.setDate(d1.getDate());
        events.push({ status: "Dispatched", date: d1, location: pick(SUPPLIERS).city });
      }
      if (shipStatus !== "Booked") {
        const d2 = new Date(dispatchDate); d2.setDate(d2.getDate() + Math.round(transitDays / 2));
        events.push({ status: "In transit", date: d2, location: "Regional Sorting Hub — " + p.state });
      }
      if (["Arrived at destination","Out for delivery","Delivered","Delivered — reported issue","Returned","Delivery attempted"].includes(shipStatus)) {
        const d3 = new Date(expectedDelivery); d3.setDate(d3.getDate() - 1);
        events.push({ status: "Arrived at destination", date: d3, location: p.city + " Delivery Office" });
      }
      if (["Out for delivery","Delivered","Delivered — reported issue","Returned","Delivery attempted"].includes(shipStatus)) {
        events.push({ status: "Out for delivery", date: expectedDelivery, location: p.city });
      }
      if (shipStatus === "Delivery attempted") events.push({ status: "Delivery attempted — recipient unavailable", date: expectedDelivery, location: p.city });
      if (shipStatus === "Returned") events.push({ status: "Returned to origin — address issue", date: new Date(expectedDelivery.getTime() + 2 * 86400000), location: pick(SUPPLIERS).city });
      if (shipStatus === "Delivered" || shipStatus === "Delivered — reported issue") events.push({ status: "Delivered", date: actualDelivery, location: p.city });

      const shipment = {
        id: uid("SHP"), orderId, patientId: p.id, patientName: p.name,
        trackingNo, courier, pincode: p.pincode, destination: `${p.city}, ${p.state} – ${p.pincode}`,
        dispatchDate, expectedDelivery, actualDelivery, status: shipStatus, events, simulated: true,
      };
      shipments.push(shipment);

      if (exceptionType) {
        deliveryExceptions.push({
          id: uid("DEX"), orderId, shipmentId: shipment.id, patientId: p.id, patientName: p.name,
          issueType: exceptionType, sku: pick(items).name, batch: "B" + (2400 + int(0, 599)),
          courier, reportedDate: actualDelivery || expectedDelivery,
          rootCause: pick(["Courier mishandling","Warehouse picking error","Address incomplete","Packaging failure in transit","Recipient unavailable","Under investigation"]),
          resolution: pick(["Replacement dispatched","Refund issued","Investigation in progress","Replacement dispatched","Pending pharmacy review"]),
          status: pick(["Open","Open","Resolved","In progress"]),
          tatHours: int(4, 96),
          owner: pick(["Customer Support","Pharmacy Staff","Clinic Manager"]),
        });
      }
    }
  }
  orders.sort((a, b) => b.date - a.date);

  // ---------- Feedback -----------------------------------------------------
  const feedback = [];
  pickN(orders.filter(o => o.stage === "Delivered"), 70).forEach((o) => {
    const p = patientById[o.patientId];
    const overall = int(2, 5);
    feedback.push({
      id: uid("FB"), orderId: o.id, patientId: o.patientId, patientName: p.name,
      date: new Date(o.date.getTime() + int(4, 12) * 86400000),
      consultationRating: int(3, 5), responseTimeRating: int(2, 5),
      deliveryRating: overall <= 3 ? int(1, 3) : int(3, 5),
      packagingRating: int(3, 5), availabilityRating: int(3, 5),
      overall, nps: overall >= 4 ? int(8, 10) : overall === 3 ? int(6, 8) : int(0, 5),
      comment: overall >= 4
        ? pick(["Great experience, medicines arrived on time.","Vaidya explained everything clearly, very satisfied.","Packaging was neat, will reorder.","Consultation was thorough and helpful."])
        : pick(["Delivery took longer than expected.","One item was missing from the package.","Would like faster response on WhatsApp.","Packaging could be better, bottle was loose."]),
      sentiment: overall >= 4 ? "Positive" : overall === 3 ? "Neutral" : "Negative",
    });
  });

  // ---------- Follow-ups -----------------------------------------------------
  const followUps = [];
  patients.forEach((p) => {
    if (!p.lastConsultDate) return;
    const courseDays = p.currentPrescription ? p.currentPrescription.courseLengthDays : 30;
    const expectedFollowUp = new Date(p.lastConsultDate); expectedFollowUp.setDate(expectedFollowUp.getDate() + courseDays);
    const dueInDays = Math.round((expectedFollowUp - NOW) / 86400000);
    if (dueInDays <= 10 && dueInDays >= -45 && !p.nextConsultDate) {
      const reason = dueInDays < 0
        ? pick(["Medicine course completed — treatment review due","No follow-up booked after last consultation","Patient reported unresolved symptoms at last visit"])
        : pick(["Medicine course ending soon","Scheduled treatment review","Adherence check recommended"]);
      followUps.push({
        id: uid("FU"), patientId: p.id, patientName: p.name, phone: p.phone,
        reason, dueDate: expectedFollowUp,
        status: dueInDays < 0 ? "Overdue" : dueInDays <= 2 ? "Due today/soon" : "Upcoming",
        overdueDays: dueInDays < 0 ? -dueInDays : 0,
        suggestedMessage: `Hi ${p.name.split(" ")[0]}, it's been a while since your last visit for ${p.chiefComplaints[0].toLowerCase()}. Shall I book a follow-up with Vaidya this week?`,
        lastResponded: chance(0.3),
      });
    }
  });
  followUps.sort((a, b) => b.overdueDays - a.overdueDays);

  // Refill predictions
  const refills = [];
  pickN(patients.filter(p => p.currentPrescription), 26).forEach((p) => {
    const rx = p.currentPrescription;
    const startDate = rx.date;
    const endDate = new Date(startDate); endDate.setDate(endDate.getDate() + rx.courseLengthDays);
    const daysLeft = Math.round((endDate - NOW) / 86400000);
    if (daysLeft <= 10 && daysLeft >= -10) {
      refills.push({
        id: uid("REF"), patientId: p.id, patientName: p.name,
        medicines: rx.items.map(i => i.name), daysLeft,
        message: daysLeft >= 0 ? `Likely refill due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.` : `Refill was likely due ${-daysLeft} day(s) ago.`,
      });
    }
  });
  refills.sort((a, b) => a.daysLeft - b.daysLeft);

  // ---------- Inventory alerts ------------------------------------------
  const inventoryAlerts = [];
  medicines.forEach((m) => {
    const stock = stockFor(m.id);
    const avail = availableFor(m.id);
    const weeksLeft = avail / Math.max(1, m.avgWeeklyConsumption);
    if (avail <= 0) inventoryAlerts.push({ id: uid("IA"), medicineId: m.id, name: m.name, type: "Stockout risk", severity: "Critical", detail: `0 units available-to-sell. Avg weekly consumption ${m.avgWeeklyConsumption}.` });
    else if (weeksLeft < 1) inventoryAlerts.push({ id: uid("IA"), medicineId: m.id, name: m.name, type: "Stockout risk", severity: "Critical", detail: `Only ${weeksLeft.toFixed(1)} weeks of stock remaining at current consumption.` });
    else if (avail < m.reorderLevel) inventoryAlerts.push({ id: uid("IA"), medicineId: m.id, name: m.name, type: "Low stock", severity: "High", detail: `Available-to-sell (${avail}) below reorder level (${m.reorderLevel}).` });
    else if (weeksLeft > 20) inventoryAlerts.push({ id: uid("IA"), medicineId: m.id, name: m.name, type: "Overstock", severity: "Low", detail: `${weeksLeft.toFixed(0)} weeks of stock — capital tied up, consider slowing reorders.` });
    batchesFor(m.id).forEach((b) => {
      if (b.daysToExpiry <= 60 && b.daysToExpiry > 0 && b.qty > 0) inventoryAlerts.push({ id: uid("IA"), medicineId: m.id, name: m.name, type: "Expiry approaching", severity: b.daysToExpiry <= 30 ? "High" : "Medium", detail: `Batch ${b.batchNo}: ${b.qty} units expire in ${b.daysToExpiry} days.` });
      if (b.daysToExpiry <= 0 && b.qty > 0) inventoryAlerts.push({ id: uid("IA"), medicineId: m.id, name: m.name, type: "Expired stock", severity: "Critical", detail: `Batch ${b.batchNo}: ${b.qty} units past expiry — remove from sellable inventory.` });
    });
    if (m.trend === "rising" && chance(0.5)) inventoryAlerts.push({ id: uid("IA"), medicineId: m.id, name: m.name, type: "Unusual consumption", severity: "Medium", detail: `Consumption trending up — ${int(15,45)}% above 8-week average.` });
    if (m.trend === "falling" && chance(0.4)) inventoryAlerts.push({ id: uid("IA"), medicineId: m.id, name: m.name, type: "Slow-moving inventory", severity: "Low", detail: `Sell-through slowing — ${int(15,40)}% below 8-week average.` });
  });
  const supplierDelay = SUPPLIERS.filter(s => s.onTimeRate < 0.85);
  supplierDelay.forEach(s => inventoryAlerts.push({ id: uid("IA"), medicineId: null, name: s.name, type: "Supplier delay", severity: "Medium", detail: `On-time delivery rate ${(s.onTimeRate*100).toFixed(0)}% — below 85% target, avg lead time ${s.leadTimeDays} days.` }));

  // Replenishment recommendations (top few most urgent)
  const replenishment = medicines
    .map((m) => {
      const avail = availableFor(m.id);
      const supplier = SUPPLIERS.find(s => s.id === m.supplierId);
      const projectedStockoutDays = Math.round((avail / Math.max(1, m.avgWeeklyConsumption)) * 7);
      return { medicine: m, avail, supplier, projectedStockoutDays };
    })
    .filter(x => x.projectedStockoutDays <= 21)
    .sort((a, b) => a.projectedStockoutDays - b.projectedStockoutDays)
    .map(x => ({
      id: uid("REPL"), medicineId: x.medicine.id, name: x.medicine.name,
      currentStock: x.avail, avgWeeklyConsumption: x.medicine.avgWeeklyConsumption,
      supplier: x.supplier.name, leadTimeDays: x.supplier.leadTimeDays,
      projectedStockoutDays: x.projectedStockoutDays,
      recommendedQty: x.medicine.reorderQty,
      status: "Awaiting Vaidya/Manager approval",
    }));

  // ---------- Revenue transactions (90 days) --------------------------------
  const revenueDaily = [];
  for (let d = 89; d >= 0; d--) {
    const date = daysAgo(d);
    const dow = date.getDay();
    const base = (dow === 0 ? 0.65 : 1) * int(14000, 26000);
    const consultRevenue = Math.round(base * 0.38 * (0.85 + R() * 0.3));
    const medicineRevenue = Math.round(base * 0.62 * (0.85 + R() * 0.3));
    revenueDaily.push({ date, consultRevenue, medicineRevenue, total: consultRevenue + medicineRevenue });
  }
  const todayRevenue = revenueDaily[revenueDaily.length - 1].total;
  const monthRevenue = revenueDaily.slice(-30).reduce((s, r) => s + r.total, 0);
  const prevMonthRevenue = revenueDaily.slice(-60, -30).reduce((s, r) => s + r.total, 0);

  // ---------- AI Agents -----------------------------------------------------
  const aiAgents = [
    { id: "AG-01", name: "Patient Query Agent", scope: "Classifies inbound WhatsApp messages, drafts responses for Vaidya approval", status: "Active", tasksCompleted: 1834, awaitingApproval: 14, errors: 2, escalations: 6, successRate: 96.4, humanInterventionRate: 100 },
    { id: "AG-02", name: "Clinical Knowledge Agent", scope: "Retrieves classical/clinic references (RAG) for clinical questions", status: "Active", tasksCompleted: 962, awaitingApproval: 9, errors: 1, escalations: 3, successRate: 97.1, humanInterventionRate: 100 },
    { id: "AG-03", name: "Appointment Agent", scope: "Offers slots, confirms bookings, sends reminders", status: "Active", tasksCompleted: 611, awaitingApproval: 5, errors: 0, escalations: 1, successRate: 99.0, humanInterventionRate: 8 },
    { id: "AG-04", name: "Follow-up Agent", scope: "Identifies due/overdue follow-ups, drafts reminder messages", status: "Active", tasksCompleted: 428, awaitingApproval: followUps.length, errors: 0, escalations: 0, successRate: 98.2, humanInterventionRate: 100 },
    { id: "AG-05", name: "Inventory Agent", scope: "Monitors stock levels, expiry, consumption anomalies", status: "Active", tasksCompleted: 205, awaitingApproval: 0, errors: 0, escalations: 2, successRate: 99.5, humanInterventionRate: 0 },
    { id: "AG-06", name: "Replenishment Agent", scope: "Forecasts demand, drafts purchase recommendations", status: "Active", tasksCompleted: 96, awaitingApproval: replenishment.length, errors: 0, escalations: 0, successRate: 95.8, humanInterventionRate: 100 },
    { id: "AG-07", name: "Shipment Agent", scope: "Syncs tracking status, surfaces delayed/exception shipments", status: "Active", tasksCompleted: 512, awaitingApproval: 0, errors: 3, escalations: 4, successRate: 94.7, humanInterventionRate: 5 },
    { id: "AG-08", name: "Delivery Exception Agent", scope: "Triages post-delivery discrepancy reports, assigns owner", status: "Active", tasksCompleted: 63, awaitingApproval: deliveryExceptions.filter(d=>d.status==="Open").length, errors: 0, escalations: 1, successRate: 96.9, humanInterventionRate: 40 },
    { id: "AG-09", name: "Patient Engagement Agent", scope: "Flags churn-risk / high-value patients, drafts outreach", status: "Active", tasksCompleted: 341, awaitingApproval: 11, errors: 0, escalations: 0, successRate: 97.6, humanInterventionRate: 100 },
    { id: "AG-10", name: "Business Intelligence Agent", scope: "Computes KPIs, trends, and anomaly commentary", status: "Active", tasksCompleted: 180, awaitingApproval: 0, errors: 0, escalations: 0, successRate: 99.8, humanInterventionRate: 0 },
    { id: "AG-11", name: "Feedback / Sentiment Agent", scope: "Scores feedback sentiment, detects recurring complaint themes", status: "Active", tasksCompleted: 274, awaitingApproval: 0, errors: 1, escalations: 0, successRate: 97.3, humanInterventionRate: 0 },
    { id: "AG-12", name: "Founder Business Copilot", scope: "Answers natural-language business questions with explainable reasoning", status: "Active", tasksCompleted: 88, awaitingApproval: 0, errors: 0, escalations: 0, successRate: 98.9, humanInterventionRate: 0 },
  ];

  // ---------- Audit trail / AI interactions (human-in-the-loop) -----------
  const auditTrail = [];
  messages.filter(m => m.status === "Approved & sent").slice(0, 40).forEach((m) => {
    auditTrail.push({
      id: uid("AUD"), patientId: m.patientId, patientName: m.patientName,
      patientMessage: m.text, aiClassification: m.classification,
      aiSources: m.classification === "Urgent clinical concern" ? [] : pickN(KB_SOURCES.filter(k=>k.verified), int(0,2)).map(k => k.title),
      aiSuggestion: m.suggestedResponse,
      vaidyaDecision: pick(["Approved as-is","Approved with edits","Approved as-is","Approved as-is"]),
      finalResponse: m.suggestedResponse,
      timestamp: m.timestamp,
      approvedBy: pick(["Vaidhya Nandini Menon","Vaidhya Nandini Menon","Anu Pillai (Clinic Manager)"]),
    });
  });
  auditTrail.sort((a, b) => b.timestamp - a.timestamp);

  // ---------- Patient retention flags ---------------------------------------
  const retention = [];
  patients.forEach((p) => {
    if (p.tags.includes("churn-risk")) {
      retention.push({ id: uid("RET"), patientId: p.id, patientName: p.name, flag: "At risk of churn", why: `No consultation or order activity in ${p.daysSinceLastConsult} days despite earlier active engagement.`, action: "Send personalised check-in + offer follow-up slot", message: `Hi ${p.name.split(" ")[0]}, we haven't heard from you in a while — how has your ${p.chiefComplaints[0].toLowerCase()} been? Happy to schedule a quick follow-up.` });
    }
    if (p.tags.includes("vip")) {
      retention.push({ id: uid("RET"), patientId: p.id, patientName: p.name, flag: "High-value patient", why: `${prescriptions.filter(r=>r.patientId===p.id).length} completed prescriptions and consistent reorders over ${Math.round(p._firstConsultDaysAgo/30)} months.`, action: "Priority scheduling + loyalty consideration", message: `Hi ${p.name.split(" ")[0]}, thank you for continuing your Ayurvedic care with us — wanted to check if you'd like to plan your next wellness review.` });
    }
  });
  followUps.filter(f => f.status === "Overdue").slice(0, 15).forEach((f) => {
    retention.push({ id: uid("RET"), patientId: f.patientId, patientName: f.patientName, flag: "Follow-up overdue", why: f.reason, action: "Send WhatsApp follow-up reminder", message: f.suggestedMessage });
  });

  // ---------- Complaints (subset of feedback + delivery exceptions) ---------
  const complaints = [
    ...feedback.filter(f => f.sentiment === "Negative").map(f => ({ id: uid("CMP"), patientId: f.patientId, patientName: f.patientName, type: "Service feedback", detail: f.comment, date: f.date, status: chance(0.5) ? "Resolved" : "Open" })),
    ...deliveryExceptions.map(d => ({ id: uid("CMP"), patientId: d.patientId, patientName: d.patientName, type: "Delivery: " + d.issueType, detail: `Order ${d.orderId} — ${d.issueType}`, date: d.reportedDate, status: d.status === "Resolved" ? "Resolved" : "Open" })),
  ].sort((a, b) => b.date - a.date);

  // ---------- Notifications / Alerts ----------------------------------------
  const alerts = [];
  messages.filter(m => m.redFlag).forEach(m => alerts.push({ id: uid("ALT"), level: "critical", category: "Clinical", text: `Critical clinical query — ${m.patientName}`, time: m.timestamp }));
  shipments.filter(s => s.status === "Delivery attempted" || s.status === "Returned").forEach(s => alerts.push({ id: uid("ALT"), level: "warning", category: "Shipment", text: `Shipment issue — ${s.patientName} (${s.trackingNo})`, time: s.expectedDelivery }));
  inventoryAlerts.filter(a => a.severity === "Critical").forEach(a => alerts.push({ id: uid("ALT"), level: "warning", category: "Inventory", text: `${a.type} — ${a.name}`, time: NOW }));
  followUps.filter(f => f.status === "Overdue").forEach(f => alerts.push({ id: uid("ALT"), level: "info", category: "Follow-up", text: `Follow-up overdue — ${f.patientName}`, time: f.dueDate }));
  appointments.filter(a => a.status === "Pending confirmation").forEach(a => alerts.push({ id: uid("ALT"), level: "info", category: "Appointment", text: `Appointment pending confirmation — ${a.patientName}`, time: a.date }));
  feedback.filter(f=>f.sentiment==="Positive").slice(0,6).forEach(f => alerts.push({id: uid("ALT"), level:"good", category:"Business", text:`Positive feedback received — ${f.patientName}`, time: f.date}));
  shipments.filter(s=>s.status==="Delivered").slice(0,6).forEach(s => alerts.push({id: uid("ALT"), level:"good", category:"Shipment", text:`Delivery completed — ${s.patientName}`, time: s.actualDelivery}));
  alerts.sort((a,b) => b.time - a.time);

  // ---------- Knowledge docs (clinic uploads) --------------------------------
  const knowledgeDocs = [
    { id: uid("KDOC"), title: "Agnimandya (weak digestion) — clinic assessment protocol", category: "Clinic SOP", uploadedBy: "Vaidhya Nandini Menon", date: daysAgo(210), verified: true },
    { id: uid("KDOC"), title: "Standard dosing & anupana reference — clinic formulary", category: "Clinic formulary", uploadedBy: "Vaidhya Nandini Menon", date: daysAgo(180), verified: true },
    { id: uid("KDOC"), title: "Telehealth consultation consent form", category: "Consent form", uploadedBy: "Anu Pillai (Manager)", date: daysAgo(300), verified: true },
    { id: uid("KDOC"), title: "Shipping & delivery policy (India Post / courier)", category: "Policy", uploadedBy: "Anu Pillai (Manager)", date: daysAgo(150), verified: true },
    { id: uid("KDOC"), title: "Refund & replacement policy", category: "Policy", uploadedBy: "Anu Pillai (Manager)", date: daysAgo(150), verified: true },
    { id: uid("KDOC"), title: "Patient education — Ashwagandha, uses & precautions", category: "Patient education", uploadedBy: "Vaidhya Nandini Menon", date: daysAgo(90), verified: true },
    { id: uid("KDOC"), title: "PCOS management — approved treatment protocol", category: "Treatment protocol", uploadedBy: "Vaidhya Nandini Menon", date: daysAgo(60), verified: true },
    { id: uid("KDOC"), title: "Regional practitioner notes — Kutajarishta in IBS", category: "Unverified upload", uploadedBy: "Guest contributor", date: daysAgo(12), verified: false },
  ];

  // ---------- KPI computation helpers ----------------------------------------
  function computeKPIs() {
    const todayKey = NOW.toISOString().slice(0, 10);
    const todaysAppts = appointments.filter(a => a.dayKey === todayKey);
    const waitingForResponse = conversations.filter(c => c.lastMessage.status === "Pending Vaidya approval" || c.lastMessage.status === "Escalated — awaiting Vaidya").length;
    const newQueries = messages.filter(m => m.classification === "New patient inquiry" && (NOW - m.timestamp) < 86400000 * 2).length;
    const followUpsDueToday = followUps.filter(f => f.status !== "Upcoming").length;
    const medsToReplenish = replenishment.length;
    const ordersAwaitingDispatch = orders.filter(o => ["Prescription received","Order created","Payment confirmed","Picking","Packing"].includes(o.stage)).length;
    const shipmentsInTransit = shipments.filter(s => ["Dispatched","In transit","Arrived at destination","Out for delivery"].includes(s.status)).length;
    const deliveryExceptionsCount = deliveryExceptions.filter(d => d.status !== "Resolved").length;
    const unresolvedComplaints = complaints.filter(c => c.status === "Open").length;
    const consultationsBooked = appointments.length;
    const conversions = orders.length;
    const conversionRate = Math.round((conversions / Math.max(1,consultationsBooked)) * 100);
    return {
      todaysAppointments: todaysAppts.length,
      waitingForResponse, newQueries, followUpsDueToday, medsToReplenish,
      ordersAwaitingDispatch, shipmentsInTransit, deliveryExceptionsCount, unresolvedComplaints,
      todayRevenue, monthRevenue,
      revenueGrowthPct: Math.round(((monthRevenue - prevMonthRevenue) / Math.max(1,prevMonthRevenue)) * 100),
      conversionRate: Math.min(96, Math.max(38, conversionRate)),
    };
  }
  const kpis = computeKPIs();

  // ---------- AI Priority Queue -----------------------------------------------
  const priorityQueue = [];
  messages.filter(m => m.redFlag).forEach(m => priorityQueue.push({
    id: uid("PRI"), priority: "Critical", category: "Clinical",
    title: `${m.patientName} — potential clinical emergency`,
    reason: "Message classified as Urgent clinical concern by red-flag screening. Requires immediate Vaidya review; AI has not generated self-care advice.",
    patientId: m.patientId, link: { module: "whatsapp", id: m.convId },
  }));
  followUps.filter(f => f.status === "Overdue" && f.overdueDays > 20).slice(0, 4).forEach(f => priorityQueue.push({
    id: uid("PRI"), priority: "High", category: "Follow-up",
    title: `${f.patientName} — follow-up overdue by ${f.overdueDays} days`,
    reason: f.reason + ". Extended gaps after course completion raise risk of treatment discontinuation.",
    patientId: f.patientId, link: { module: "followups", id: f.id },
  }));
  shipments.filter(s => s.status === "Delivery attempted" || s.status==="Returned").slice(0, 3).forEach(s => priorityQueue.push({
    id: uid("PRI"), priority: "High", category: "Shipment",
    title: `${s.patientName} — shipment ${s.status.toLowerCase()}`,
    reason: `Tracking ${s.trackingNo} via ${s.courier} shows "${s.status}". Patient may be without medicines; proactive outreach recommended.`,
    patientId: s.patientId, link: { module: "shipments", id: s.id },
  }));
  inventoryAlerts.filter(a => a.severity === "Critical").slice(0, 3).forEach(a => priorityQueue.push({
    id: uid("PRI"), priority: "Critical", category: "Inventory",
    title: `${a.name} — ${a.type.toLowerCase()}`,
    reason: a.detail + " Active prescriptions may be affected if not replenished.",
    link: { module: "inventory", id: a.medicineId },
  }));
  feedback.filter(f => f.sentiment === "Negative" && f.deliveryRating <= 2).slice(0, 3).forEach(f => priorityQueue.push({
    id: uid("PRI"), priority: "Medium", category: "Feedback",
    title: `${f.patientName} — unhappy with delivery experience`,
    reason: `Delivery rating ${f.deliveryRating}/5. Comment: "${f.comment}". Risk of repeat-order attrition if unaddressed.`,
    patientId: f.patientId, link: { module: "feedback", id: f.id },
  }));
  appointments.filter(a => a.status === "Pending confirmation" && a.date - NOW < 86400000 * 2 && a.date - NOW > 0).slice(0, 3).forEach(a => priorityQueue.push({
    id: uid("PRI"), priority: "Medium", category: "Appointment",
    title: `${a.patientName} — appointment unconfirmed, within 48h`,
    reason: `Booked via ${a.bookedVia} but not yet confirmed. Risk of no-show if unconfirmed close to slot time.`,
    patientId: a.patientId, link: { module: "appointments", id: a.id },
  }));
  conversations.filter(c => c.lastMessage.status === "Pending Vaidya approval" && (NOW - c.lastMessage.timestamp) > 3 * 3600000).slice(0, 4).forEach(c => priorityQueue.push({
    id: uid("PRI"), priority: "Medium", category: "WhatsApp",
    title: `${c.patientName} — response pending Vaidya approval for ${Math.round((NOW-c.lastMessage.timestamp)/3600000)}h`,
    reason: `Classified as "${c.lastMessage.classification}". AI has prepared a draft; awaiting approval to send.`,
    patientId: c.patientId, link: { module: "whatsapp", id: c.id },
  }));
  refills.filter(r => r.daysLeft <= 3 && r.daysLeft >= 0).slice(0, 3).forEach(r => priorityQueue.push({
    id: uid("PRI"), priority: "Low", category: "Refill",
    title: `${r.patientName} — repeat medicine likely needed in ${r.daysLeft}d`,
    reason: `Prescription course for ${r.medicines.join(", ")} is ending. Any change requires Vaidya review.`,
    patientId: r.patientId, link: { module: "followups", id: r.id },
  }));
  const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  priorityQueue.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  // ---------- Morning briefing groups (today's actionable queue — tight, not full backlog) ---
  const last24h = 24 * 3600000;
  const briefing = {
    clinical: messages.filter(m => m.redFlag && (NOW - m.timestamp) < last24h).length
      + conversations.filter(c => c.lastMessage.status === "Pending Vaidya approval" && (NOW - c.lastMessage.timestamp) < last24h
          && ["Existing patient query","Medicine question","Prescription question","Side-effect concern"].includes(c.lastMessage.classification)).length,
    appointments: appointments.filter(a => a.status === "Pending confirmation" && a.date - NOW < 2 * 86400000 && a.date - NOW >= 0).length
      + kpis.todaysAppointments,
    followups: followUps.filter(f => f.status !== "Upcoming").length,
    inventory: inventoryAlerts.filter(a => a.severity === "Critical").length,
    shipments: deliveryExceptions.filter(d => d.status === "Open" && (NOW - d.reportedDate) < 5 * 86400000).length
      + shipments.filter(s => (s.status === "Delivery attempted" || s.status === "Returned") && (NOW - s.expectedDelivery) < 3 * 86400000).length,
    business: 1,
  };
  briefing.total = briefing.clinical + briefing.appointments + briefing.followups + briefing.inventory + briefing.shipments + briefing.business;

  // ---------- expose ------------------------------------------------------
  window.AYUR = {
    meta: { generatedAt: NOW, isDemo: true, clinicName: "Arogyawardhak Aushdhalay", vaidya: "Vaidhya Nandini Menon", vaidyaCreds: "BAMS, MD (Ayurveda)" },
    helpers: { fmtDate, fmtDateTime, fmtTime, fmtINR, timeAgo, daysAgo, daysFromNow, uid, pick },
    SUPPLIERS, COURIERS, KB_SOURCES,
    medicines, batches, batchesFor, stockFor, availableFor,
    patients, patientById, consultations, prescriptions,
    appointments, conversations, messages,
    orders, shipments, deliveryExceptions,
    feedback, followUps, refills,
    inventoryAlerts, replenishment,
    revenueDaily, todayRevenue, monthRevenue, prevMonthRevenue,
    aiAgents, auditTrail, retention, complaints, alerts, knowledgeDocs,
    kpis, priorityQueue, briefing,
  };
})();
