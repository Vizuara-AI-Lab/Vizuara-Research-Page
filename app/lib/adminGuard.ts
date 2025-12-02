import { adminAuth, db } from './firebaseAdmin';


export async function verifyAdminFromRequest(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = (decoded.email || '').toLowerCase();
    if (!email) return null;

    const user = db.collection('Users').where('email', '==', email).where('role', '==', 'ADMIN').limit(1);
    const userSnapshot = await user.get();
    if (userSnapshot.empty) {
      return null;
    }
    return { uid: decoded.uid, email };
  } catch {
    return null;
  }
}
