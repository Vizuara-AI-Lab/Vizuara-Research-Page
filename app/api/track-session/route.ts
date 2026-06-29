import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/app/lib/firebaseAdmin';

const SLUG_RE = /^[a-z0-9-]{1,70}$/;
const MAX_DURATION = 3600; // 1 hour cap to prevent inflation
const MAX_PAGES = 50;

export async function POST(req: Request) {
  // Only accept requests originating from the same site
  const origin = req.headers.get('origin');
  const host = req.headers.get('host') || '';
  const isValidOrigin =
    !origin ||
    origin === `https://${host}` ||
    origin === `http://${host}` ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin);

  if (!isValidOrigin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const slug = typeof body.campaign === 'string' ? body.campaign.trim() : '';
  if (!slug || !SLUG_RE.test(slug)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  // Cap duration and pages to prevent stat inflation from spoofed beacons
  const rawDuration = typeof body.duration === 'number' ? body.duration : 0;
  const duration = Math.min(Math.max(0, Math.round(rawDuration)), MAX_DURATION);

  const rawPages = Array.isArray(body.pages)
    ? (body.pages as unknown[]).map(String).filter(Boolean).slice(0, MAX_PAGES)
    : [];
  const pageCount = Math.max(1, rawPages.length);

  // Verify the campaign exists before writing — prevents writing to arbitrary Firestore paths
  const snap = await db.collection('postCampaigns').where('slug', '==', slug).limit(1).get();
  if (snap.empty) {
    // Silently succeed so we don't leak which slugs exist
    return NextResponse.json({ ok: true });
  }

  const docRef = snap.docs[0].ref;
  const isBounce = duration < 15 || pageCount === 1;

  try {
    const batch = db.batch();

    batch.set(docRef.collection('sessions').doc(), {
      createdAt: new Date(),
      duration,
      pageCount,
      pages: rawPages,
      bounce: isBounce,
    });

    batch.update(docRef, {
      sessionCount: FieldValue.increment(1),
      totalSessionDuration: FieldValue.increment(duration),
      totalPagesVisited: FieldValue.increment(pageCount),
      bounceCount: FieldValue.increment(isBounce ? 1 : 0),
      updatedAt: new Date(),
    });

    await batch.commit();
  } catch (err) {
    console.error('[POST /api/track-session]', err);
  }

  return NextResponse.json({ ok: true });
}
