import { adminAuth } from './firebaseAdmin';

const ALLOWED = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export async function verifyAdminFromRequest(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = (decoded.email || '').toLowerCase();
    if (!email) return null;
    if (ALLOWED.length && !ALLOWED.includes(email)) return null;
    return { uid: decoded.uid, email };
  } catch {
    return null;
  }
}