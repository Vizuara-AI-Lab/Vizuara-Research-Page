import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";
import { verifyAdminFromRequest } from "@/app/lib/adminGuard";
import { fetchOpenReviewWorkshops } from "@/app/lib/openreviewWorkshops";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Prevent overlapping syncs — they'd fight over the shared OpenReview throttle
// chain and stall each other out.
let runningSync: Promise<any> | null = null;

// Authorization: allow Vercel Cron (CRON_SECRET header) OR an admin user.
async function isAuthorized(req: Request): Promise<boolean> {
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  const authHeader = req.headers.get("authorization") || "";
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  const admin = await verifyAdminFromRequest(req);
  return !!admin;
}

async function runSync(cap: number) {
  const today = new Date().toISOString().slice(0, 10);
  const endYear = new Date().getFullYear() + 1;
  const endDate = `${endYear}-12-31`;

  const { workshops, scanned, totalCandidates } = await fetchOpenReviewWorkshops({
    startDate: today,
    endDate,
    cap,
    concurrency: 1,
  });

  const coll = db.collection("autoWorkshops");

  // Wipe previous snapshot, write new one — keeps the collection reflective of
  // OpenReview's current state (no stale entries if a deadline is withdrawn).
  const old = await coll.limit(1000).get();
  const deleteBatch = db.batch();
  old.docs.forEach((d) => deleteBatch.delete(d.ref));
  if (!old.empty) await deleteBatch.commit();

  const now = new Date();
  let saved = 0;
  const BATCH_SIZE = 400;
  for (let i = 0; i < workshops.length; i += BATCH_SIZE) {
    const chunk = workshops.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const w of chunk) {
      const ref = coll.doc();
      batch.set(ref, { ...w, syncedAt: now });
    }
    await batch.commit();
    saved += chunk.length;
  }

  // Keep a small meta doc so we can surface "last updated" if useful.
  await db.collection("autoWorkshopsMeta").doc("status").set({
    syncedAt: now,
    saved,
    scanned,
    totalCandidates,
  });

  return { saved, scanned, totalCandidates };
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (runningSync) {
    return NextResponse.json(
      { error: "A sync is already running. Try again after it completes." },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const cap = Math.min(Math.max(Number(body?.cap) || 300, 50), 500);

  runningSync = runSync(cap);
  try {
    const result = await runningSync;
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[public-workshops/sync]", err);
    return NextResponse.json(
      { error: err?.message || "Sync failed" },
      { status: 500 }
    );
  } finally {
    runningSync = null;
  }
}

// Vercel Cron invokes with GET.
// Cap=120 fits comfortably in Vercel's 300s maxDuration:
//   120 venues * 2 calls * 400ms throttle = ~96s, leaves buffer for 429 retries.
export async function GET(req: Request) {
  if (!(await isAuthorized(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (runningSync) {
    return NextResponse.json(
      { error: "A sync is already running." },
      { status: 409 }
    );
  }
  runningSync = runSync(120);
  try {
    const result = await runningSync;
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[public-workshops/sync GET]", err);
    return NextResponse.json(
      { error: err?.message || "Sync failed" },
      { status: 500 }
    );
  } finally {
    runningSync = null;
  }
}
