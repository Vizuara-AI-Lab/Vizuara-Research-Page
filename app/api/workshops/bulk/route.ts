import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";
import { verifyAdminFromRequest } from "@/app/lib/adminGuard";

function normalize(w: any) {
  return {
    title: (w.title || "").trim(),
    fullName: (w.fullName || "").trim(),
    hostConference: (w.hostConference || "").trim(),
    link: (w.link || "").trim(),
    deadline: (w.deadline || "").trim(),
    date: (w.date || "").trim(),
    place: (w.place || "").trim(),
    sub: (w.sub || "ML").trim(),
    published: w.published !== false,
  };
}

export async function POST(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length)
    return NextResponse.json({ error: "No items" }, { status: 400 });

  const now = new Date();
  const batch = db.batch();
  const coll = db.collection("workshops");
  const ids: string[] = [];

  for (const raw of items) {
    const w = normalize(raw);
    if (!w.title || !w.link || !w.deadline) continue;
    const ref = coll.doc();
    batch.set(ref, { ...w, createdAt: now, updatedAt: now });
    ids.push(ref.id);
  }

  if (!ids.length)
    return NextResponse.json(
      { error: "No valid rows (title/link/deadline required)" },
      { status: 400 }
    );

  try {
    await batch.commit();
    return NextResponse.json({ saved: ids.length, ids });
  } catch (err: any) {
    console.error("[workshops/bulk]", err);
    return NextResponse.json(
      { error: err?.message || "Save failed" },
      { status: 500 }
    );
  }
}
