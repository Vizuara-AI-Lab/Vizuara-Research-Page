import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import { verifyAdminFromRequest } from '@/app/lib/adminGuard';

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const { id } = await ctx.params;
  if (!id) return json({ error: 'Invalid id' }, 400);

  const snap = await db
    .collection('postCampaigns')
    .doc(id)
    .collection('sessions')
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();

  const sessions = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      duration: d.duration ?? 0,
      pageCount: d.pageCount ?? 0,
      pages: Array.isArray(d.pages) ? d.pages : [],
      bounce: d.bounce ?? false,
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
    };
  });

  return json({ sessions });
}
