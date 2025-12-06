import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import { verifyAdminFromRequest } from '@/app/lib/adminGuard';

// export async function GET() {
//   const snap = await db.collection("teamMembers").orderBy("name").get();
//   const members = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//   return NextResponse.json({ members });
// }

// export async function POST(req: Request) {
//   await verifyAdminFromRequest(req);

//   const body = await req.json();
//   const ref = await db.collection("teamMembers").add({
//     ...body,
//     createdAt: Date.now(),
//   });

//   return NextResponse.json({ id: ref.id }, { status: 201 });
// }

export async function GET() {
  const snap = await db.collection("teamMembers").get();
  return NextResponse.json({
    members: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
  });
}

export async function POST(req: Request) {
  const data = await req.json();
  const doc = await db.collection("teamMembers").add(data);
  return NextResponse.json({ id: doc.id });
}
