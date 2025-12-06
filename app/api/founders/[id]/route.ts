import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import { verifyAdminFromRequest } from '@/app/lib/adminGuard';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  await db.collection("founders").doc(params.id).update(data);
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await db.collection("founders").doc(params.id).delete();
  return NextResponse.json({ success: true });
}