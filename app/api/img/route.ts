import { NextResponse } from 'next/server';

// Optional: set to 'edge' if you want, but node is fine. Uncomment if needed.
// export const runtime = 'edge';

export const revalidate = 86400; // cache 24h

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const referer = searchParams.get('referer') || undefined;

  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  // Basic validation
  let target: URL;
  try {
    target = new URL(url);
    if (!(target.protocol === 'http:' || target.protocol === 'https:')) {
      return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  // Short timeout to avoid hanging
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36',
        accept: 'image/*,*/*;q=0.8',
        ...(referer ? { referer } : {}),
      },
      signal: controller.signal,
      // Cache at the edge for a day
      next: { revalidate: 86400 },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
    }

    // Best-effort content type
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'content-type': contentType,
        'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        'x-content-type-options': 'nosniff',
        // CORS not strictly needed for <img>, but harmless:
        'access-control-allow-origin': '*',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}