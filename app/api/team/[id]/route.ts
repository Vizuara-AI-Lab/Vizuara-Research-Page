import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";
import { verifyAdminFromRequest } from "@/app/lib/adminGuard";

export async function DELETE(req: Request, context: any) {
  const params = await context.params; // <-- await here

  await verifyAdminFromRequest(req);

  if (!params.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await db.collection("teamMembers").doc(params.id).delete();

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, context: any) {
  const params = await context.params; // <-- await here

  await verifyAdminFromRequest(req);

  const body = await req.json();
  await db.collection("teamMembers").doc(params.id).update(body);

  return NextResponse.json({ ok: true });
}