import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";
import { verifyAdminFromRequest } from "@/app/lib/adminGuard";

export async function GET() {
  const snap = await db
    .collection("testimonials")
    .orderBy("createdAt", "desc")
    .get();
  const testimonials = snap.docs.map((d) => {
    const data: any = d.data();
    return {
      id: d.id,
      postUrl: data.postUrl || "",
      author: data.author || "",
      context: data.context || "",
      published: data.published !== false,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
    };
  });
  return NextResponse.json({ testimonials });
}

export async function POST(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const postUrl = (body.postUrl || "").trim();
  const author = (body.author || "").trim();
  const context = (body.context || "").trim();

  if (!postUrl) {
    return NextResponse.json(
      { error: "postUrl is required" },
      { status: 400 }
    );
  }
  if (!author) {
    return NextResponse.json({ error: "author is required" }, { status: 400 });
  }

  const now = new Date();
  const doc = await db.collection("testimonials").add({
    postUrl,
    author,
    context,
    published: true,
    createdAt: now,
    updatedAt: now,
  });
  return NextResponse.json({ id: doc.id }, { status: 201 });
}
