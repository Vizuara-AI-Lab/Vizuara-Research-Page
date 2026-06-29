import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import { verifyAdminFromRequest } from '@/app/lib/adminGuard';

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70)
    .replace(/^-|-$/g, '');

const cleanDestination = (value: unknown) => {
  const destination = typeof value === 'string' ? value.trim() : '';
  if (!destination) return '/';
  if (destination.startsWith('/')) return destination;
  try {
    const url = new URL(destination);
    if (url.protocol === 'http:' || url.protocol === 'https:') return destination;
  } catch {}
  return '/';
};

const titleFromCaption = (caption: string) =>
  caption
    .split(/\s+/)
    .slice(0, 8)
    .join(' ')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .slice(0, 80) || `Post ${new Date().toISOString().slice(0, 10)}`;

const toStringList = (value: unknown) =>
  Array.isArray(value)
    ? value.map(String).map((item) => item.trim()).filter(Boolean)
    : [];

async function slugIsTaken(slug: string, currentId: string) {
  const snap = await db.collection('postCampaigns').where('slug', '==', slug).limit(1).get();
  return snap.docs.some((doc) => doc.id !== currentId);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const { id: rawId } = await ctx.params;
  const id = (rawId || '').trim();
  if (!id) return json({ error: 'Invalid id' }, 400);

  const body = (await req.json()) as Record<string, unknown>;
  const caption = typeof body.caption === 'string' ? body.caption.trim() : undefined;
  const imageUrls = body.imageUrls !== undefined ? toStringList(body.imageUrls) : undefined;
  const imagePaths = body.imagePaths !== undefined ? toStringList(body.imagePaths) : undefined;
  const imageUrl =
    typeof body.imageUrl === 'string'
      ? body.imageUrl.trim()
      : imageUrls?.[0];
  const imagePath =
    typeof body.imagePath === 'string'
      ? body.imagePath.trim()
      : imagePaths?.[0];
  const title =
    typeof body.title === 'string' && body.title.trim()
      ? body.title.trim()
      : typeof caption === 'string'
      ? titleFromCaption(caption)
      : undefined;
  const updates: Record<string, string | string[] | boolean | Date | undefined> = {
    title,
    caption,
    platform: typeof body.platform === 'string' ? body.platform.trim() : undefined,
    destinationUrl: body.destinationUrl !== undefined ? cleanDestination(body.destinationUrl) : undefined,
    imageUrl,
    imagePath,
    imageUrls,
    imagePaths,
    published: typeof body.published === 'boolean' ? body.published : undefined,
    updatedAt: new Date(),
  };

  if (typeof body.slug === 'string') {
    const nextSlug = slugify(body.slug);
    if (!nextSlug) return json({ error: 'Slug is invalid' }, 400);
    if (await slugIsTaken(nextSlug, id)) return json({ error: 'Slug already exists' }, 409);
    updates.slug = nextSlug;
  }

  if (updates.caption === '') return json({ error: 'Caption is required' }, 400);
  if (updates.imageUrl === '') return json({ error: 'Image is required' }, 400);
  if (imageUrls && imageUrls.length === 0) return json({ error: 'Image is required' }, 400);

  try {
    await db.collection('postCampaigns').doc(id).update(
      Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined))
    );
    return json({ id, ...updates });
  } catch (err: unknown) {
    console.error('[PATCH /api/post-campaigns/:id]', err);
    return json({ error: err instanceof Error ? err.message : 'Server error' }, 500);
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const { id: rawId } = await ctx.params;
  const id = (rawId || '').trim();
  if (!id) return json({ error: 'Invalid id' }, 400);

  try {
    const ref = db.collection('postCampaigns').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return json({ error: 'Not found' }, 404);

    await ref.delete();
    return json({ ok: true });
  } catch (err: unknown) {
    console.error('[DELETE /api/post-campaigns/:id]', err);
    return json({ error: err instanceof Error ? err.message : 'Server error' }, 500);
  }
}
