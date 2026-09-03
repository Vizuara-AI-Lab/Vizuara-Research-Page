import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import { verifyAdminFromRequest } from '@/app/lib/adminGuard';

// Images are stored as bytes in the Firestore `uploads` collection and served
// from /api/uploads/[id]. This replaces Cloud Storage for Firebase, which no
// longer serves the project's bucket on the Spark plan.

const UPLOAD_COLLECTION = 'uploads';
// Firestore documents are capped at ~1 MiB; keep headroom for metadata.
const MAX_BYTES = 900 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export async function POST(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { name?: string; contentType?: string; data?: string; folder?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const contentType = (body.contentType || '').toLowerCase().trim();
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json({ error: `Unsupported image type: ${contentType || 'unknown'}` }, { status: 415 });
  }
  if (typeof body.data !== 'string' || !body.data) {
    return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
  }

  const bytes = Buffer.from(body.data, 'base64');
  if (!bytes.length) return NextResponse.json({ error: 'Empty image' }, { status: 400 });
  if (bytes.length > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image is ${Math.round(bytes.length / 1024)} KB; the limit is ${Math.round(MAX_BYTES / 1024)} KB` },
      { status: 413 }
    );
  }

  const name = (body.name || 'image').toString().slice(0, 200);
  const folder = (body.folder || 'misc').toString().replace(/[^\w-]/g, '').slice(0, 40) || 'misc';

  try {
    const doc = await db.collection(UPLOAD_COLLECTION).add({
      name,
      folder,
      contentType,
      size: bytes.length,
      data: bytes,
      createdAt: new Date(),
      createdBy: admin.email,
    });
    return NextResponse.json(
      { id: doc.id, url: `/api/uploads/${doc.id}`, path: `${UPLOAD_COLLECTION}/${doc.id}`, size: bytes.length, contentType },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('[POST /api/uploads]', err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : 'Server error') }, { status: 500 });
  }
}
