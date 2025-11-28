"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth";
import { storage } from "@/app/lib/firebaseClient";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

type Pub = {
  id?: string;
  title: string;
  authors?: string;
  venue?: string;
  year?: number | null;
  paperLink?: string;
  imageUrl?: string;
  imagePath?: string;
  tags?: string[];
  published?: boolean;
};

const toTags = (t: unknown): string[] => {
  if (Array.isArray(t))
    return t
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  if (typeof t === "string")
    return t
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);

export default function AdminPage() {
  // -----------------------------
  // 🔐 AUTH GUARD
  // -----------------------------
  const { user, loading, admin, signIn, logOut, getToken } = useAuth();

  if (loading) return <div className="p-6">Loading…</div>;

  // Not logged in → show Sign In
  if (!user) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Admin</h1>
        <button
          onClick={signIn}
          className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // Logged in but NOT admin → show Access Denied THEN redirect
  if (!admin?.isAdmin) {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        logOut();
        window.location.href = "/";
      }, 200000);
    }

    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl text-red-600">Access Denied</h1>
        <p>You are not authorized to access the admin panel.</p>
      </div>
    );
  }

  // -----------------------------
  // 📌 ADMIN ONLY FROM HERE
  // -----------------------------
  const [items, setItems] = useState<Pub[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [form, setForm] = useState<Pub>({
    title: "",
    authors: "",
    venue: "",
    year: null,
    paperLink: "",
    imageUrl: "",
    imagePath: "",
    tags: [],
    published: true,
  });

  // -----------------------------
  // FUNCTIONS
  // -----------------------------

  function resetForm() {
    setEditingId(null);
    setForm({
      title: "",
      authors: "",
      venue: "",
      year: null,
      paperLink: "",
      imageUrl: "",
      imagePath: "",
      tags: [],
      published: true,
    });
    setUploading(false);
    setUploadProgress(0);
  }

  const load = async () => {
    const res = await fetch("/api/pubs", { cache: "no-store" });
    const j = await res.json();
    setItems(j.publications || []);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((p) =>
      `${p.title} ${p.authors} ${p.venue} ${p.tags?.join(" ")}`
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  function startEdit(p: Pub) {
    setEditingId(p.id!);
    setForm({ ...p });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return alert("Select an image");

    setUploading(true);

    const safeName = `${slugify(
      form.title || "file"
    )}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const path = `publication-images/${safeName}`;
    const storageRef = ref(storage, path);

    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) =>
        setUploadProgress(
          Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
        ),
      () => {
        alert("Upload failed");
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setForm((f) => ({ ...f, imageUrl: url, imagePath: path }));
        setUploading(false);
      }
    );
  }

  async function removeImage() {
    if (!form.imagePath) {
      setForm((f) => ({ ...f, imageUrl: "", imagePath: "" }));
      return;
    }

    try {
      await deleteObject(ref(storage, form.imagePath));
    } catch {}
    setForm((f) => ({ ...f, imageUrl: "", imagePath: "" }));
  }

  async function save() {
    try {
      setSaving(true);
      const token = await getToken();
      const payload = { ...form, tags: toTags(form.tags || []) };

      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/pubs/${editingId}` : "/api/pubs";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      await load();
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    try {
      const token = await getToken();
      if (!confirm("Delete publication?")) return;

      setDeletingId(id);

      const res = await fetch(`/api/pubs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(await res.text());

      await load();
    } finally {
      setDeletingId(null);
    }
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-normal">Admin • Publications</h1>
        <div className="flex items-center gap-3 text-sm">
          <span>{user?.email}</span>
          <button className="underline" onClick={logOut}>
            Sign out
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-md border border-gray-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-normal">
            {editingId ? "Edit publication" : "Add new publication"}
          </h2>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-sm rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
            >
              New
            </button>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid gap-3 md:grid-cols-2">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Title</label>
            <input
              className="border border-gray-300 px-3 py-2"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Paper title"
            />
          </div>

          {/* Authors */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Authors</label>
            <input
              className="border border-gray-300 px-3 py-2"
              value={form.authors || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, authors: e.target.value }))
              }
              placeholder="Comma-separated authors"
            />
          </div>

          {/* Venue */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Venue</label>
            <input
              className="border border-gray-300 px-3 py-2"
              value={form.venue || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, venue: e.target.value }))
              }
              placeholder="e.g., arXiv, NeurIPS 2024"
            />
          </div>

          {/* Year */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Year</label>
            <input
              type="number"
              className="border border-gray-300 px-3 py-2"
              value={form.year ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  year: e.target.value ? Number(e.target.value) : null,
                }))
              }
              placeholder="2025"
            />
          </div>

          {/* Paper Link */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs text-gray-600">Paper Link</label>
            <input
              className="border border-gray-300 px-3 py-2"
              value={form.paperLink || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, paperLink: e.target.value }))
              }
              placeholder="https://arxiv.org/abs/..."
            />
          </div>

          {/* Image Upload */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs text-gray-600">Image</label>

            {form.imageUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={form.imageUrl}
                  className="h-24 w-24 object-cover border rounded"
                />
                <div className="flex gap-2">
                  <label className="cursor-pointer rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePickFile}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <label className="cursor-pointer rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePickFile}
                  />
                </label>
                {uploading && (
                  <span className="text-sm text-gray-600">
                    {uploadProgress}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs text-gray-600">Tags</label>
            <input
              className="border border-gray-300 px-3 py-2"
              value={toTags(form.tags).join(", ")}
              onChange={(e) =>
                setForm((f) => ({ ...f, tags: toTags(e.target.value) }))
              }
              placeholder="AI, ML, SciML"
            />
          </div>

          {/* Published */}
          <label className="inline-flex items-center gap-2 text-sm mt-1">
            <input
              type="checkbox"
              checked={!!form.published}
              onChange={(e) =>
                setForm((f) => ({ ...f, published: e.target.checked }))
              }
            />
            Published
          </label>
        </div>

        {/* Save */}
        <div className="mt-4">
          <button
            onClick={save}
            disabled={saving || uploading}
            className="rounded bg-vblue px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
          >
            {uploading
              ? "Uploading…"
              : saving
              ? "Saving…"
              : editingId
              ? "Update"
              : "Create"}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-normal">All publications</h2>
        <input
          className="border border-gray-300 px-3 py-2 text-sm"
          placeholder="Search title / authors / tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="rounded-md border border-gray-200 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Year</th>
              <th className="px-3 py-2">Venue</th>
              <th className="px-3 py-2">Tags</th>
              <th className="px-3 py-2">Published</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">{p.title}</td>
                <td className="px-3 py-2">{p.year}</td>
                <td className="px-3 py-2">{p.venue}</td>
                <td className="px-3 py-2">{p.tags?.join(", ")}</td>
                <td className="px-3 py-2">{p.published ? "Yes" : "No"}</td>
                <td className="px-3 py-2 space-x-3 whitespace-nowrap">
                  <button
                    className="text-vblue hover:underline"
                    onClick={() => startEdit(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline disabled:opacity-50"
                    disabled={deletingId === p.id}
                    onClick={() => del(p.id!)}
                  >
                    {deletingId === p.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-gray-600" colSpan={6}>
                  No publications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
