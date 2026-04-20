import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";
import { verifyAdminFromRequest } from "@/app/lib/adminGuard";

function normalize(body: any) {
  return {
    title: (body.title || "").trim(),
    fullName: (body.fullName || "").trim(),
    hostConference: (body.hostConference || "").trim(),
    link: (body.link || "").trim(),
    deadline: (body.deadline || "").trim(),
    date: (body.date || "").trim(),
    place: (body.place || "").trim(),
    sub: (body.sub || "ML").trim(),
    published: !!body.published,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const includeUnpublished = url.searchParams.get("all") === "1";
  const admin = includeUnpublished
    ? await verifyAdminFromRequest(req)
    : null;

  let query: FirebaseFirestore.Query = db.collection("workshops");
  if (!includeUnpublished || !admin) {
    query = query.where("published", "==", true);
  }

  const snap = await query.get();
  const items = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .sort((a: any, b: any) => {
      const ad = new Date(a.deadline || 0).getTime();
      const bd = new Date(b.deadline || 0).getTime();
      return ad - bd;
    });
  return NextResponse.json({ workshops: items });
}

export async function POST(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const now = new Date();
  const data = {
    ...normalize(body),
    createdAt: now,
    updatedAt: now,
  };

  try {
    const doc = await db.collection("workshops").add(data);
    return NextResponse.json({ id: doc.id, ...data }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/workshops]", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
