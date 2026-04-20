import { NextResponse } from "next/server";
import { verifyAdminFromRequest } from "@/app/lib/adminGuard";
import { fetchOpenReviewWorkshops } from "@/app/lib/openreviewWorkshops";

export const maxDuration = 300;

export async function POST(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const startDate: string = (body?.startDate || "").toString().trim();
  const endDate: string | null = body?.endDate ? String(body.endDate).trim() : null;
  const topic: string = (body?.topic || "").toString().trim();

  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return NextResponse.json(
      { error: "startDate (YYYY-MM-DD) is required" },
      { status: 400 }
    );
  }

  try {
    const { workshops, scanned, totalCandidates } = await fetchOpenReviewWorkshops({
      startDate,
      endDate,
      topic,
    });
    const candidates = workshops.map((w) => ({
      ...w,
      verificationStatus: "verified" as const,
      description: "",
    }));
    return NextResponse.json({
      candidates,
      summary: {
        total: candidates.length,
        verified: candidates.length,
        corrected: 0,
        unverified: 0,
        scanned,
        totalWorkshops: totalCandidates,
      },
    });
  } catch (err: any) {
    console.error("[workshops/openreview]", err);
    return NextResponse.json(
      { error: err?.message || "OpenReview discovery failed" },
      { status: 500 }
    );
  }
}
