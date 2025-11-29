import { COLLECTION } from '../types/constants';
import { adminAuth,db } from './firebaseAdmin';


export async function verifyAdminFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Look up user in Firestore, same as client AuthGuard
    const snap = await db
      .collection(COLLECTION.USERS)
      .doc(uid)
      .get();

    if (!snap.exists) return null;

    const data = snap.data() as { role?: string; email?: string } | undefined;
    if (data?.role !== "ADMIN") return null;

    const email = (data.email || decoded.email || "").toLowerCase();

    return { uid, email };
  } catch (err) {
    console.error("[verifyAdminFromRequest] error:", err);
    return null;
  }
}