#!/usr/bin/env node
/*
 * Standalone OpenReview → Firestore sync.
 * Run manually: `node scripts/seed-workshops.js [cap]`  (default cap=200)
 * Reads .env.local for creds. Logs progress.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const admin = require("firebase-admin");

// --- Load .env.local (simple parser) ---
function loadEnv() {
  const file = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(file)) return;
  const txt = fs.readFileSync(file, "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let val = m[2];
    if (/^".*"$/.test(val)) val = val.slice(1, -1).replace(/\\n/g, "\n");
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}
loadEnv();

// --- OpenReview client ---
const API = "https://api2.openreview.net";
const TOKEN_FILE = path.join(os.tmpdir(), "vizuara-openreview-token.json");
const MIN_GAP_MS = 400;
let lastRequestAt = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function throttle() {
  const wait = Math.max(0, lastRequestAt + MIN_GAP_MS - Date.now());
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

async function login() {
  let id = (process.env.OPENREVIEW_EMAIL || process.env.OPENREVIEW_USERNAME || "").trim();
  const password = (process.env.OPENREVIEW_PASSWORD || "").trim();
  if (!id || !password) throw new Error("Missing OPENREVIEW_EMAIL/PASSWORD");
  if (!id.includes("@") && !id.startsWith("~")) id = "~" + id;

  const r = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, password }),
  });
  if (!r.ok) throw new Error(`login failed: ${r.status} ${await r.text()}`);
  const { token } = await r.json();
  return token;
}

async function getToken() {
  try {
    const raw = fs.readFileSync(TOKEN_FILE, "utf8");
    const c = JSON.parse(raw);
    if (c.token && c.expires > Date.now()) return c.token;
  } catch {}
  const token = await login();
  fs.writeFileSync(
    TOKEN_FILE,
    JSON.stringify({ token, expires: Date.now() + 23 * 3600 * 1000 }),
    { mode: 0o600 }
  );
  return token;
}

async function orFetch(pathname, params) {
  const url = new URL(API + pathname);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null && String(v).length) url.searchParams.set(k, String(v));
    }
  }
  for (let attempt = 1; attempt <= 5; attempt++) {
    await throttle();
    const token = await getToken();
    const r = await fetch(url, {
      headers: { Accept: "application/json", Authorization: token },
    });
    if (r.ok) return r.json();
    if (r.status === 401 || r.status === 403) {
      try { fs.unlinkSync(TOKEN_FILE); } catch {}
      continue;
    }
    if (r.status === 429 && attempt < 5) {
      const wait = Math.min(15, attempt * 5) * 1000;
      await sleep(wait);
      continue;
    }
    throw new Error(`${pathname} ${r.status}`);
  }
  throw new Error(`${pathname} retries exhausted`);
}

// --- Helpers from the lib ---
const SUB_BY_HOST = {
  "ICLR.cc": "ML", "ICML.cc": "ML", NeurIPS: "ML",
  "aclweb.org": "NLP", EMNLP: "NLP", NAACL: "NLP",
  "thecvf.com": "CV", CVPR: "CV", ICCV: "CV", ECCV: "CV",
  ICASSP: "SP", SLT: "SP", Interspeech: "SP",
  "roboticsfoundation.org": "RO", HRI: "HCI", CHI: "HCI",
  ACM: "AP", IEEE: "AP",
};
function guessSub(vid, title) {
  for (const [k, v] of Object.entries(SUB_BY_HOST)) if (vid.includes(k)) return v;
  const h = `${vid} ${title}`.toLowerCase();
  if (/\b(vision|image|video|cvpr|iccv|eccv)\b/.test(h)) return "CV";
  if (/\b(nlp|language|llm|text|acl|emnlp|naacl)\b/.test(h)) return "NLP";
  if (/\b(speech|audio|asr|interspeech|icassp)\b/.test(h)) return "SP";
  if (/\b(robot|icra|iros)\b/.test(h)) return "RO";
  if (/\b(hci|human[- ]computer|chi|ubicomp|cscw)\b/.test(h)) return "HCI";
  return "ML";
}
function hostFromVenueId(vid) {
  const parts = vid.split("/");
  const yi = parts.findIndex((p) => /^\d{4}$/.test(p));
  if (yi <= 0) return parts[0].replace(/\.(cc|org|net)$/, "");
  return `${parts[yi - 1].replace(/\.(cc|org|net)$/, "")} ${parts[yi]}`;
}
function fmtDate(ms) {
  if (!ms || ms < 1e12) return "";
  try {
    return new Date(ms).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return ""; }
}

async function fetchVenue(vid) {
  try {
    const g = await orFetch("/groups", { id: vid });
    const inv = await orFetch("/invitations", {
      id: `${vid}/-/Submission`, expired: "true",
    });
    const group = g.groups?.[0];
    if (!group) return null;
    const c = group.content || {};
    const v = (k) => c?.[k]?.value;
    const duedate = inv.invitations?.[0]?.duedate;
    if (!duedate) return null;
    const title = v("title") || v("subtitle") || vid;
    const subtitle = v("subtitle") || "";
    return {
      title,
      fullName: subtitle || title,
      hostConference: subtitle || hostFromVenueId(vid),
      link: v("website") || `https://openreview.net/group?id=${encodeURIComponent(vid)}`,
      deadline: new Date(duedate).toISOString(),
      date: fmtDate(v("start_date")),
      place: v("location") || "",
      sub: guessSub(vid, title),
      venueId: vid,
    };
  } catch (e) {
    console.log(`  ! ${vid}: ${e.message}`);
    return null;
  }
}

// --- Firestore ---
function initFirestore() {
  if (admin.apps.length) return admin.firestore();
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
  return admin.firestore();
}

// --- Main ---
(async () => {
  const cap = Number(process.argv[2]) || 200;
  const today = new Date().toISOString().slice(0, 10);
  const startYear = new Date().getFullYear();
  const endYear = startYear + 1;
  const startMs = new Date(today).getTime();

  console.log(`\n=== Seed workshops — cap=${cap}, today=${today} ===\n`);

  console.log("Fetching active_venues...");
  const g = await orFetch("/groups", { id: "active_venues" });
  const members = g.groups?.[0]?.members || [];
  console.log(`  total active venues: ${members.length}`);

  const candidates = members.filter((vid) => {
    if (!vid.includes("/Workshop")) return false;
    if (/Proposal/i.test(vid)) return false;
    const m = vid.match(/\/(\d{4})\//);
    if (!m) return false;
    const y = Number(m[1]);
    return y >= startYear && y <= endYear;
  });
  console.log(`  workshop candidates (${startYear}-${endYear}): ${candidates.length}`);

  const batch = candidates.slice(0, cap);
  console.log(`  scanning: ${batch.length}\n`);

  const results = [];
  const t0 = Date.now();
  for (let i = 0; i < batch.length; i++) {
    const vid = batch[i];
    const v = await fetchVenue(vid);
    if (v) {
      const t = new Date(v.deadline).getTime();
      if (t >= startMs) {
        results.push(v);
        console.log(
          `  [${i + 1}/${batch.length}] ✓ ${v.title.slice(0, 45).padEnd(45)} | ${v.deadline.slice(0, 10)}`
        );
      } else {
        console.log(`  [${i + 1}/${batch.length}] ✗ past deadline: ${v.title.slice(0, 45)}`);
      }
    } else {
      console.log(`  [${i + 1}/${batch.length}] - no submission: ${vid.slice(0, 50)}`);
    }
  }
  const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\nScanned ${batch.length} in ${elapsed}s. Keepers: ${results.length}\n`);

  results.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  console.log("Writing to Firestore...");
  const db = initFirestore();
  const coll = db.collection("autoWorkshops");

  const old = await coll.get();
  if (!old.empty) {
    const wb = db.batch();
    old.docs.forEach((d) => wb.delete(d.ref));
    await wb.commit();
    console.log(`  deleted ${old.size} old docs`);
  }

  const now = new Date();
  for (let i = 0; i < results.length; i += 400) {
    const chunk = results.slice(i, i + 400);
    const wb = db.batch();
    for (const w of chunk) wb.set(coll.doc(), { ...w, syncedAt: now });
    await wb.commit();
  }

  await db.collection("autoWorkshopsMeta").doc("status").set({
    syncedAt: now,
    saved: results.length,
    scanned: batch.length,
    totalCandidates: candidates.length,
  });

  console.log(`\n✓ Done. Wrote ${results.length} workshops to Firestore.`);
  process.exit(0);
})().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
