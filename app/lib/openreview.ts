import fs from "fs";
import path from "path";
import os from "os";

const API = "https://api2.openreview.net";
const TTL_MS = 23 * 60 * 60 * 1000;

type Cached = { token: string; expires: number };
let cached: Cached | null = null;

const CACHE_FILE = path.join(os.tmpdir(), "vizuara-openreview-token.json");

function loadCacheFromDisk(): Cached | null {
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Cached;
    if (parsed?.token && parsed?.expires > Date.now()) return parsed;
  } catch {}
  return null;
}

function saveCacheToDisk(c: Cached): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(c), { mode: 0o600 });
  } catch {}
}

async function login(): Promise<string> {
  let id = (process.env.OPENREVIEW_EMAIL || process.env.OPENREVIEW_USERNAME || "").trim();
  const password = (process.env.OPENREVIEW_PASSWORD || "").trim();
  if (!id || !password) {
    throw new Error(
      "OPENREVIEW_EMAIL (or OPENREVIEW_USERNAME) and OPENREVIEW_PASSWORD must be set in .env.local"
    );
  }
  // OpenReview profile IDs (non-email) require a leading "~"
  if (!id.includes("@") && !id.startsWith("~")) {
    id = "~" + id;
  }

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, password }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenReview login failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  const token: string | undefined = data?.token;
  if (!token) throw new Error("OpenReview login response missing token");
  return token;
}

export async function getToken(): Promise<string> {
  if (cached && cached.expires > Date.now()) return cached.token;
  // Try disk cache before hitting /login
  const fromDisk = loadCacheFromDisk();
  if (fromDisk) {
    cached = fromDisk;
    return cached.token;
  }
  const token = await login();
  cached = { token, expires: Date.now() + TTL_MS };
  saveCacheToDisk(cached);
  return token;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Global throttle: OpenReview limit is 3 requests / 5 seconds (~1.67 req/s avg).
// 350ms = ~2.85 req/s — may trigger occasional 429; retry logic absorbs it.
const MIN_GAP_MS = 350;
let lastRequestAt = 0;
let throttleTail: Promise<void> = Promise.resolve();
function throttle(): Promise<void> {
  // Always chain onto a resolved promise so one rejection can't poison the chain.
  const next = throttleTail.catch(() => {}).then(async () => {
    const wait = Math.max(0, lastRequestAt + MIN_GAP_MS - Date.now());
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
  });
  throttleTail = next;
  return next;
}

export async function orFetch(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<any> {
  const url = new URL(`${API}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && String(v).length) {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const MAX_ATTEMPTS = 5;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await throttle();
    const token = await getToken();
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", Authorization: token },
      signal: AbortSignal.timeout(30_000),
    });

    if (res.ok) return res.json();

    if (res.status === 401 || res.status === 403) {
      cached = null;
      try { fs.unlinkSync(CACHE_FILE); } catch {}
      continue;
    }

    if (res.status === 429 && attempt < MAX_ATTEMPTS) {
      const retryAfter = Number(res.headers.get("retry-after")) || attempt * 5;
      await sleep(Math.min(retryAfter, 15) * 1000);
      continue;
    }

    throw new Error(`OpenReview ${path} ${res.status}`);
  }
  throw new Error(`OpenReview ${path} exhausted retries`);
}
