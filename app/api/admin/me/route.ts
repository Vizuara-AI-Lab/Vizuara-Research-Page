import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebaseAdmin';
import { verifyAdminFromRequest } from '@/app/lib/adminGuard';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  let email: string | null = null;
  if (token) {
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      email = decoded.email || null;
    } catch {}
  }

  const admin = await verifyAdminFromRequest(req);
  return NextResponse.json({ isAdmin: !!admin, email });
}