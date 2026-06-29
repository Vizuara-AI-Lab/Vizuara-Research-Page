import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/app/lib/firebaseAdmin';

const fallbackDestination = (req: Request) => new URL('/', req.url);

const toRedirectUrl = (destination: unknown, req: Request) => {
  const value = typeof destination === 'string' ? destination.trim() : '';
  if (!value) return fallbackDestination(req);
  if (value.startsWith('/')) return new URL(value, req.url);

  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url;
  } catch {}

  return fallbackDestination(req);
};

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await ctx.params;
  const slug = (rawSlug || '').trim();
  if (!slug) return NextResponse.redirect(fallbackDestination(req), 302);

  const snap = await db.collection('postCampaigns').where('slug', '==', slug).limit(1).get();
  const doc = snap.docs[0];
  if (!doc) return NextResponse.redirect(fallbackDestination(req), 302);

  const data = doc.data();
  const destination = toRedirectUrl(data.destinationUrl, req);

  // Append campaign param for session tracking — same-origin only so external URLs stay clean
  try {
    const reqOrigin = new URL(req.url).origin;
    if (destination.origin === reqOrigin) {
      destination.searchParams.set('_c', slug);
    }
  } catch {}

  try {
    const ref = doc.ref;
    const headers = req.headers;
    const clickRef = ref.collection('clicks').doc();
    const batch = db.batch();

    batch.update(ref, {
      clickCount: FieldValue.increment(1),
      lastClickedAt: new Date(),
      updatedAt: new Date(),
    });
    batch.set(clickRef, {
      createdAt: new Date(),
      referrer: headers.get('referer') || '',
      userAgent: headers.get('user-agent') || '',
      ipCountry: headers.get('x-vercel-ip-country') || '',
      ipCity: headers.get('x-vercel-ip-city') || '',
    });

    await batch.commit();
  } catch (err) {
    console.error('[GET /r/:slug] click tracking failed', err);
  }

  return NextResponse.redirect(destination, 302);
}
