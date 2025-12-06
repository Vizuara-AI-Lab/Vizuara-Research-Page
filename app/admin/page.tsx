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

type Team = {
  id?: string;
  name: string;
  title: string;
  education?: string;
  linkedInUrl?: string;
  imageUrl?: string;
  imagePath?: string;
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
  const [tagsInput, setTagsInput] = useState("");

  const {
    user,
    loading,
    admin,
    adminLoading,
    adminChecked,
    signIn,
    logOut,
    getToken,
  } = useAuth() as any;

  if (loading || adminLoading || !adminChecked) {
    return <div className="p-4 sm:p-6">Checking access…</div>;
  }

  if (!user) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <h1 className="text-xl font-semibold">Admin</h1>
        <button
          onClick={signIn}
          className="w-full sm:w-auto rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  if (!admin?.isAdmin) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl text-red-600">Access Denied</h1>
          <div className="text-sm flex items-center gap-3">
            <span className="text-gray-600">{user.email}</span>
            <button className="underline" onClick={logOut}>
              Sign out
            </button>
          </div>
        </div>
        <p>You are not authorized to access the admin panel.</p>
        <a href="/" className="underline text-vblue">
          Go to home →
        </a>
      </div>
    );
  }

  return (
    <AdminPanel
      userEmail={user.email || ""}
      getToken={getToken}
      logOut={logOut}
    />
  );
}

function TeamEditor({
  getToken,
}: {
  getToken: () => Promise<string | undefined>;
}) {
  const [team, setTeam] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [form, setForm] = useState<Team>({
    name: "",
    title: "",
    education: "",
    linkedInUrl: "",
    imageUrl: "",
    imagePath: "",
    published: true,
  });

  async function loadTeam() {
    const res = await fetch("/api/team", { cache: "no-store" });
    const j = await res.json().catch(() => ({ members: [] }));
    setTeam(j.members || []);
  }

  useEffect(() => {
    loadTeam();
  }, []);

  const filteredTeam = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return team;
    return team.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        (m.education || "").toLowerCase().includes(q)
    );
  }, [team, search]);

  function reset() {
    setEditingId(null);
    setForm({
      name: "",
      title: "",
      education: "",
      linkedInUrl: "",
      imageUrl: "",
      imagePath: "",
      published: true,
    });
  }

  function startEdit(member: Team) {
    setEditingId(member.id!);
    setForm({ ...member });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Select an image");
    setUploading(true);

    const safeName = `${slugify(
      form.name || "team"
    )}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const path = `team/${safeName}`;
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

  async function save() {
    setSaving(true);
    const token = await getToken();
    if (!token) return alert("Not authorized");
    const payload = { ...form, published: !!form.published };
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/team/${editingId}` : `/api/team`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) alert(await res.text());
    await loadTeam();
    reset();
    setSaving(false);
  }

  async function del(id: string) {
    if (!confirm("Delete member?")) return;
    const token = await getToken();
    setDeletingId(id);
    await fetch(`/api/team/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeletingId(null);
    await loadTeam();
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Form section */}
      <div className="border p-4 rounded-md">
        <h2 className="text-lg mb-3">
          {editingId ? "Edit Member" : "Add Member"}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="border px-3 py-2 w-full text-sm"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="border px-3 py-2 w-full text-sm"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            className="border px-3 py-2 w-full text-sm"
            placeholder="Education"
            value={form.education}
            onChange={(e) =>
              setForm((f) => ({ ...f, education: e.target.value }))
            }
          />
          <input
            className="border px-3 py-2 w-full text-sm"
            placeholder="LinkedIn URL"
            value={form.linkedInUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, linkedInUrl: e.target.value }))
            }
          />

          <div className="col-span-2">
            <label className="text-xs text-gray-600">Image</label>
            {form.imageUrl ? (
              <div className="flex flex-wrap items-center gap-3">
                <img
                  src={form.imageUrl}
                  className="h-16 w-16 sm:h-20 sm:w-20 object-cover border rounded"
                />
                <label className="cursor-pointer px-3 py-1 border rounded text-sm">
                  Replace
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={pickFile}
                  />
                </label>
                {uploading && <span>{uploadProgress}%</span>}
              </div>
            ) : (
              <label className="cursor-pointer px-3 py-1 border rounded text-sm">
                Upload image
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={pickFile}
                />
              </label>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
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
        <button
          disabled={saving}
          onClick={save}
          className="mt-4 w-full sm:w-auto bg-vblue text-white px-4 py-2 rounded"
        >
          {saving ? "Saving…" : editingId ? "Update" : "Create"}
        </button>
      </div>

      {/* Toolbar with search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-normal">All Team Members</h2>
        <input
          className="border border-gray-300 px-3 py-2 text-sm w-full sm:w-auto"
          placeholder="Search by name, title, education…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="w-full overflow-x-auto rounded-md border">
        <table className="min-w-[500px] sm:min-w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeam.map((m) => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">{m.name}</td>
                <td className="px-3 py-2">{m.title}</td>
                <td className="px-3 py-2 space-x-2">
                  <button className="text-vblue" onClick={() => startEdit(m)}>
                    Edit
                  </button>
                  <button
                    className="text-red-600"
                    disabled={deletingId === m.id}
                    onClick={() => del(m.id!)}
                  >
                    {deletingId === m.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {!filteredTeam.length && (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-gray-600">
                  No team members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminPanel({
  userEmail,
  getToken,
  logOut,
}: {
  userEmail: string;
  getToken: () => Promise<string | undefined>;
  logOut: () => void | Promise<void>;
}) {
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

  const load = async () => {
    const res = await fetch("/api/pubs", { cache: "no-store" });
    const j = await res.json().catch(() => ({ publications: [] }));
    const list = (j.publications || []).map((p: any) => ({
      ...p,
      tags: toTags(p.tags),
    })) as Pub[];
    setItems(list);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((p) =>
      `${p.title} ${p.authors || ""} ${p.venue || ""} ${toTags(p.tags).join(
        " "
      )}`
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  function startEdit(p: Pub) {
    setEditingId(p.id!);
    setForm({ ...p, tags: toTags(p.tags) });
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
      const token = await getToken();
      if (!token) return alert("Please sign in with an admin account.");
      if (!form.title.trim()) return alert("Title is required.");

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
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
    } catch (err: any) {
      alert(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    try {
      const token = await getToken();
      if (!token) return alert("Please sign in with an admin account.");
      if (!confirm("Delete publication?")) return;
      setDeletingId(id);
      const res = await fetch(`/api/pubs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
      if (editingId === id) setEditingId(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-8 overflow-x-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-normal">
          Admin • Publications
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>{userEmail}</span>
          <button className="underline" onClick={logOut}>
            Sign out
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-md border border-gray-200 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-normal">
            {editingId ? "Edit publication" : "Add new publication"}
          </h2>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
              }}
              className="text-sm rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
            >
              New
            </button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="border border-gray-300 px-3 py-2 w-full text-sm"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            className="border border-gray-300 px-3 py-2 w-full text-sm"
            placeholder="Authors"
            value={form.authors || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, authors: e.target.value }))
            }
          />
          <input
            className="border border-gray-300 px-3 py-2 w-full text-sm"
            placeholder="Venue"
            value={form.venue || ""}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
          />
          <input
            type="number"
            className="border border-gray-300 px-3 py-2 w-full text-sm"
            placeholder="Year"
            value={form.year ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                year: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
          <input
            className="border border-gray-300 px-3 py-2 md:col-span-2 w-full text-sm"
            placeholder="Paper Link"
            value={form.paperLink || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, paperLink: e.target.value }))
            }
          />

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs text-gray-600">Image</label>
            {form.imageUrl ? (
              <div className="flex flex-wrap items-center gap-3">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="h-20 w-20 sm:h-24 sm:w-24 object-cover border rounded"
                />
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
                {uploading && (
                  <span className="text-sm text-gray-600">
                    {uploadProgress}%
                  </span>
                )}
              </div>
            ) : (
              <label className="cursor-pointer rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 w-fit">
                Upload image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePickFile}
                />
              </label>
            )}
          </div>

          <input
            className="border border-gray-300 px-3 py-2 md:col-span-2 w-full text-sm"
            placeholder="Tags (AI, ML, SciML)"
            value={toTags(form.tags).join(", ")}
            onChange={(e) =>
              setForm((f) => ({ ...f, tags: toTags(e.target.value) }))
            }
          />

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

        <div className="mt-4">
          <button
            onClick={save}
            disabled={saving || uploading}
            className="w-full sm:w-auto rounded bg-vblue px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-normal">All publications</h2>
        <input
          className="border border-gray-300 px-3 py-2 text-sm w-full sm:w-auto"
          placeholder="Search title / authors / tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="w-full overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-[700px] sm:min-w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Year</th>
              <th className="px-3 py-2">Venue</th>
              <th className="px-3 py-2">Tags</th>
              <th className="px-3 py-2">Published</th>
              <th className="px-3 py-2">Actions</th>
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
                <td className="px-3 py-2 whitespace-nowrap space-x-2">
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

      <div className="mt-12 sm:mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-normal">
            Admin • Team Members
          </h1>
        </div>
        <TeamEditor getToken={getToken} />
      </div>
    </div>
  );
}
