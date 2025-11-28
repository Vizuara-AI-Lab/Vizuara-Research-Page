// app/api/pubs/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { verifyAdminFromRequest } from "@/app/lib/adminGuard";

const toTags = (t: unknown): string[] => {
  if (Array.isArray(t)) return t.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof t === "string") return t.split(",").map(s => s.trim()).filter(Boolean);
  return [];
};

// --------------------------------------
// GET – Public: returns all publications
// --------------------------------------
export async function GET() {
  try {
    const snap = await adminDb
      .collection("publications")
      .orderBy("createdAt", "desc")
      .get();

    const list = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    }));

    // If you want to hide unpublished ones on public site:
    // const list = snap.docs
    //   .map(d => ({ id: d.id, ...d.data() }))
    //   .filter(p => p.published !== false);

    return NextResponse.json({ publications: list });
  } catch (err: any) {
    console.error("GET ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --------------------------------------
// POST – Admin: create new publication
// --------------------------------------
export async function POST(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    const item = {
      title: body.title || "",
      authors: body.authors || "",
      venue: body.venue || "",
      year: body.year ?? null,
      paperLink: body.paperLink || "",
      imageUrl: body.imageUrl || "",
      imagePath: body.imagePath || "",
      tags: toTags(body.tags),
      published: !!body.published,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const ref = await adminDb.collection("publications").add(item);

    return NextResponse.json({ id: ref.id, ...item });
  } catch (err: any) {
    console.error("POST ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
