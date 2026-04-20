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

  await db.collection("quotes").doc(params.id).delete();
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, context: any) {
  const params = await context.params;
  const admin = await verifyAdminFromRequest(req);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.text === "string") patch.text = body.text.trim();
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.role === "string") patch.role = body.role.trim();
  if (typeof body.published === "boolean") patch.published = body.published;

  await db.collection("quotes").doc(params.id).update(patch);
  return NextResponse.json({ ok: true });
}
