import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";
import { verifyAdminFromRequest } from "@/app/lib/adminGuard";

const json = (data: any, status = 200) => NextResponse.json(data, { status });

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await ctx.params;
  const id = (rawId || "").trim();
  if (!id) return json({ error: "Invalid id" }, 400);

  const doc = await db.collection("workshops").doc(id).get();
  if (!doc.exists) return json({ error: "Not found" }, 404);
  return json({ id: doc.id, ...(doc.data() as any) });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return json({ error: "Unauthorized" }, 401);

  const { id: rawId } = await ctx.params;
  const id = (rawId || "").trim();
  if (!id) return json({ error: "Invalid id" }, 400);

  const body = await req.json();
  const candidate: any = {
    title: typeof body.title === "string" ? body.title.trim() : undefined,
    fullName: typeof body.fullName === "string" ? body.fullName.trim() : undefined,
    hostConference:
      typeof body.hostConference === "string" ? body.hostConference.trim() : undefined,
    link: typeof body.link === "string" ? body.link.trim() : undefined,
    deadline: typeof body.deadline === "string" ? body.deadline.trim() : undefined,
    date: typeof body.date === "string" ? body.date.trim() : undefined,
    place: typeof body.place === "string" ? body.place.trim() : undefined,
    sub: typeof body.sub === "string" ? body.sub.trim() : undefined,
    published: typeof body.published === "boolean" ? body.published : undefined,
    updatedAt: new Date(),
  };

  const updates = Object.fromEntries(
    Object.entries(candidate).filter(([, v]) => v !== undefined)
  );

  try {
    await db.collection("workshops").doc(id).update(updates);
    return json({ id, ...updates });
  } catch (err: any) {
    console.error("[PATCH /api/workshops/:id]", err);
    return json({ error: err?.message || "Server error" }, 500);
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return json({ error: "Unauthorized" }, 401);

  const { id: rawId } = await ctx.params;
  const id = (rawId || "").trim();
  if (!id) return json({ error: "Invalid id" }, 400);

  try {
    const ref = db.collection("workshops").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return json({ error: `Not found (id=${id})` }, 404);
    await ref.delete();
    return json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/workshops/:id]", err);
    return json({ error: err?.message || "Server error" }, 500);
  }
}
