"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth";
import WorkshopsEditor from "./WorkshopsEditor";
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

const campaignImages = (post: PostCampaign) => {
  const urls = Array.isArray(post.imageUrls) ? post.imageUrls.filter(Boolean) : [];
  return urls.length ? urls : post.imageUrl ? [post.imageUrl] : [];
};

const campaignImagePaths = (post: PostCampaign) => {
  const paths = Array.isArray(post.imagePaths) ? post.imagePaths.filter(Boolean) : [];
  return paths.length ? paths : post.imagePath ? [post.imagePath] : [];
};

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
    <AdminShell
      userEmail={user.email || ""}
      getToken={getToken}
      logOut={logOut}
    />
  );
}

type TabKey =
  | "publications"
  | "team"
  | "workshops"
  | "postCampaigns"
  | "testimonials"
  | "quotes"
  | "faqs";

type Testimonial = {
  id?: string;
  postUrl: string;
  author: string;
  context?: string;
};

type Quote = {
  id?: string;
  text: string;
  name: string;
  role?: string;
};

type FAQ = {
  id?: string;
  question: string;
  answer: string;
};

type PostCampaign = {
  id?: string;
  title: string;
  caption: string;
  platform?: string;
  destinationUrl: string;
  slug?: string;
  imageUrl?: string;
  imagePath?: string;
  imageUrls?: string[];
  imagePaths?: string[];
  clickCount?: number;
  published?: boolean;
};

function AdminShell({
  userEmail,
  getToken,
  logOut,
}: {
  userEmail: string;
  getToken: () => Promise<string | undefined>;
  logOut: () => void | Promise<void>;
}) {
  const [tab, setTab] = useState<TabKey>("publications");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "publications", label: "Publications" },
    { key: "team", label: "Team Members" },
    { key: "workshops", label: "Workshops" },
    { key: "postCampaigns", label: "Post Campaigns" },
    { key: "testimonials", label: "Testimonials" },
    { key: "quotes", label: "Quotes" },
    { key: "faqs", label: "FAQs" },
  ];

  const activeLabel = tabs.find((t) => t.key === tab)?.label || "";

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside
        className={`${
          mobileNavOpen ? "flex" : "hidden"
        } md:flex fixed md:sticky top-0 left-0 z-30 h-screen w-64 shrink-0 flex-col border-r border-border bg-surface`}
      >
        <div className="p-5 border-b border-border">
          <div className="text-sm font-semibold text-fg">Admin Panel</div>
          <div className="mt-1 text-xs text-fg-muted truncate" title={userEmail}>
            {userEmail}
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setMobileNavOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                tab === t.key
                  ? "bg-accent text-white"
                  : "text-fg hover:bg-surface-alt"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={logOut}
            className="w-full text-left px-3 py-2 rounded-md text-sm text-fg-muted hover:bg-surface-alt cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border bg-surface/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen((v) => !v)}
              className="md:hidden p-1.5 rounded border border-border cursor-pointer"
              aria-label="Toggle nav"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-fg">
              {activeLabel}
            </h1>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {tab === "publications" && <AdminPanel getToken={getToken} />}
          {tab === "team" && <TeamEditor getToken={getToken} />}
          {tab === "workshops" && <WorkshopsEditor getToken={getToken} />}
          {tab === "postCampaigns" && <PostCampaignsEditor getToken={getToken} />}
          {tab === "testimonials" && <TestimonialsEditor getToken={getToken} />}
          {tab === "quotes" && <QuotesEditor getToken={getToken} />}
          {tab === "faqs" && <FAQsEditor getToken={getToken} />}
        </div>
      </main>
    </div>
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
    // Scroll to the Team section headline
    document
      .getElementById("team-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  async function removeImage() {
    if (form.imagePath) {
      try {
        await deleteObject(ref(storage, form.imagePath));
      } catch {}
    }
    setForm((f) => ({ ...f, imageUrl: "", imagePath: "" }));
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
    <div id="team-section" className="space-y-6 mt-6 scroll-mt-20">
      {/* Form */}
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

          {/* Image upload section */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs text-gray-600 block mb-1">Image</label>
            {form.imageUrl ? (
              <div className="flex flex-wrap items-center gap-4">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="h-20 w-20 sm:h-24 sm:w-24 object-cover border rounded"
                />
                <div className="flex flex-wrap items-center gap-2">
                  {/* Replace */}
                  <label className="cursor-pointer rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={pickFile}
                    />
                  </label>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={removeImage}
                    className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    Remove
                  </button>

                  {/* Upload progress */}
                  {uploading && (
                    <span className="text-sm text-gray-600">
                      {uploadProgress}%
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <label className="cursor-pointer rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 w-fit">
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={pickFile}
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

      {/* Search bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-normal">All Team Members</h2>
        <input
          className="border border-gray-300 px-3 py-2 text-sm w-full sm:w-auto"
          placeholder="Search by name, title, education…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-md border">
        <table className="min-w-[600px] sm:min-w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeam.map((m) => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 align-top">{m.name}</td>
                <td className="px-3 py-2 align-top">{m.title}</td>
                <td className="px-3 py-2 align-top space-x-2">
                  <button
                    className="text-vblue hover:underline"
                    onClick={() => startEdit(m)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline disabled:opacity-50"
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
  getToken,
}: {
  getToken: () => Promise<string | undefined>;
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
    <div className="space-y-8 overflow-x-auto">
      {/* Editor */}
      <div className="rounded-md border border-blue-200 bg-blue-50/45 p-4 shadow-sm">
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
  <table className="min-w-[900px] sm:min-w-full text-xs sm:text-sm table-fixed">
    <thead>
      <tr className="bg-gray-50 border-b">
        {/* Title: wide, left */}
        <th className="px-3 py-2 text-left w-[40%]">Title</th>
        {/* Year: narrow, center */}
        <th className="px-3 py-2 text-center w-[6rem]">Year</th>
        {/* Venue: medium, left */}
        <th className="px-3 py-2 text-left w-[12rem]">Venue</th>
        {/* Tags: medium, left */}
        <th className="px-3 py-2 text-left w-[12rem]">Tags</th>
        {/* Thumb: narrow, center */}
        <th className="px-3 py-2 text-center w-[5rem]">Thumb</th>
        {/* Published: narrow, center */}
        <th className="px-3 py-2 text-center w-[6rem]">Published</th>
        {/* Actions: narrow, center */}
        <th className="px-3 py-2 text-center w-[7rem]">Actions</th>
      </tr>
    </thead>
    <tbody>
      {filtered.map((p) => (
        <tr key={p.id} className="border-b hover:bg-gray-50">
          <td className="px-3 py-2 align-middle text-left">{p.title}</td>
          <td className="px-3 py-2 align-middle text-center">
            {p.year ?? ""}
          </td>
          <td className="px-3 py-2 align-middle text-left">
            {p.venue ?? ""}
          </td>
          <td className="px-3 py-2 align-middle text-left">
            {toTags(p.tags).join(", ")}
          </td>
          <td className="px-3 py-2 align-middle text-center">
            {p.imageUrl ? (
              <img
                src={p.imageUrl}
                alt={p.title}
                className="h-10 w-10 object-cover rounded border mx-auto"
              />
            ) : (
              <span className="text-gray-400 text-[11px] italic">
                No image
              </span>
            )}
          </td>
          <td className="px-3 py-2 align-middle text-center">
            {p.published ? "Yes" : "No"}
          </td>
          <td className="px-3 py-2 align-middle text-center whitespace-nowrap space-x-2">
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
          <td className="px-3 py-4 text-gray-600 text-left" colSpan={7}>
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

function PostCampaignsEditor({
  getToken,
}: {
  getToken: () => Promise<string | undefined>;
}) {
  const [items, setItems] = useState<PostCampaign[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingPreviews, setPendingPreviews] = useState<
    { url: string; name: string }[]
  >([]);

  const [form, setForm] = useState<PostCampaign>({
    title: "",
    caption: "",
    platform: "",
    destinationUrl: "/",
    slug: "",
    imageUrl: "",
    imagePath: "",
    imageUrls: [],
    imagePaths: [],
    published: true,
  });

  const trackingUrl = (post: PostCampaign) => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://research.vizuara.ai";
    return `${origin}/r/${post.slug || ""}`;
  };

  async function load() {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/post-campaigns", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await res.json().catch(() => ({ posts: [] }));
    if (!res.ok) {
      alert(j?.error || "Could not load post campaigns.");
      return;
    }
    setItems(j.posts || []);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((p) =>
      `${p.title} ${p.caption} ${p.platform || ""} ${p.slug || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  function reset() {
    setEditingId(null);
    pendingPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    setPendingPreviews([]);
    setForm({
      title: "",
      caption: "",
      platform: "",
      destinationUrl: "/",
      slug: "",
      imageUrl: "",
      imagePath: "",
      imageUrls: [],
      imagePaths: [],
      published: true,
    });
  }

  function startEdit(post: PostCampaign) {
    setEditingId(post.id!);
    setForm({
      title: post.title || "",
      caption: post.caption || "",
      platform: post.platform || "",
      destinationUrl: post.destinationUrl || "/",
      slug: post.slug || "",
      imageUrl: post.imageUrl || "",
      imagePath: post.imagePath || "",
      imageUrls: campaignImages(post),
      imagePaths: campaignImagePaths(post),
      published: post.published !== false,
    });
    document
      .getElementById("post-campaign-editor")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (files.some((file) => !file.type.startsWith("image/"))) {
      return alert("Select image files only");
    }
    const previews = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setPendingPreviews((current) => [...current, ...previews]);
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploaded = await Promise.all(
        files.map(
          (file, index) =>
            new Promise<{ url: string; path: string }>((resolve, reject) => {
              const safeName = `${slugify(
                form.title || "post"
              )}-${Date.now()}-${index}-${file.name.replace(/\s+/g, "_")}`;
              const path = `publication-images/post-campaign-${safeName}`;
              const storageRef = ref(storage, path);
              const task = uploadBytesResumable(storageRef, file);

              task.on(
                "state_changed",
                (snap) =>
                  setUploadProgress(
                    Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
                  ),
                reject,
                async () => {
                  const url = await getDownloadURL(task.snapshot.ref);
                  resolve({ url, path });
                }
              );
            })
        )
      );

      setForm((f) => {
        const imageUrls = [
          ...(f.imageUrls || []),
          ...uploaded.map((item) => item.url),
        ];
        const imagePaths = [
          ...(f.imagePaths || []),
          ...uploaded.map((item) => item.path),
        ];
        return {
          ...f,
          imageUrls,
          imagePaths,
          imageUrl: imageUrls[0] || "",
          imagePath: imagePaths[0] || "",
        };
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setPendingPreviews((current) =>
        current.filter(
          (preview) => !previews.some((item) => item.url === preview.url)
        )
      );
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    }

    input.value = "";
  }

  async function removeImage(pathToRemove?: string) {
    const path = pathToRemove || form.imagePath;
    if (path) {
      try {
        await deleteObject(ref(storage, path));
      } catch {}
    }
    setForm((f) => {
      const imagePaths = (f.imagePaths || []).filter((item) => item !== path);
      const imageUrls = (f.imageUrls || []).filter(
        (_, index) => (f.imagePaths || [])[index] !== path
      );
      return {
        ...f,
        imageUrls,
        imagePaths,
        imageUrl: imageUrls[0] || "",
        imagePath: imagePaths[0] || "",
      };
    });
  }

  async function save() {
    if (!form.caption.trim()) return alert("Caption is required.");
    if (!campaignImages(form).length) return alert("Post image is required.");
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return alert("Please sign in with an admin account.");
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/post-campaigns/${editingId}`
        : "/api/post-campaigns";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          caption: form.caption.trim(),
          platform: (form.platform || "").trim(),
          destinationUrl: (form.destinationUrl || "/").trim(),
          slug: (form.slug || "").trim(),
          imageUrl: campaignImages(form)[0],
          imagePath: campaignImagePaths(form)[0] || "",
          imageUrls: campaignImages(form),
          imagePaths: campaignImagePaths(form),
          published: form.published !== false,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Save failed");
      reset();
      await load();
    } catch (err: any) {
      alert(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function del(post: PostCampaign) {
    if (!confirm("Delete this post campaign?")) return;
    setDeletingId(post.id!);
    try {
      const token = await getToken();
      if (!token) return alert("Please sign in with an admin account.");
      const res = await fetch(`/api/post-campaigns/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Delete failed");
      await Promise.all(
        campaignImagePaths(post).map(async (path) => {
          try {
            await deleteObject(ref(storage, path));
          } catch {}
        })
      );
      if (editingId === post.id) reset();
      await load();
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function copyUrl(post: PostCampaign) {
    const url = trackingUrl(post);
    await navigator.clipboard.writeText(url);
    setCopiedId(post.id || null);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  return (
    <div id="post-campaign-editor" className="space-y-6 mt-6 scroll-mt-20">
      <div className="rounded-md border border-gray-200 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-normal">
            {editingId ? "Edit post campaign" : "Add post campaign"}
          </h2>
          {editingId && (
            <button
              onClick={reset}
              className="rounded border border-blue-200 bg-white px-3 py-1 text-sm hover:bg-blue-50"
            >
              New
            </button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-gray-600">Internal title</span>
            <input
              className="border border-blue-200 bg-white px-3 py-2 w-full text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Optional, generated from caption if empty"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-gray-600">Platform</span>
            <input
              className="border border-blue-200 bg-white px-3 py-2 w-full text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="LinkedIn, X, Email..."
              value={form.platform || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, platform: e.target.value }))
              }
            />
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="text-xs text-gray-600">Post caption / script *</span>
            <textarea
              className="min-h-36 border border-blue-200 bg-white px-3 py-2 w-full text-sm leading-6 focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Paste the full post content here."
              value={form.caption}
              onChange={(e) =>
                setForm((f) => ({ ...f, caption: e.target.value }))
              }
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-gray-600">Destination after click</span>
            <input
              className="border border-blue-200 bg-white px-3 py-2 w-full text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="/ or /publications"
              value={form.destinationUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, destinationUrl: e.target.value }))
              }
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-gray-600">Custom URL slug</span>
            <input
              className="border border-blue-200 bg-white px-3 py-2 w-full text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="auto-generated if empty"
              value={form.slug || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: e.target.value }))
              }
            />
          </label>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-xs text-gray-600">Post image(s) *</label>
            {campaignImages(form).length || pendingPreviews.length ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  {campaignImages(form).map((url, index) => (
                    <div key={`${url}-${index}`} className="relative">
                      <img
                        src={url}
                        alt={`Post preview ${index + 1}`}
                        className="h-24 w-24 object-cover rounded border border-blue-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(campaignImagePaths(form)[index])}
                        className="absolute right-1 top-1 rounded bg-white/90 px-2 py-0.5 text-xs text-red-600 shadow"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  {pendingPreviews.map((preview) => (
                    <div key={preview.url} className="relative">
                      <img
                        src={preview.url}
                        alt={preview.name}
                        className="h-24 w-24 object-cover rounded border border-blue-200 opacity-75"
                      />
                      <span className="absolute inset-x-1 bottom-1 rounded bg-black/70 px-1 py-0.5 text-center text-[10px] text-white">
                        Uploading
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer rounded border border-blue-200 bg-white px-3 py-1 text-sm hover:bg-blue-50">
                  Add images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={pickFile}
                  />
                </label>
                {uploading && (
                  <span className="text-sm text-gray-600">
                    {uploadProgress}%
                  </span>
                )}
              </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer rounded border border-blue-200 bg-white px-3 py-1 text-sm hover:bg-blue-50 w-fit">
                  Upload image(s)
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={pickFile}
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

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published !== false}
              onChange={(e) =>
                setForm((f) => ({ ...f, published: e.target.checked }))
              }
            />
            Active
          </label>
        </div>

        <button
          disabled={saving || uploading}
          onClick={save}
          className="mt-4 w-full sm:w-auto rounded bg-accent px-4 py-2 text-white hover:bg-accent-hover disabled:bg-blue-200 disabled:text-blue-700"
        >
          {uploading
            ? "Uploading..."
            : saving
            ? "Saving..."
            : editingId
            ? "Update campaign"
            : "Create campaign"}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-normal">All post campaigns</h2>
          <p className="text-sm text-gray-600">
            Use the generated URL in your post. Clicks update when visitors open it.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <input
            className="border border-gray-300 px-3 py-2 text-sm w-full sm:w-72"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={load}
            className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            Refresh counts
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((post) => {
          const isExpanded = expandedId === post.id;
          const url = trackingUrl(post);
          const images = campaignImages(post);

          return (
            <article
              key={post.id}
              className="flex min-h-[430px] flex-col overflow-hidden rounded-md border border-gray-200 bg-white"
            >
              <div className="relative aspect-[1.35] w-full bg-gray-100">
                {images.length ? (
                  <>
                    <img
                      src={images[0]}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                    {images.length > 1 && (
                      <div className="absolute inset-x-0 bottom-0 flex gap-1 overflow-x-auto bg-black/45 p-2">
                        {images.map((image, index) => (
                          <img
                            key={`${image}-${index}`}
                            src={image}
                            alt={`${post.title} ${index + 1}`}
                            className="h-10 w-10 shrink-0 rounded border border-white/60 object-cover"
                          />
                        ))}
                      </div>
                    )}
                    {images.length > 1 && (
                      <div className="absolute right-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                        {images.length} images
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    No image
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium text-fg">{post.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {post.platform || "No platform"} · {post.published === false ? "Inactive" : "Active"}
                    </p>
                  </div>
                  <div className="shrink-0 rounded border border-gray-200 px-2 py-1 text-right">
                    <div className="text-lg font-semibold leading-none text-fg">
                      {post.clickCount || 0}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">clicks</div>
                  </div>
                </div>

                <p
                  className={`text-sm leading-6 text-gray-700 ${
                    isExpanded ? "" : "line-clamp-4"
                  }`}
                >
                  {post.caption}
                </p>
                {post.caption.length > 180 && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : post.id!)}
                    className="w-fit text-sm text-vblue hover:underline"
                  >
                    {isExpanded ? "View less" : "View more"}
                  </button>
                )}

                <div className="mt-auto space-y-2">
                  <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 break-all">
                    {url}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => copyUrl(post)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      {copiedId === post.id ? "Copied" : "Copy URL"}
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Test
                    </a>
                    <button
                      onClick={() => startEdit(post)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      disabled={deletingId === post.id}
                      onClick={() => del(post)}
                      className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === post.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {!filtered.length && (
          <div className="rounded-md border border-gray-200 p-6 text-sm text-gray-600 md:col-span-2 xl:col-span-3">
            No post campaigns yet. Create one above to get a tracking URL.
          </div>
        )}
      </div>
    </div>
  );
}

function TestimonialsEditor({
  getToken,
}: {
  getToken: () => Promise<string | undefined>;
}) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [form, setForm] = useState<Testimonial>({
    postUrl: "",
    author: "",
    context: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/testimonials", { cache: "no-store" });
    const j = await res.json().catch(() => ({ testimonials: [] }));
    setItems(j.testimonials || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!form.postUrl.trim()) return alert("LinkedIn URL is required.");
    if (!form.author.trim()) return alert("Author name is required.");
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return alert("Please sign in with an admin account.");
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          postUrl: form.postUrl.trim(),
          author: form.author.trim(),
          context: (form.context || "").trim(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setForm({ postUrl: "", author: "", context: "" });
      await load();
    } catch (err: any) {
      alert(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    setDeletingId(id);
    try {
      const token = await getToken();
      if (!token) return alert("Please sign in with an admin account.");
      const res = await fetch(`/api/testimonials/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="border p-4 rounded-md">
        <h2 className="text-lg mb-3">Add Testimonial</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="border px-3 py-2 w-full text-sm md:col-span-2"
            placeholder="LinkedIn Post URL"
            value={form.postUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, postUrl: e.target.value }))
            }
          />
          <input
            className="border px-3 py-2 w-full text-sm"
            placeholder="Author name"
            value={form.author}
            onChange={(e) =>
              setForm((f) => ({ ...f, author: e.target.value }))
            }
          />
          <input
            className="border px-3 py-2 w-full text-sm"
            placeholder="Short description (e.g. NeurIPS Spotlight)"
            value={form.context || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, context: e.target.value }))
            }
          />
        </div>
        <button
          disabled={saving}
          onClick={save}
          className="mt-4 w-full sm:w-auto rounded bg-vblue px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Create"}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-normal">All Testimonials</h2>
      </div>

      <div className="w-full overflow-x-auto rounded-md border">
        <table className="min-w-[600px] sm:min-w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-3 py-2">Author</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50 align-top">
                <td className="px-3 py-2">{t.author}</td>
                <td className="px-3 py-2">{t.context || ""}</td>
                <td className="px-3 py-2 break-all max-w-[360px]">
                  <a
                    href={t.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-vblue hover:underline"
                  >
                    {t.postUrl}
                  </a>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <button
                    className="text-red-600 hover:underline disabled:opacity-50"
                    disabled={deletingId === t.id}
                    onClick={() => del(t.id!)}
                  >
                    {deletingId === t.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-gray-600">
                  No testimonials yet. Paste a LinkedIn post URL above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuotesEditor({
  getToken,
}: {
  getToken: () => Promise<string | undefined>;
}) {
  const [items, setItems] = useState<Quote[]>([]);
  const [form, setForm] = useState<Quote>({ text: "", name: "", role: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/quotes", { cache: "no-store" });
    const j = await res.json().catch(() => ({ quotes: [] }));
    setItems(j.quotes || []);
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    setEditingId(null);
    setForm({ text: "", name: "", role: "" });
  }

  function startEdit(q: Quote) {
    setEditingId(q.id!);
    setForm({ text: q.text, name: q.name, role: q.role || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    if (!form.text.trim()) return alert("Quote text is required.");
    if (!form.name.trim()) return alert("Name is required.");
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return alert("Please sign in with an admin account.");
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/quotes/${editingId}` : "/api/quotes";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: form.text.trim(),
          name: form.name.trim(),
          role: (form.role || "").trim(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      reset();
      await load();
    } catch (err: any) {
      alert(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this quote?")) return;
    setDeletingId(id);
    try {
      const token = await getToken();
      if (!token) return alert("Please sign in with an admin account.");
      const res = await fetch(`/api/quotes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      if (editingId === id) reset();
      await load();
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="border p-4 rounded-md">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg">
            {editingId ? "Edit Quote" : "Add Quote"}
          </h2>
          {editingId && (
            <button
              onClick={reset}
              className="text-sm rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
            >
              New
            </button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <textarea
            className="border px-3 py-2 w-full text-sm md:col-span-2 min-h-[140px]"
            placeholder="Quote text"
            value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          />
          <input
            className="border px-3 py-2 w-full text-sm"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="border px-3 py-2 w-full text-sm"
            placeholder="Role / affiliation (e.g. Boston University)"
            value={form.role || ""}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            disabled={saving}
            onClick={save}
            className="w-full sm:w-auto rounded bg-accent px-4 py-2 text-white font-medium hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              onClick={reset}
              className="w-full sm:w-auto rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-normal">All Quotes</h2>
      </div>

      <div className="w-full overflow-x-auto rounded-md border">
        <table className="min-w-[600px] sm:min-w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-3 py-2 w-[40%]">Quote</th>
              <th className="px-3 py-2 w-[20%]">Name</th>
              <th className="px-3 py-2 w-[25%]">Role</th>
              <th className="px-3 py-2 w-[15%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((q) => (
              <tr key={q.id} className="border-b hover:bg-gray-50 align-top">
                <td className="px-3 py-2 text-fg">
                  <div className="line-clamp-3">{q.text}</div>
                </td>
                <td className="px-3 py-2">{q.name}</td>
                <td className="px-3 py-2">{q.role || ""}</td>
                <td className="px-3 py-2 whitespace-nowrap space-x-2">
                  <button
                    className="text-accent hover:underline"
                    onClick={() => startEdit(q)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline disabled:opacity-50"
                    disabled={deletingId === q.id}
                    onClick={() => del(q.id!)}
                  >
                    {deletingId === q.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-gray-600">
                  No quotes yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FAQsEditor({
  getToken,
}: {
  getToken: () => Promise<string | undefined>;
}) {
  const [items, setItems] = useState<FAQ[]>([]);
  const [form, setForm] = useState<FAQ>({ question: "", answer: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/faqs", { cache: "no-store" });
    const j = await res.json().catch(() => ({ faqs: [] }));
    setItems(j.faqs || []);
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    setEditingId(null);
    setForm({ question: "", answer: "" });
  }

  function startEdit(f: FAQ) {
    setEditingId(f.id!);
    setForm({ question: f.question, answer: f.answer });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    if (!form.question.trim()) return alert("Question is required.");
    if (!form.answer.trim()) return alert("Answer is required.");
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return alert("Please sign in with an admin account.");
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/faqs/${editingId}` : "/api/faqs";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: form.question.trim(),
          answer: form.answer.trim(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      reset();
      await load();
    } catch (err: any) {
      alert(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    setDeletingId(id);
    try {
      const token = await getToken();
      if (!token) return alert("Please sign in with an admin account.");
      const res = await fetch(`/api/faqs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      if (editingId === id) reset();
      await load();
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="border p-4 rounded-md">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg">{editingId ? "Edit FAQ" : "Add FAQ"}</h2>
          {editingId && (
            <button
              onClick={reset}
              className="text-sm rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
            >
              New
            </button>
          )}
        </div>
        <div className="grid gap-3">
          <input
            className="border px-3 py-2 w-full text-sm"
            placeholder="Question"
            value={form.question}
            onChange={(e) =>
              setForm((f) => ({ ...f, question: e.target.value }))
            }
          />
          <textarea
            className="border px-3 py-2 w-full text-sm min-h-[160px]"
            placeholder="Answer"
            value={form.answer}
            onChange={(e) =>
              setForm((f) => ({ ...f, answer: e.target.value }))
            }
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            disabled={saving}
            onClick={save}
            className="w-full sm:w-auto rounded bg-accent px-4 py-2 text-white font-medium hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              onClick={reset}
              className="w-full sm:w-auto rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-normal">All FAQs</h2>
      </div>

      <div className="w-full overflow-x-auto rounded-md border">
        <table className="min-w-[600px] sm:min-w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-3 py-2 w-[30%]">Question</th>
              <th className="px-3 py-2 w-[55%]">Answer</th>
              <th className="px-3 py-2 w-[15%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.id} className="border-b hover:bg-gray-50 align-top">
                <td className="px-3 py-2 text-fg font-medium">{f.question}</td>
                <td className="px-3 py-2 text-fg">
                  <div className="line-clamp-3">{f.answer}</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap space-x-2">
                  <button
                    className="text-accent hover:underline"
                    onClick={() => startEdit(f)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline disabled:opacity-50"
                    disabled={deletingId === f.id}
                    onClick={() => del(f.id!)}
                  >
                    {deletingId === f.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-gray-600">
                  No FAQs yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
