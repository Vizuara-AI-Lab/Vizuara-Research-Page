import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";
import {
  fetchOpenReviewWorkshops,
  type OrWorkshop,
} from "@/app/lib/openreviewWorkshops";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// In-memory fallback cache for when Firestore is empty (before first sync).
type CacheEntry = { workshops: OrWorkshop[]; fetchedAt: number };
const TTL_MS = 6 * 60 * 60 * 1000;
let memCache: CacheEntry | null = null;
let inflight: Promise<CacheEntry> | null = null;

async function liveFetch(): Promise<CacheEntry> {
  const today = new Date().toISOString().slice(0, 10);
  const endYear = new Date().getFullYear() + 1;
  const endDate = `${endYear}-12-31`;
  const { workshops } = await fetchOpenReviewWorkshops({
    startDate: today,
    endDate,
    cap: 60,
    concurrency: 1,
  });
  return { workshops, fetchedAt: Date.now() };
}

export async function GET() {
  // Primary path: read the Firestore snapshot written by the daily sync job.
  try {
    const snap = await db
      .collection("autoWorkshops")
      .orderBy("deadline", "asc")
      .get();
    if (!snap.empty) {
      const todayMs = Date.now();
      const workshops = snap.docs
        .map((d) => d.data() as OrWorkshop & { syncedAt?: any })
        .filter((w) => {
          const t = new Date(w.deadline).getTime();
          return !isNaN(t) && t >= todayMs - 86400000; // drop past deadlines
        })
        .map(({ syncedAt, ...rest }) => rest);

      const meta = await db
        .collection("autoWorkshopsMeta")
        .doc("status")
        .get()
        .catch(() => null);
      const syncedAt = meta?.data()?.syncedAt?.toDate?.()?.toISOString();

      return NextResponse.json({
        workshops,
        fetchedAt: syncedAt,
        source: "firestore",
      });
    }
  } catch (err) {
    console.error("[public-workshops] firestore read failed", err);
  }

  // Fallback: no sync has run yet. Do a live fetch with in-memory cache.
  if (memCache && Date.now() - memCache.fetchedAt < TTL_MS) {
    return NextResponse.json({
      workshops: memCache.workshops,
      fetchedAt: new Date(memCache.fetchedAt).toISOString(),
      source: "live-cache",
    });
  }

  try {
    if (!inflight) inflight = liveFetch();
    const fresh = await inflight;
    memCache = fresh;
    inflight = null;
    return NextResponse.json({
      workshops: fresh.workshops,
      fetchedAt: new Date(fresh.fetchedAt).toISOString(),
      source: "live",
    });
  } catch (err: any) {
    inflight = null;
    return NextResponse.json(
      { workshops: [], error: err?.message || "Fetch failed" },
      { status: 500 }
    );
  }
}
