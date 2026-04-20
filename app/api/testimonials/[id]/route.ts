import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";
import { verifyAdminFromRequest } from "@/app/lib/adminGuard";

export async function DELETE(req: Request, context: any) {
  const params = await context.params;
  const admin = await verifyAdminFromRequest(req);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!params.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await db.collection("testimonials").doc(params.id).delete();
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, context: any) {
  const params = await context.params;
  const admin = await verifyAdminFromRequest(req);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.postUrl === "string") patch.postUrl = body.postUrl.trim();
  if (typeof body.author === "string") patch.author = body.author.trim();
  if (typeof body.context === "string") patch.context = body.context.trim();
  if (typeof body.published === "boolean") patch.published = body.published;

  await db.collection("testimonials").doc(params.id).update(patch);
  return NextResponse.json({ ok: true });
}
