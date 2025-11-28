import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import { verifyAdminFromRequest } from '@/app/lib/adminGuard';

const json = (data: any, status = 200) => NextResponse.json(data, { status });

const toTags = (t: unknown): string[] => {
  if (Array.isArray(t)) return t.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof t === 'string') return t.split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

// GET /api/pubs/[id]
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } 
) {
  const { id: rawId } = await ctx.params;   
  const id = (rawId || '').trim();
  if (!id) return json({ error: 'Invalid id' }, 400);

  const doc = await db.collection('publications').doc(id).get();
  if (!doc.exists) return json({ error: 'Not found' }, 404);

  const data = doc.data() as any;
  return json({ ...data, id: doc.id, tags: toTags(data.tags) });
}

// PATCH /api/pubs/[id]
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> } 
) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const { id: rawId } = await ctx.params;  
  const id = (rawId || '').trim();
  if (!id) return json({ error: 'Invalid id' }, 400);

  const body = await req.json();

  const candidate: any = {
    title: typeof body.title === 'string' ? body.title.trim() : undefined,
    authors: typeof body.authors === 'string' ? body.authors.trim() : undefined,
    venue: typeof body.venue === 'string' ? body.venue.trim() : undefined,
    year: body.year === null ? null : (body.year !== undefined ? Number(body.year) : undefined),
    paperLink: typeof body.paperLink === 'string' ? body.paperLink.trim() : undefined,
    imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl.trim() : undefined,
    imagePath: typeof body.imagePath === 'string' ? body.imagePath.trim() : undefined,
    tags: body.tags !== undefined ? toTags(body.tags) : undefined,
    published: typeof body.published === 'boolean' ? body.published : undefined,
    updatedAt: new Date(),
  };

  const updates = Object.fromEntries(
    Object.entries(candidate).filter(([, v]) => v !== undefined)
  );

  try {
    await db.collection('publications').doc(id).update(updates);
    return json({ id, ...updates });
  } catch (err: any) {
    console.error('[PATCH /api/pubs/:id]', err);
    return json({ error: err?.message || 'Server error' }, 500);
  }
}

// DELETE /api/pubs/[id]
export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> } 
) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const { id: rawId } = await ctx.params;   
  const id = (rawId || '').trim();
  if (!id) return json({ error: 'Invalid id (missing/empty)' }, 400);

  try {
    const ref = db.collection('publications').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return json({ error: `Not found (id=${id})` }, 404);

    await ref.delete();
    return json({ ok: true });
  } catch (err: any) {
    console.error('[DELETE /api/pubs/:id]', err);
    return json({ error: err?.message || 'Server error' }, 500);
  }
}

