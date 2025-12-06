import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import { verifyAdminFromRequest } from '@/app/lib/adminGuard';

export async function PATCH(req: Request, { params }: any) {
  await verifyAdminFromRequest(req);

  const body = await req.json();
  await db.collection("teamMembers").doc(params.id).update(body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: any) {
  await verifyAdminFromRequest(req);

  await db.collection("teamMembers").doc(params.id).delete();
  return NextResponse.json({ ok: true });
}
