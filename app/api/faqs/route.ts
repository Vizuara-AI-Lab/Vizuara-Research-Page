import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";
import { verifyAdminFromRequest } from "@/app/lib/adminGuard";

export const revalidate = 21600;

type FaqDoc = {
  question?: string;
  answer?: string;
  published?: boolean;
  createdAt?: { toDate?: () => Date };
};

export async function GET() {
  // Ordered oldest-first so seeded/authored display order is preserved.
  const snap = await db.collection("faqs").orderBy("createdAt", "asc").get();
  const faqs = snap.docs.map((d) => {
    const data = d.data() as FaqDoc;
    return {
      id: d.id,
      question: data.question || "",
      answer: data.answer || "",
      published: data.published !== false,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
    };
  });
  return NextResponse.json(
    { faqs },
    {
      headers: {
        "Cache-Control": "public, max-age=21600, s-maxage=21600, stale-while-revalidate=86400",
      },
    }
  );
}

export async function POST(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const question = (body.question || "").trim();
  const answer = (body.answer || "").trim();

  if (!question) {
    return NextResponse.json(
      { error: "question is required" },
      { status: 400 }
    );
  }
  if (!answer) {
    return NextResponse.json({ error: "answer is required" }, { status: 400 });
  }

  const now = new Date();
  const doc = await db.collection("faqs").add({
    question,
    answer,
    published: true,
    createdAt: now,
    updatedAt: now,
  });
  return NextResponse.json({ id: doc.id }, { status: 201 });
}
