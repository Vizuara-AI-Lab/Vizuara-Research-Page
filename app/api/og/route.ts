import { NextResponse } from 'next/server';
import {
  getOpenGraphImage,
  extractArxivIdFromUrl,
  getArxivFigureFromAr5iv,
  getBestFigureFromUrl,
  getFirstImageFromHtml,
} from '@/app/lib/scholar';

const SERP_BASE = 'https://serpapi.com/search.json';
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;

function isScholar(url: string) {
  try { return new URL(url).hostname.includes('scholar.google'); } catch { return false; }
}
function isOpenReview(url: string) {
  try { return new URL(url).hostname.includes('openreview.net'); } catch { return false; }
}
function toOpenReviewPdfUrl(url: string) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('openreview.net')) return url;
    if (u.pathname.startsWith('/pdf')) return url;
    const id = u.searchParams.get('id');
    return id ? `https://openreview.net/pdf?id=${id}` : url;
  } catch { return url; }
}
function buildCloudinaryPdfThumb(pdfUrl: string, page = 2, width = 440) {
  if (!CLOUD_NAME) return null;
  const encoded = encodeURIComponent(pdfUrl);
  // pg_2 defaults to page 2 (often first figure), change to pg_1 if you prefer title page
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/f_auto,q_auto,pg_${page},w_${width}/${encoded}`;
}

async function resolveExternalUrlByTitle(title: string): Promise<string | null> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey || !title) return null;
  const url = `${SERP_BASE}?engine=google_scholar&q=${encodeURIComponent(title)}&hl=en&num=5&api_key=${apiKey}`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    const links: string[] = (data.organic_results ?? []).map((r: any) => r?.link).filter(Boolean);
    // Prefer non-Scholar link
    return links.find((l) => !isScholar(l)) || links[0] || null;
  } catch { return null; }
}

export const revalidate = 86400;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get('url') || '';
  const title = searchParams.get('title') || '';

  // Resolve non‑Scholar landing page if needed
  let targetUrl = rawUrl;
  if (!targetUrl || isScholar(targetUrl)) {
    const resolved = await resolveExternalUrlByTitle(title);
    if (resolved) targetUrl = resolved;
  }
  if (!targetUrl) {
    return NextResponse.json({ imageUrl: null, proxyUrl: null, resolvedUrl: null }, { status: 200 });
  }

  // Special case: OpenReview PDF → Cloudinary page image
  if (isOpenReview(targetUrl)) {
    const pdfUrl = toOpenReviewPdfUrl(targetUrl);
    const cloud = buildCloudinaryPdfThumb(pdfUrl, 2, 440) || undefined;
    if (cloud) {
      // Cloudinary is https; you can use it directly or via your proxy for uniform caching
      const proxyUrl = `/api/img?url=${encodeURIComponent(cloud)}`;
      return NextResponse.json({ imageUrl: cloud, proxyUrl, resolvedUrl: pdfUrl }, { status: 200 });
    }
    // If CLOUD_NAME missing, fall back to generic pipeline
  }

  // Figure-first pipeline for others
  let imageUrl: string | null = null;
  const arxivId = extractArxivIdFromUrl(targetUrl);
  if (arxivId) imageUrl = await getArxivFigureFromAr5iv(arxivId);
  if (!imageUrl) imageUrl = await getBestFigureFromUrl(targetUrl);
  if (!imageUrl) imageUrl = await getOpenGraphImage(targetUrl);
  if (!imageUrl) imageUrl = await getFirstImageFromHtml(targetUrl);

  const proxyUrl = imageUrl
    ? `/api/img?url=${encodeURIComponent(imageUrl)}&referer=${encodeURIComponent(targetUrl)}`
    : null;

  return NextResponse.json({ imageUrl: imageUrl ?? null, proxyUrl, resolvedUrl: targetUrl }, { status: 200 });
}