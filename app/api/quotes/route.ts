import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";
import { verifyAdminFromRequest } from "@/app/lib/adminGuard";

export async function GET() {
  const snap = await db
    .collection("quotes")
    .orderBy("createdAt", "desc")
    .get();
  const quotes = snap.docs.map((d) => {
    const data: any = d.data();
    return {
      id: d.id,
      text: data.text || "",
      name: data.name || "",
      role: data.role || "",
      published: data.published !== false,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
    };
  });
  return NextResponse.json({ quotes });
}

export async function POST(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const text = (body.text || "").trim();
  const name = (body.name || "").trim();
  const role = (body.role || "").trim();

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const now = new Date();
  const doc = await db.collection("quotes").add({
    text,
    name,
    role,
    published: true,
    createdAt: now,
    updatedAt: now,
  });
  return NextResponse.json({ id: doc.id }, { status: 201 });
}
