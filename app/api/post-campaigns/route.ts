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

async function uniqueSlug(base: string) {
  const clean = slugify(base) || `post-${Date.now()}`;
  let slug = clean;
  let suffix = 2;

  while ((await db.collection('postCampaigns').where('slug', '==', slug).limit(1).get()).size) {
    slug = `${clean}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

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

export async function GET(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const snap = await db.collection('postCampaigns').orderBy('createdAt', 'desc').get();
  const posts = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return json({ posts });
}

export async function POST(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const body = (await req.json()) as Record<string, unknown>;
  const caption = typeof body.caption === 'string' ? body.caption.trim() : '';
  const title =
    typeof body.title === 'string' && body.title.trim()
      ? body.title.trim()
      : titleFromCaption(caption);
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
  const imageUrls = toStringList(body.imageUrls);
  const imagePath = typeof body.imagePath === 'string' ? body.imagePath.trim() : '';
  const imagePaths = toStringList(body.imagePaths);
  const primaryImageUrl = imageUrls[0] || imageUrl;
  if (!caption) return json({ error: 'Caption is required' }, 400);
  if (!primaryImageUrl) return json({ error: 'Image is required' }, 400);

  const now = new Date();
  const data = {
    title,
    caption,
    platform: typeof body.platform === 'string' ? body.platform.trim() : '',
    destinationUrl: cleanDestination(body.destinationUrl),
    slug: await uniqueSlug(typeof body.slug === 'string' && body.slug.trim() ? body.slug : title),
    imageUrl: primaryImageUrl,
    imagePath: imagePaths[0] || imagePath,
    imageUrls: imageUrls.length ? imageUrls : [primaryImageUrl],
    imagePaths: imagePaths.length ? imagePaths : imagePath ? [imagePath] : [],
    clickCount: 0,
    published: body.published !== false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const doc = await db.collection('postCampaigns').add(data);
    return json({ id: doc.id, ...data }, 201);
  } catch (err: unknown) {
    console.error('[POST /api/post-campaigns]', err);
    return json({ error: err instanceof Error ? err.message : 'Server error' }, 500);
  }
}
