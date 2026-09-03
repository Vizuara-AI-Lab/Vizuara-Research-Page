import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import { verifyAdminFromRequest } from '@/app/lib/adminGuard';

const COLLECTION = 'uploads';

function cleanId(raw: string | undefined) {
  const id = (raw || '').trim();
  return /^[\w-]{1,128}$/.test(id) ? id : '';
}

// GET /api/uploads/[id] — serves the stored image bytes.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await ctx.params;
  const id = cleanId(rawId);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = snap.data() as { contentType?: string; data?: Buffer | Uint8Array };
  const raw = data.data;
  if (!raw) return NextResponse.json({ error: 'No image data' }, { status: 404 });
  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'content-type': data.contentType || 'application/octet-stream',
      'content-length': String(bytes.length),
      // Each upload gets a fresh id, so the bytes behind an id never change.
      'cache-control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
}

// DELETE /api/uploads/[id]
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: rawId } = await ctx.params;
  const id = cleanId(rawId);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    await db.collection(COLLECTION).doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[DELETE /api/uploads/:id]', err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : 'Server error') }, { status: 500 });
  }
}
