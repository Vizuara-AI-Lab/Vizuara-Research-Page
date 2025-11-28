import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import { verifyAdminFromRequest } from '@/app/lib/adminGuard';

const toTags = (t: unknown): string[] => {
  if (Array.isArray(t)) return t.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof t === 'string') return t.split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

export async function GET() {
  const snap = await db.collection('publications').orderBy('year', 'desc').get();
  const items = snap.docs.map(d => {
    const data: any = d.data();
    return { ...data, id: d.id, tags: toTags(data.tags) }; // ensure id is last so it isn't overwritten
  });
  return NextResponse.json({ publications: items });
}

export async function POST(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const now = new Date();
  const candidate: any = {
    title: (body.title || '').trim(),
    authors: (body.authors || '').trim(),
    venue: (body.venue || '').trim(),
    year: body.year ? Number(body.year) : null,
    paperLink: (body.paperLink || '').trim(),
    imageUrl: (body.imageUrl || '').trim(),
    imagePath: (body.imagePath || '').trim(),
    tags: toTags(body.tags),
    published: !!body.published,
    createdAt: now,
    updatedAt: now,
  };
  const data = Object.fromEntries(Object.entries(candidate).filter(([, v]) => v !== undefined));

  try {
    const doc = await db.collection('publications').add(data);
    return NextResponse.json({ id: doc.id, ...data }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/pubs] error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}