// Client-side image upload helper for the admin dashboard.
//
// Images are resized/compressed in the browser and sent to /api/uploads, which
// stores them in Firestore. Replaces the Firebase Storage upload path.

export type UploadedImage = { url: string; path: string; size: number; contentType: string };

const MAX_DIMENSION = 1600;
const TARGET_BYTES = 700 * 1024; // stay well under the API's 900 KB limit

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Resize to at most 1600px and compress until the result fits the size budget. */
export async function compressImage(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const fitsAlready =
    file.size <= TARGET_BYTES && file.type !== 'image/gif' && Math.max(img.width, img.height) <= MAX_DIMENSION;
  if (fitsAlready) return file;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  // White backdrop so transparent PNGs look right if we end up with JPEG.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Prefer WebP; Safari may hand back PNG instead, in which case use JPEG.
  let type = 'image/webp';
  const probe = await canvasToBlob(canvas, type, 0.9);
  if (!probe || probe.type !== 'image/webp') type = 'image/jpeg';

  let best: Blob | null = null;
  for (const q of [0.9, 0.8, 0.7, 0.6, 0.5, 0.4]) {
    const blob = await canvasToBlob(canvas, type, q);
    if (!blob) continue;
    best = blob;
    if (blob.size <= TARGET_BYTES) break;
  }
  if (!best) throw new Error('Could not encode image');
  if (best.size > TARGET_BYTES) {
    throw new Error(`Image is still ${Math.round(best.size / 1024)} KB after compression; please use a smaller image.`);
  }
  return best;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(blob);
  });
}

export async function uploadImage(
  file: File,
  opts: { token: string; name?: string; folder?: string; onProgress?: (pct: number) => void }
): Promise<UploadedImage> {
  opts.onProgress?.(5);
  const blob = await compressImage(file);
  opts.onProgress?.(40);
  const data = await blobToBase64(blob);
  opts.onProgress?.(60);

  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opts.token}` },
    body: JSON.stringify({ name: opts.name || file.name, folder: opts.folder, contentType: blob.type, data }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || `Upload failed (${res.status})`);
  }
  opts.onProgress?.(100);
  return (await res.json()) as UploadedImage;
}

/** Deletes a previously uploaded image. Legacy Firebase Storage paths are ignored. */
export async function deleteUploadedImage(path: string | undefined, token: string | undefined) {
  if (!path || !token || !path.startsWith('uploads/')) return;
  const id = path.slice('uploads/'.length);
  try {
    await fetch(`/api/uploads/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  } catch {}
}
