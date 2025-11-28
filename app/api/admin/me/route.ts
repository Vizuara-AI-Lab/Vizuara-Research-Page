import { NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '@/app/lib/adminGuard';

// Returns { isAdmin: boolean, email?: string }
export async function GET(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ isAdmin: false });
  }
  return NextResponse.json({ isAdmin: true, email: admin.email });
}