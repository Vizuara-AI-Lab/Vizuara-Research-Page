// Server-side helper: maps legacy Firebase Storage image URLs to local copies.
//
// Cloud Storage for Firebase stopped serving the project's default bucket
// (HTTP 402, Spark plan). The images that could be recovered live in
// public/publication-images/ and are listed in publication-image-files.json.
import recoveredFiles from '@/app/data/publication-image-files.json';

const RECOVERED = new Set<string>(recoveredFiles as string[]);
const LEGACY_PREFIX = 'publication-images/';

/** Object name inside the Firebase bucket for a download URL, or null. */
function legacyObjectName(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== 'firebasestorage.googleapis.com') return null;
    const idx = u.pathname.indexOf('/o/');
    if (idx === -1) return null;
    return decodeURIComponent(u.pathname.slice(idx + 3));
  } catch {
    return null;
  }
}

/**
 * Returns a URL that still loads. Legacy Firebase Storage URLs are swapped
 * for the recovered local copy when one exists; everything else is returned
 * unchanged.
 */
export function resolvePublicationImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return '';
  const obj = legacyObjectName(imageUrl);
  if (!obj || !obj.startsWith(LEGACY_PREFIX)) return imageUrl;
  const name = obj.slice(LEGACY_PREFIX.length);
  return RECOVERED.has(name) ? `/${LEGACY_PREFIX}${encodeURIComponent(name)}` : imageUrl;
}
