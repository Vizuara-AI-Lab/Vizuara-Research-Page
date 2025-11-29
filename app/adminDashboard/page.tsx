// app/admin/page.tsx
"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { storage, auth } from "@/app/lib/firebaseClient";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

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

// Helper to get auth headers
const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await auth.currentUser?.getIdToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/auth");
    }
  }, [user, isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <AdminPanel />;
}

function AdminPanel() {
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

  const { logOut } = useAuth();
  const router = useRouter();

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
    try {
      const res = await fetch("/api/pubs", { cache: "no-store" });
      const j = await res.json().catch(() => ({ publications: [] }));
      const list = (j.publications || []).map((p: any) => ({
        ...p,
        tags: toTags(p.tags),
      })) as Pub[];
      setItems(list);
    } catch (err) {
      console.error("Failed to load publications:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((p) =>
      `${p.title} ${p.authors || ""} ${p.venue || ""} ${toTags(p.tags).join(" ")}`
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  function startEdit(p: Pub) {
    setEditingId(p.id!);
    setForm({ ...p, tags: toTags(p.tags) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Select an image");

    setUploading(true);

    const safeName = `${slugify(form.title || "file")}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
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
        if (form.imagePath && form.imagePath !== path) {
          try {
            await deleteObject(ref(storage, form.imagePath));
          } catch {}
        }
        const url = await getDownloadURL(task.snapshot.ref);
        setForm((f) => ({ ...f, imageUrl: url, imagePath: path }));
        setUploading(false);
      }
    );

    e.currentTarget.value = "";
  }

  async function removeImage() {
    if (form.imagePath) {
      try {
        await deleteObject(ref(storage, form.imagePath));
      } catch {}
    }
    setForm((f) => ({ ...f, imageUrl: "", imagePath: "" }));
  }

  async function save() {
    try {
      setSaving(true);

      if (!form.title.trim()) {
        alert("Title is required.");
        return;
      }

      const payload: Pub = {
        title: form.title.trim(),
        authors: (form.authors || "").trim(),
        venue: (form.venue || "").trim(),
        year: form.year ? Number(form.year) : null,
        paperLink: (form.paperLink || "").trim(),
        imageUrl: (form.imageUrl || "").trim(),
        imagePath: (form.imagePath || "").trim(),
        tags: toTags(form.tags || []),
        published: !!form.published,
      };

      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/pubs/${editingId}` : "/api/pubs";

      const res = await fetch(url, {
        method,
        headers: await getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      await load();
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    try {
      if (!confirm("Delete publication?")) return;

      setDeletingId(id);
      const res = await fetch(`/api/pubs/${id}`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());

      await load();
      if (editingId === id) resetForm();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const handleLogout = async () => {
    await logOut();
    router.push("/auth");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-normal">Admin • Publications</h1>
        <button
          onClick={handleLogout}
          className="text-base sm:text-lg text-gray-600 hover:text-red-600 underline self-start sm:self-auto"
        >
          Logout
        </button>
      </div>

      {/* Editor */}
      <div className="rounded-md border border-gray-200 p-3 sm:p-4">
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-normal">
            {editingId ? "Edit publication" : "Add new publication"}
          </h2>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-sm rounded border border-gray-300 px-2 py-1 hover:bg-gray-50 self-start sm:self-auto"
            >
              New
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Title</label>
            <input
              className="border border-gray-300 px-3 py-2 rounded text-sm sm:text-base"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Paper title"
            />
          </div>

          {/* Authors */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Authors</label>
            <input
              className="border border-gray-300 px-3 py-2 rounded text-sm sm:text-base"
              value={form.authors || ""}
              onChange={(e) => setForm((f) => ({ ...f, authors: e.target.value }))}
              placeholder="Comma-separated authors"
            />
          </div>

          {/* Venue */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Venue</label>
            <input
              className="border border-gray-300 px-3 py-2 rounded text-sm sm:text-base"
              value={form.venue || ""}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
              placeholder="e.g., arXiv, NeurIPS 2024"
            />
          </div>

          {/* Year */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Year</label>
            <input
              type="number"
              className="border border-gray-300 px-3 py-2 rounded text-sm sm:text-base"
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
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs text-gray-600">Paper Link</label>
            <input
              className="border border-gray-300 px-3 py-2 rounded text-sm sm:text-base"
              value={form.paperLink || ""}
              onChange={(e) => setForm((f) => ({ ...f, paperLink: e.target.value }))}
              placeholder="https://arxiv.org/abs/..."
            />
          </div>

          {/* Image */}
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs text-gray-600">Image</label>
            {form.imageUrl ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <img
                  src={form.imageUrl}
                  alt="Preview"
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
                {uploading && (
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                )}
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
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs text-gray-600">Tags</label>
            <input
              className="border border-gray-300 px-3 py-2 rounded text-sm sm:text-base"
              value={toTags(form.tags).join(", ")}
              onChange={(e) => setForm((f) => ({ ...f, tags: toTags(e.target.value) }))}
              placeholder="AI, ML, SciML"
            />
          </div>

          {/* Published */}
          <label className="inline-flex items-center gap-2 text-sm mt-1">
            <input
              type="checkbox"
              checked={!!form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            />
            Published
          </label>
        </div>

        <div className="mt-4">
          <button
            onClick={save}
            disabled={saving || uploading}
            className="rounded bg-blue-600 px-4 py-2 text-white text-sm sm:text-base hover:bg-blue-700 disabled:opacity-60"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-normal">All publications</h2>
        <input
          className="border border-gray-300 px-3 py-2 text-sm rounded w-full sm:w-64"
          placeholder="Search title / authors / tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List - Mobile Cards */}
      <div className="sm:hidden space-y-4">
        {filtered.map((p) => (
          <div key={p.id} className="border border-gray-200 rounded-md p-4 space-y-2">
            <h3 className="font-medium">{p.title}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Year:</span> {p.year ?? "—"}</p>
              <p><span className="font-medium">Venue:</span> {p.venue ?? "—"}</p>
              <p><span className="font-medium">Tags:</span> {toTags(p.tags).join(", ") || "—"}</p>
              <p><span className="font-medium">Published:</span> {p.published ? "Yes" : "No"}</p>
            </div>
            <div className="flex gap-4 pt-2">
              <button
                className="text-blue-600 hover:underline text-sm"
                onClick={() => startEdit(p)}
              >
                Edit
              </button>
              <button
                className="text-red-600 hover:underline text-sm disabled:opacity-50"
                disabled={deletingId === p.id}
                onClick={() => del(p.id!)}
              >
                {deletingId === p.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-600 text-center py-4">No publications found.</p>
        )}
      </div>

      {/* List - Desktop Table */}
      <div className="hidden sm:block rounded-md border border-gray-200 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Year</th>
              <th className="px-3 py-2 font-medium">Venue</th>
              <th className="px-3 py-2 font-medium">Tags</th>
              <th className="px-3 py-2 font-medium">Published</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">{p.title}</td>
                <td className="px-3 py-2">{p.year ?? ""}</td>
                <td className="px-3 py-2">{p.venue ?? ""}</td>
                <td className="px-3 py-2">{toTags(p.tags).join(", ")}</td>
                <td className="px-3 py-2">{p.published ? "Yes" : "No"}</td>
                <td className="px-3 py-2 space-x-3 whitespace-nowrap">
                  <button
                    className="text-blue-600 hover:underline"
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