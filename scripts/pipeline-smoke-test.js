/**
 * Revenue Conversion Pipeline HTTP Smoke Test
 * Tests critical endpoints for the conversion funnel.
 * Requires the Next.js server to be running (npm run dev or npm run start).
 */

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
let passed = 0;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗  ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, ok: res.ok, json, text };
}

async function run() {
  console.log(`\nZenith Revenue Pipeline Smoke Test — ${BASE}\n`);

  // ── Homepage ──────────────────────────────────────────────────────────────
  await check("Homepage renders (200)", async () => {
    const res = await fetch(BASE);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // ── CTA Attribution ───────────────────────────────────────────────────────
  await check("POST /api/analytics/cta — accepts CTA event", async () => {
    const r = await fetchJson(`${BASE}/api/analytics/cta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "hero_cta",
        sessionId: "smoke-session-001",
        page: "/",
        utmSource: "smoke_test",
        utmMedium: "automated"
      })
    });
    assert(r.status === 200 || r.status === 201, `Expected 2xx, got ${r.status}`);
    assert(r.json?.ok === true || r.json?.ok === false, "Expected {ok} response");
  });

  await check("POST /api/analytics/cta — handles empty body gracefully", async () => {
    const r = await fetchJson(`${BASE}/api/analytics/cta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "null"
    });
    assert(r.status === 400 || r.status === 200, `Expected 400 or 200, got ${r.status}`);
  });

  // ── FAQ Analytics ─────────────────────────────────────────────────────────
  await check("POST /api/analytics/faq — accepts event", async () => {
    const r = await fetchJson(`${BASE}/api/analytics/faq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Does this replace our PMS?", expanded: true })
    });
    assert([200, 201, 400].includes(r.status), `Unexpected status ${r.status}`);
  });

  // ── ROI Assessment ────────────────────────────────────────────────────────
  await check("POST /api/roi-assessment — validates payload", async () => {
    const r = await fetchJson(`${BASE}/api/roi-assessment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invalid: true })
    });
    assert(r.status === 400, `Expected 400 for invalid payload, got ${r.status}`);
    assert(r.json?.ok === false, "Expected ok:false for invalid payload");
  });

  // ── Calendly Webhook ──────────────────────────────────────────────────────
  await check("POST /api/calendly/events — rejects empty payload", async () => {
    const r = await fetchJson(`${BASE}/api/calendly/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid json {"
    });
    assert(r.status === 400, `Expected 400 for malformed payload, got ${r.status}`);
  });

  await check("POST /api/calendly/events — accepts valid Calendly payload", async () => {
    const r = await fetchJson(`${BASE}/api/calendly/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "smoke-event-001",
        payload: {
          event: { uri: "smoke-event-001" },
          scheduled_event: { start_time: new Date().toISOString() },
          tracking: { utm_content: null, utm_campaign: null },
          invitee: { name: "Smoke Test", email: "smoke@test.com" }
        }
      })
    });
    // Returns ok:true even when supabase is unavailable (graceful degradation)
    assert([200, 201].includes(r.status), `Expected 2xx, got ${r.status}`);
  });

  // ── Audit Download ────────────────────────────────────────────────────────
  await check("GET /api/audit/[id]/download — returns 404 for unknown id", async () => {
    const r = await fetch(`${BASE}/api/audit/00000000-0000-0000-0000-000000000000/download`);
    assert([404, 503].includes(r.status), `Expected 404 or 503, got ${r.status}`);
  });

  // ── Admin Dashboard ───────────────────────────────────────────────────────
  await check("GET /admin — redirects or renders (not 500)", async () => {
    const res = await fetch(`${BASE}/admin`, { redirect: "manual" });
    assert(res.status !== 500, `Admin returned 500`);
    assert([200, 302, 307, 308].includes(res.status), `Unexpected status ${res.status}`);
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${passed + failed} checks — ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.error("PIPELINE SMOKE TEST FAILED");
    process.exit(1);
  } else {
    console.log("Pipeline smoke test passed.");
  }
}

run().catch(err => {
  console.error("Smoke test runner error:", err.message);
  process.exit(1);
});
