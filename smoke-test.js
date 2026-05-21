const fs = require("fs");
const vm = require("vm");

class Element {
  constructor(selector = "") {
    this.selector = selector;
    this.dataset = {};
    this.style = {};
    this.value = "";
    this.checked = false;
    this.files = [];
    this.classList = {
      add() {},
      remove() {},
      toggle() {}
    };
  }

  querySelector(selector) {
    return getElement(`${this.selector} ${selector}`);
  }

  querySelectorAll() {
    return [];
  }

  addEventListener() {}
  set textContent(value) { this._textContent = value; }
  get textContent() { return this._textContent || ""; }
  set innerHTML(value) { this._innerHTML = value; }
  get innerHTML() { return this._innerHTML || ""; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  click() {}
}

const elements = new Map();

function getElement(selector) {
  if (!elements.has(selector)) elements.set(selector, new Element(selector));
  return elements.get(selector);
}

const documentStub = {
  querySelector: getElement,
  querySelectorAll(selector) {
    if (selector === ".view") {
      return ["home", "dashboard", "patients", "appointments", "pipeline", "outreach", "automation", "reviews", "settings"].map(route => {
        const el = getElement(`#view-${route}`);
        el.id = `view-${route}`;
        el.dataset = { title: route, eyebrow: route };
        return el;
      });
    }
    if (selector === ".nav-item") {
      return ["home", "dashboard", "patients", "appointments", "pipeline", "outreach", "automation", "reviews", "settings"].map(route => {
        const el = getElement(`nav-${route}`);
        el.dataset = { route };
        return el;
      });
    }
    return [];
  },
  addEventListener() {},
  createElement() {
    return new Element("created");
  }
};

const leadForm = getElement("#leadForm");
Object.assign(leadForm, {
  practice: { value: "Test Practice" },
  email: { value: "test@example.test" },
  monthlyAppointments: { value: "300" },
  noShowPct: { value: "15" },
  avgValue: { value: "250" },
  adminHours: { value: "4" }
});

const settingsForm = getElement("#settingsForm");
Object.assign(settingsForm, {
  name: { value: "" },
  location: { value: "" },
  chairs: { value: "" },
  avgValue: { value: "" },
  monthlyAppointments: { value: "" }
});

const outreachForm = getElement("#outreachForm");
outreachForm.querySelector = selector => {
  if (selector === "select[name='patientId']") return getElement("#outreachPatientSelect");
  return getElement(selector);
};

const storage = new Map();
const context = {
  console,
  structuredClone,
  setTimeout,
  clearTimeout,
  window: {
    addEventListener() {},
    setTimeout,
    clearTimeout
  },
  document: documentStub,
  localStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value)
  },
  location: { hash: "" },
  Intl,
  Date,
  Math,
  Number,
  FormData: class FormData {
    constructor() {}
    get() { return ""; }
  },
  Blob: class Blob {},
  URL: {
    createObjectURL() { return "blob:smoke"; },
    revokeObjectURL() {}
  },
  FileReader: class FileReader {}
};

context.window.window = context.window;
vm.createContext(context);
vm.runInContext(fs.readFileSync("app.js", "utf8"), context, { filename: "app.js" });

if (!getElement("#homeMetrics").innerHTML.includes("Monthly leakage")) {
  throw new Error("App did not render home metrics during startup.");
}

if (!getElement("#patientsTable").innerHTML.includes("Sarah Rivera")) {
  throw new Error("App did not render seeded patient data.");
}

console.log("Smoke test passed.");
