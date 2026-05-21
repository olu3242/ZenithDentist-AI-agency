const STORAGE_KEY = "zenith-ai-e2e-state-v1";

const seedState = {
  practice: {
    name: "Dr. Chen Dental Studio",
    location: "Austin, TX",
    chairs: 6,
    avgValue: 310,
    monthlyAppointments: 420,
    noShowPct: 18,
    recallLapsedPct: 28,
    adminHours: 5
  },
  leads: [],
  patients: [
    { id: "p1", firstName: "Sarah", lastName: "Rivera", status: "active", lastVisit: "2026-05-01", recallDue: "2026-11-01", value: 340, pipelineStage: "scheduled", phone: "555-0101", email: "sarah@example.test" },
    { id: "p2", firstName: "Marcus", lastName: "Thompson", status: "scheduled", lastVisit: "2025-11-12", recallDue: "2026-05-24", value: 1240, pipelineStage: "scheduled", phone: "555-0102", email: "marcus@example.test" },
    { id: "p3", firstName: "Angela", lastName: "Morris", status: "lapsed", lastVisit: "2025-08-15", recallDue: "2026-02-15", value: 410, pipelineStage: "lapsed", phone: "555-0103", email: "angela@example.test" },
    { id: "p4", firstName: "Robert", lastName: "Hayes", status: "lapsed", lastVisit: "2025-09-18", recallDue: "2026-03-18", value: 390, pipelineStage: "outreach", phone: "555-0104", email: "robert@example.test" },
    { id: "p5", firstName: "Linda", lastName: "Park", status: "lapsed", lastVisit: "2025-06-04", recallDue: "2025-12-04", value: 520, pipelineStage: "responded", phone: "555-0105", email: "linda@example.test" },
    { id: "p6", firstName: "David", lastName: "Kim", status: "scheduled", lastVisit: "2025-07-20", recallDue: "2026-01-20", value: 280, pipelineStage: "scheduled", phone: "555-0106", email: "david@example.test" },
    { id: "p7", firstName: "Jennifer", lastName: "Liu", status: "active", lastVisit: "2026-05-15", recallDue: "2026-11-15", value: 420, pipelineStage: "scheduled", phone: "555-0107", email: "jennifer@example.test" }
  ],
  appointments: [
    { id: "a1", patientId: "p1", scheduledAt: "2026-05-21T09:00:00", procedure: "Hygiene", status: "confirmed", value: 340 },
    { id: "a2", patientId: "p2", scheduledAt: "2026-05-21T10:30:00", procedure: "Crown prep", status: "pending", value: 1240 },
    { id: "a3", patientId: "p7", scheduledAt: "2026-05-21T13:00:00", procedure: "New patient exam", status: "confirmed", value: 420 },
    { id: "a4", patientId: "p6", scheduledAt: "2026-05-22T08:30:00", procedure: "Recall cleaning", status: "confirmed", value: 280 }
  ],
  outreach: [
    { id: "o1", patientId: "p4", channel: "sms", type: "recall", message: "Recall text sent", status: "delivered", createdAt: "2026-05-20T14:00:00" },
    { id: "o2", patientId: "p5", channel: "email", type: "reactivation", message: "Reactivation email sent", status: "responded", createdAt: "2026-05-20T15:30:00" }
  ],
  reviews: [
    { id: "r1", patientId: "p1", rating: 5, platform: "Google", published: true, createdAt: "2026-05-18" },
    { id: "r2", patientId: "p7", rating: 5, platform: "Google", published: false, createdAt: "2026-05-20" }
  ],
  rules: [
    { id: "rule-reminders", name: "Appointment Reminders", description: "Send 48hr, 24hr, and 2hr reminders for pending appointments.", enabled: true },
    { id: "rule-recall", name: "Recall Recovery", description: "Move overdue recall patients into segmented outreach.", enabled: true },
    { id: "rule-reviews", name: "Review Requests", description: "Request reviews after completed appointments.", enabled: true },
    { id: "rule-no-show", name: "No-Show Rescue", description: "Follow up immediately after missed appointments.", enabled: true },
    { id: "rule-intake", name: "New Patient Intake", description: "Send intake paperwork before first appointments.", enabled: false },
    { id: "rule-roi", name: "ROI Digest", description: "Prepare weekly revenue recovery summaries.", enabled: true }
  ],
  events: [
    { id: "e1", type: "system", message: "48hr reminders queued for 3 appointments.", createdAt: "2026-05-20T09:20:00" },
    { id: "e2", type: "system", message: "Recall segment refreshed: 4 lapsed patients found.", createdAt: "2026-05-20T10:05:00" }
  ],
  trend: [
    { month: "Dec", revenue: 7100 },
    { month: "Jan", revenue: 9400 },
    { month: "Feb", revenue: 11200 },
    { month: "Mar", revenue: 13400 },
    { month: "Apr", revenue: 14100 },
    { month: "May", revenue: 15600 }
  ]
};

let state = loadState();
let dialogMode = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
const shortDate = value => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(seedState);
  try {
    return { ...structuredClone(seedState), ...JSON.parse(stored) };
  } catch {
    return structuredClone(seedState);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function id(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function patientName(patient) {
  return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient";
}

function getPatient(patientId) {
  return state.patients.find(patient => patient.id === patientId);
}

function calculateROI(input = state.practice) {
  const noShowAppts = input.monthlyAppointments * (input.noShowPct / 100);
  const monthlyNoShowLoss = noShowAppts * input.avgValue;
  const recallPatients = input.monthlyAppointments * 0.15;
  const monthlyRecallLoss = recallPatients * ((input.recallLapsedPct || 28) / 100) * input.avgValue;
  const monthlyAdminCost = input.adminHours * 22 * 22;
  const totalMonthlyLeakage = monthlyNoShowLoss + monthlyRecallLoss + monthlyAdminCost;
  const recoverableMonthly = (monthlyNoShowLoss * 0.4) + (monthlyRecallLoss * 0.25) + (monthlyAdminCost * 0.6);
  return {
    noShowAppts,
    monthlyNoShowLoss,
    monthlyRecallLoss,
    monthlyAdminCost,
    totalMonthlyLeakage,
    recoverableMonthly,
    annualRecoverable: recoverableMonthly * 12
  };
}

function metrics() {
  const completed = state.appointments.filter(a => a.status === "completed").length;
  const confirmed = state.appointments.filter(a => a.status === "confirmed").length;
  const pending = state.appointments.filter(a => a.status === "pending").length;
  const scheduledPatients = state.patients.filter(p => p.pipelineStage === "scheduled").length;
  const responded = state.outreach.filter(o => o.status === "responded").length;
  const roi = calculateROI();
  return {
    recovered: state.trend.at(-1).revenue + completed * state.practice.avgValue,
    recoverable: roi.recoverableMonthly,
    lapsed: state.patients.filter(p => p.status === "lapsed").length,
    scheduledPatients,
    confirmed,
    pending,
    outreach: state.outreach.length,
    responded,
    reviewAverage: averageReview()
  };
}

function averageReview() {
  if (!state.reviews.length) return 0;
  return state.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / state.reviews.length;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function routeTo(route) {
  $$(".view").forEach(view => view.classList.toggle("active", view.id === `view-${route}`));
  $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.route === route));
  const view = $(`#view-${route}`);
  $("#routeTitle").textContent = view?.dataset.title || "Zenith AI";
  $("#routeEyebrow").textContent = view?.dataset.eyebrow || "Workspace";
  location.hash = route;
  render();
}

function render() {
  $("#practiceName").textContent = state.practice.name;
  $("#practiceMeta").textContent = `${state.practice.location} - ${state.practice.chairs} chairs`;
  renderROIResult();
  renderHomeMetrics();
  renderDashboard();
  renderPatients();
  renderAppointments();
  renderPipeline();
  renderOutreach();
  renderAutomation();
  renderReviews();
  renderSettings();
}

function metricCard(label, value, delta) {
  return `<article class="metric-card"><small>${label}</small><strong>${value}</strong><span>${delta}</span></article>`;
}

function renderHomeMetrics() {
  const roi = calculateROI();
  $("#homeMetrics").innerHTML = [
    metricCard("Monthly leakage", money(roi.totalMonthlyLeakage), "Current estimate"),
    metricCard("Recoverable monthly", money(roi.recoverableMonthly), "Target impact"),
    metricCard("Annual upside", money(roi.annualRecoverable), "12 month view"),
    metricCard("Captured leads", state.leads.length, "From ROI form")
  ].join("");
}

function renderROIResult() {
  const form = $("#leadForm");
  const input = {
    monthlyAppointments: Number(form.monthlyAppointments.value || state.practice.monthlyAppointments),
    noShowPct: Number(form.noShowPct.value || state.practice.noShowPct),
    avgValue: Number(form.avgValue.value || state.practice.avgValue),
    adminHours: Number(form.adminHours.value || state.practice.adminHours),
    recallLapsedPct: state.practice.recallLapsedPct
  };
  const roi = calculateROI(input);
  $("#roiResult").textContent = `${money(roi.recoverableMonthly)} recoverable per month, ${money(roi.annualRecoverable)} per year.`;
}

function renderDashboard() {
  const m = metrics();
  $("#dashboardMetrics").innerHTML = [
    metricCard("Revenue recovered", money(m.recovered), "+12% vs last month"),
    metricCard("Patients recovered", m.scheduledPatients, `${m.responded} responded`),
    metricCard("Pending confirmations", m.pending, `${m.confirmed} confirmed`),
    metricCard("Outreach sent", m.outreach, "All channels")
  ].join("");

  const max = Math.max(...state.trend.map(item => item.revenue));
  $("#revenueChart").innerHTML = state.trend.map(item => `
    <div class="bar" style="height:${Math.max(18, (item.revenue / max) * 220)}px">
      <span>${money(item.revenue)}</span><small>${item.month}</small>
    </div>
  `).join("");

  const today = state.appointments.slice(0, 4);
  $("#todayList").innerHTML = today.map(appt => {
    const patient = getPatient(appt.patientId);
    return `<div class="list-item"><span><strong>${patientName(patient)}</strong><small>${formatTime(appt.scheduledAt)} - ${appt.procedure}</small></span><span class="badge ${appt.status}">${appt.status}</span></div>`;
  }).join("");

  $("#nextActions").innerHTML = buildNextActions().map(action => `
    <div class="action-item"><strong>${action.title}</strong><p>${action.body}</p><button class="secondary compact" type="button" data-action="${action.action}">${action.cta}</button></div>
  `).join("");
}

function buildNextActions() {
  const lapsed = state.patients.filter(p => p.status === "lapsed").length;
  const pending = state.appointments.filter(a => a.status === "pending").length;
  const completed = state.appointments.filter(a => a.status === "completed").length;
  return [
    { title: `${pending} appointments need confirmation`, body: "Send reminder outreach to reduce same-day cancellations.", action: "run-reminders", cta: "Send Reminders" },
    { title: `${lapsed} lapsed patients are recoverable`, body: "Move patients into the recall campaign and log first-touch outreach.", action: "run-recall", cta: "Start Recall" },
    { title: `${completed} completed visits can drive reviews`, body: "Generate review requests for completed appointments without a request logged.", action: "request-reviews", cta: "Request Reviews" }
  ];
}

function renderPatients() {
  const search = ($("#patientSearch")?.value || "").toLowerCase();
  const filter = $("#patientFilter")?.value || "all";
  const patients = state.patients.filter(patient => {
    const matchesSearch = patientName(patient).toLowerCase().includes(search) || patient.email.toLowerCase().includes(search);
    const matchesFilter = filter === "all" || patient.status === filter;
    return matchesSearch && matchesFilter;
  });
  $("#patientsTable").innerHTML = patients.map(patient => `
    <tr>
      <td><strong>${patientName(patient)}</strong><br><small>${patient.email}</small></td>
      <td><span class="badge ${patient.status}">${patient.status}</span></td>
      <td>${shortDate(patient.lastVisit)}</td>
      <td>${shortDate(patient.recallDue)}</td>
      <td>${money(patient.value)}</td>
      <td><div class="row-actions">
        <button type="button" data-action="send-patient" data-id="${patient.id}">Outreach</button>
        <button type="button" data-action="schedule-patient" data-id="${patient.id}">Schedule</button>
      </div></td>
    </tr>
  `).join("");
}

function renderAppointments() {
  $("#appointmentsTable").innerHTML = [...state.appointments]
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .map(appt => {
      const patient = getPatient(appt.patientId);
      return `
        <tr>
          <td>${shortDate(appt.scheduledAt)}<br><small>${formatTime(appt.scheduledAt)}</small></td>
          <td><strong>${patientName(patient)}</strong></td>
          <td>${appt.procedure}</td>
          <td><span class="badge ${appt.status}">${appt.status}</span></td>
          <td>${money(appt.value)}</td>
          <td><div class="row-actions">
            <button type="button" data-action="confirm-appt" data-id="${appt.id}">Confirm</button>
            <button type="button" data-action="complete-appt" data-id="${appt.id}">Complete</button>
            <button type="button" data-action="cancel-appt" data-id="${appt.id}">Cancel</button>
          </div></td>
        </tr>
      `;
    }).join("");
}

function renderPipeline() {
  const stages = [
    ["lapsed", "Lapsed"],
    ["outreach", "Outreach Sent"],
    ["responded", "Responded"],
    ["scheduled", "Scheduled"]
  ];
  $("#pipelineBoard").innerHTML = stages.map(([stage, label]) => {
    const cards = state.patients.filter(patient => patient.pipelineStage === stage);
    return `
      <section class="kanban-col">
        <div class="kanban-head"><strong>${label}</strong><span class="badge scheduled">${cards.length}</span></div>
        ${cards.map(patient => pipelineCard(patient, stage)).join("") || `<p class="eyebrow">No patients</p>`}
      </section>
    `;
  }).join("");
}

function pipelineCard(patient, stage) {
  const order = ["lapsed", "outreach", "responded", "scheduled"];
  const next = order[order.indexOf(stage) + 1];
  const prev = order[order.indexOf(stage) - 1];
  return `
    <article class="pipeline-card">
      <strong>${patientName(patient)}</strong>
      <small>Last visit ${shortDate(patient.lastVisit)} - ${money(patient.value)}</small>
      <div class="row-actions">
        ${prev ? `<button type="button" data-action="move-pipeline" data-id="${patient.id}" data-stage="${prev}">Back</button>` : ""}
        ${next ? `<button type="button" data-action="move-pipeline" data-id="${patient.id}" data-stage="${next}">Move</button>` : ""}
      </div>
    </article>
  `;
}

function renderOutreach() {
  const select = $("#outreachForm select[name='patientId']");
  select.innerHTML = state.patients.map(patient => `<option value="${patient.id}">${patientName(patient)}</option>`).join("");
  $("#outreachLog").innerHTML = [...state.outreach].reverse().map(item => {
    const patient = getPatient(item.patientId);
    return `<div class="event-item"><strong>${item.channel.toUpperCase()} - ${item.type} - ${patientName(patient)}</strong><small>${shortDate(item.createdAt)} - ${item.status}</small><p>${item.message}</p></div>`;
  }).join("");
}

function renderAutomation() {
  $("#automationRules").innerHTML = state.rules.map(rule => `
    <article class="rule-card">
      <strong>${rule.name}</strong>
      <small>${rule.description}</small>
      <button class="switch ${rule.enabled ? "on" : ""}" type="button" data-action="toggle-rule" data-id="${rule.id}" aria-label="Toggle ${rule.name}">
        <span></span>
      </button>
    </article>
  `).join("");
  $("#eventsLog").innerHTML = [...state.events].reverse().map(event => `<div class="event-item"><strong>${event.message}</strong><small>${shortDate(event.createdAt)}</small></div>`).join("");
}

function renderReviews() {
  const avg = averageReview();
  const published = state.reviews.filter(review => review.published).length;
  $("#reviewMetrics").innerHTML = [
    metricCard("Average rating", avg.toFixed(1), "Across requests"),
    metricCard("Requests sent", state.reviews.length, "This workspace"),
    metricCard("Published", published, "Public reviews"),
    metricCard("Pending", state.reviews.length - published, "Need follow-up")
  ].join("");

  $("#reviewsTable").innerHTML = state.reviews.map(review => {
    const patient = getPatient(review.patientId);
    return `<tr><td><strong>${patientName(patient)}</strong></td><td>${review.rating}/5</td><td>${review.platform}</td><td><span class="badge ${review.published ? "published" : "unpublished"}">${review.published ? "published" : "pending"}</span></td><td>${shortDate(review.createdAt)}</td></tr>`;
  }).join("");
}

function renderSettings() {
  const form = $("#settingsForm");
  form.name.value = state.practice.name;
  form.location.value = state.practice.location;
  form.chairs.value = state.practice.chairs;
  form.avgValue.value = state.practice.avgValue;
  form.monthlyAppointments.value = state.practice.monthlyAppointments;
}

function formatTime(value) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function addEvent(message) {
  state.events.push({ id: id("e"), type: "system", message, createdAt: new Date().toISOString() });
}

function logOutreach(patientId, type = "recall", channel = "sms", message = "") {
  const patient = getPatient(patientId);
  state.outreach.push({
    id: id("o"),
    patientId,
    channel,
    type,
    message: message || `Hi ${patient.firstName}, this is ${state.practice.name}. We would love to get you back on the calendar.`,
    status: type === "review" ? "delivered" : "sent",
    createdAt: new Date().toISOString()
  });
  if (patient.pipelineStage === "lapsed") patient.pipelineStage = "outreach";
}

function runReminders() {
  const pending = state.appointments.filter(appt => appt.status === "pending");
  pending.forEach(appt => logOutreach(appt.patientId, "reminder", "sms", "Appointment confirmation reminder sent."));
  addEvent(`Reminder automation sent ${pending.length} pending appointment messages.`);
  showToast(`Sent ${pending.length} reminder messages.`);
}

function runRecall() {
  const lapsed = state.patients.filter(patient => patient.status === "lapsed");
  lapsed.forEach(patient => logOutreach(patient.id, "recall", "sms"));
  addEvent(`Recall automation started for ${lapsed.length} lapsed patients.`);
  showToast(`Started recall for ${lapsed.length} patients.`);
}

function requestReviews() {
  const completed = state.appointments.filter(appt => appt.status === "completed");
  let created = 0;
  completed.forEach(appt => {
    const existing = state.reviews.some(review => review.patientId === appt.patientId);
    if (!existing) {
      state.reviews.push({ id: id("r"), patientId: appt.patientId, rating: 5, platform: "Google", published: false, createdAt: new Date().toISOString() });
      logOutreach(appt.patientId, "review", "sms", "Review request sent after completed visit.");
      created++;
    }
  });
  addEvent(`Review request automation created ${created} requests.`);
  showToast(`Created ${created} review requests.`);
}

function runAutomation() {
  if (state.rules.find(rule => rule.id === "rule-reminders")?.enabled) runReminders();
  if (state.rules.find(rule => rule.id === "rule-recall")?.enabled) runRecall();
  if (state.rules.find(rule => rule.id === "rule-reviews")?.enabled) requestReviews();
  persist();
  render();
}

function openRecordDialog(mode, patientId = "") {
  dialogMode = mode;
  const body = $("#dialogBody");
  const title = $("#dialogTitle");
  const help = $("#dialogHelp");
  if (mode === "patient") {
    title.textContent = "Add Patient";
    help.textContent = "Create a patient and place them in the lifecycle.";
    body.innerHTML = `
      <label>First name<input name="firstName" required></label>
      <label>Last name<input name="lastName" required></label>
      <label>Email<input name="email" type="email" required></label>
      <label>Phone<input name="phone" required></label>
      <label>Status<select name="status"><option>active</option><option>lapsed</option><option>scheduled</option></select></label>
      <label>Value<input name="value" type="number" min="1" value="${state.practice.avgValue}"></label>
    `;
  } else {
    title.textContent = "Add Appointment";
    help.textContent = "Schedule treatment and attach it to a patient.";
    body.innerHTML = `
      <label>Patient<select name="patientId">${state.patients.map(patient => `<option value="${patient.id}" ${patient.id === patientId ? "selected" : ""}>${patientName(patient)}</option>`).join("")}</select></label>
      <label>Date and time<input name="scheduledAt" type="datetime-local" required value="2026-05-24T09:00"></label>
      <label>Procedure<input name="procedure" required value="Recall cleaning"></label>
      <label>Value<input name="value" type="number" min="1" value="${state.practice.avgValue}"></label>
    `;
  }
  $("#recordDialog").showModal();
}

function saveRecord(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  if (dialogMode === "patient") {
    const status = form.get("status");
    state.patients.push({
      id: id("p"),
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      email: form.get("email"),
      phone: form.get("phone"),
      status,
      lastVisit: "2026-01-15",
      recallDue: "2026-07-15",
      value: Number(form.get("value")),
      pipelineStage: status === "lapsed" ? "lapsed" : "scheduled"
    });
    showToast("Patient added.");
  } else {
    const patientId = form.get("patientId");
    state.appointments.push({
      id: id("a"),
      patientId,
      scheduledAt: form.get("scheduledAt"),
      procedure: form.get("procedure"),
      status: "pending",
      value: Number(form.get("value"))
    });
    const patient = getPatient(patientId);
    patient.status = "scheduled";
    patient.pipelineStage = "scheduled";
    showToast("Appointment added.");
  }
  $("#recordDialog").close();
  persist();
  render();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "zenith-ai-data.json";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Export ready.");
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = { ...structuredClone(seedState), ...JSON.parse(reader.result) };
      persist();
      render();
      showToast("Data imported.");
    } catch {
      showToast("Import failed. Use a Zenith AI JSON export.");
    }
  };
  reader.readAsText(file);
}

function handleAction(target) {
  const action = target.dataset.action;
  const idValue = target.dataset.id;
  if (!action) return false;

  if (action === "export") exportData();
  if (action === "open-lead") routeTo("home");
  if (action === "add-patient") openRecordDialog("patient");
  if (action === "add-appointment") openRecordDialog("appointment");
  if (action === "close-dialog") $("#recordDialog").close();
  if (action === "send-patient") {
    logOutreach(idValue);
    addEvent(`Manual outreach logged for ${patientName(getPatient(idValue))}.`);
    showToast("Outreach logged.");
  }
  if (action === "schedule-patient") openRecordDialog("appointment", idValue);
  if (action === "confirm-appt") updateAppointment(idValue, "confirmed");
  if (action === "complete-appt") updateAppointment(idValue, "completed");
  if (action === "cancel-appt") updateAppointment(idValue, "cancelled");
  if (action === "move-pipeline") {
    const patient = getPatient(idValue);
    patient.pipelineStage = target.dataset.stage;
    if (target.dataset.stage === "scheduled") patient.status = "scheduled";
    addEvent(`${patientName(patient)} moved to ${target.dataset.stage}.`);
    showToast("Pipeline updated.");
  }
  if (action === "toggle-rule") {
    const rule = state.rules.find(item => item.id === idValue);
    rule.enabled = !rule.enabled;
    showToast(`${rule.name} ${rule.enabled ? "enabled" : "disabled"}.`);
  }
  if (action === "run-reminders") runReminders();
  if (action === "run-recall") runRecall();
  if (action === "request-reviews") requestReviews();
  if (action === "run-automation") runAutomation();
  if (action === "clear-events") {
    state.events = [];
    showToast("Events cleared.");
  }
  if (action === "reset-data") {
    state = structuredClone(seedState);
    showToast("Demo data reset.");
  }
  persist();
  render();
  return true;
}

function updateAppointment(apptId, status) {
  const appt = state.appointments.find(item => item.id === apptId);
  if (!appt) return;
  appt.status = status;
  const patient = getPatient(appt.patientId);
  if (status === "completed") {
    patient.status = "active";
    patient.pipelineStage = "scheduled";
  }
  if (status === "cancelled") {
    logOutreach(appt.patientId, "no-show", "sms", "We missed you today. Reply to reschedule your visit.");
  }
  addEvent(`${patientName(patient)} appointment marked ${status}.`);
  showToast(`Appointment ${status}.`);
}

document.addEventListener("click", event => {
  const routeTarget = event.target.closest("[data-route]");
  if (routeTarget) {
    event.preventDefault();
    routeTo(routeTarget.dataset.route);
    return;
  }
  const actionTarget = event.target.closest("[data-action]");
  if (actionTarget) handleAction(actionTarget);
});

$("#leadForm").addEventListener("input", renderROIResult);
$("#leadForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const input = {
    practice: data.get("practice"),
    email: data.get("email"),
    monthlyAppointments: Number(data.get("monthlyAppointments")),
    noShowPct: Number(data.get("noShowPct")),
    avgValue: Number(data.get("avgValue")),
    adminHours: Number(data.get("adminHours")),
    recallLapsedPct: state.practice.recallLapsedPct
  };
  const roi = calculateROI(input);
  state.leads.push({ id: id("l"), ...input, roi, createdAt: new Date().toISOString() });
  addEvent(`New lead captured: ${input.practice} with ${money(roi.recoverableMonthly)} monthly recoverable revenue.`);
  persist();
  render();
  showToast("Lead captured and ROI saved.");
});

$("#outreachForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const patient = getPatient(data.get("patientId"));
  const message = data.get("message").replace("{{firstName}}", patient.firstName);
  logOutreach(patient.id, data.get("type"), data.get("channel"), message);
  addEvent(`Manual ${data.get("channel")} outreach sent to ${patientName(patient)}.`);
  persist();
  render();
  showToast("Outreach sent and logged.");
});

$("#settingsForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  state.practice = {
    ...state.practice,
    name: data.get("name"),
    location: data.get("location"),
    chairs: Number(data.get("chairs")),
    avgValue: Number(data.get("avgValue")),
    monthlyAppointments: Number(data.get("monthlyAppointments"))
  };
  persist();
  render();
  showToast("Settings saved.");
});

$("#recordForm").addEventListener("submit", saveRecord);
$("#patientSearch").addEventListener("input", renderPatients);
$("#patientFilter").addEventListener("change", renderPatients);
$("#importFile").addEventListener("change", event => {
  const [file] = event.target.files;
  if (file) importData(file);
  event.target.value = "";
});

window.addEventListener("hashchange", () => routeTo(location.hash.replace("#", "") || "home"));

routeTo(location.hash.replace("#", "") || "home");
