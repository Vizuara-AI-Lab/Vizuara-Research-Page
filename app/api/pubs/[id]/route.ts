// app/api/pubs/[id]/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { verifyAdminFromRequest } from "@/app/lib/adminGuard";

const toTags = (t: unknown): string[] => {
  if (Array.isArray(t)) return t.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof t === "string") return t.split(",").map(s => s.trim()).filter(Boolean);
  return [];
};

// --------------------------------------
// PATCH — Update publication
// --------------------------------------
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    if (!params.id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const body = await req.json();

    const updateData = {
      ...body,
      tags: toTags(body.tags),
      updatedAt: Date.now(),
    };

    console.log("PATCH updating ID:", params.id);

    await adminDb.collection("publications").doc(params.id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}

// --------------------------------------
// DELETE — Delete publication
// --------------------------------------
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    if (!params.id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
      console.log("abcdddd");

    }

    console.log("DELETE removing ID:", params.id);

    await adminDb.collection("publications").doc(params.id).delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
