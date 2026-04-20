"use client";

import { useEffect, useMemo, useState } from "react";
import WorkshopDiscoveryModal from "./WorkshopDiscoveryModal";
import WorkshopJsonImport from "./WorkshopJsonImport";

type Workshop = {
  id?: string;
  title: string;
  fullName?: string;
  hostConference?: string;
  link: string;
  deadline: string;
  date?: string;
  place?: string;
  sub?: string;
  published?: boolean;
};

const SUB_OPTIONS = [
  { value: "ML", label: "Machine Learning" },
  { value: "CV", label: "Computer Vision" },
  { value: "NLP", label: "NLP" },
  { value: "SP", label: "Speech" },
  { value: "RO", label: "Robotics" },
  { value: "DM", label: "Data Mining" },
  { value: "HCI", label: "HCI" },
  { value: "AP", label: "Applications" },
];

const empty: Workshop = {
  title: "",
  fullName: "",
  hostConference: "",
  link: "",
  deadline: "",
  date: "",
  place: "",
  sub: "ML",
  published: true,
};

function toDateInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function WorkshopsEditor({
  getToken,
}: {
  getToken: () => Promise<string | undefined>;
}) {
  const [items, setItems] = useState<Workshop[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Workshop>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [urlInput, setUrlInput] = useState("");
  const [fetching, setFetching] = useState(false);
  const [previewMsg, setPreviewMsg] = useState<string | null>(null);
  const [discoverOpen, setDiscoverOpen] = useState(false);

  async function load() {
    const token = await getToken();
    const res = await fetch("/api/workshops?all=1", {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const j = await res.json().catch(() => ({ workshops: [] }));
    setItems(j.workshops || []);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((w) =>
      `${w.title} ${w.hostConference || ""} ${w.place || ""} ${w.sub || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  async function fetchFromUrl() {
    if (!urlInput.trim()) return;
    setFetching(true);
    setPreviewMsg(null);
    try {
      const token = await getToken();
      if (!token) {
        alert("Sign in first");
        return;
      }
      const res = await fetch("/api/workshops/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Extraction failed");
      const p = j.preview;
      setForm({
        ...empty,
        title: p.title || "",
        fullName: p.fullName || "",
        hostConference: p.hostConference || "",
        link: p.link || urlInput.trim(),
        deadline: p.deadline || "",
        date: p.date || "",
        place: p.place || "",
        sub: p.sub || "ML",
        published: true,
      });
      const got = [
        p.title && "title",
        p.deadline && "deadline",
        p.date && "date",
        p.hostConference && "host",
      ].filter(Boolean);
      setPreviewMsg(
        got.length
          ? `Pre-filled: ${got.join(", ")}. Review and edit below, then Save.`
          : "Couldn't auto-extract much. Please fill the fields manually."
      );
    } catch (err: any) {
      setPreviewMsg(`Error: ${err.message}`);
    } finally {
      setFetching(false);
    }
  }

  function startEdit(w: Workshop) {
    setEditingId(w.id!);
    setForm({
      ...empty,
      ...w,
      deadline: w.deadline || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById("workshops-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function resetForm() {
    setForm(empty);
    setEditingId(null);
    setUrlInput("");
    setPreviewMsg(null);
  }

  async function save() {
    if (!form.title.trim()) return alert("Title is required");
    if (!form.link.trim()) return alert("Link is required");
    if (!form.deadline) return alert("Deadline is required");
    try {
      setSaving(true);
      const token = await getToken();
      if (!token) return alert("Sign in first");

      const payload = {
        ...form,
        deadline: form.deadline
          ? new Date(form.deadline).toISOString()
          : "",
      };

      const url = editingId ? `/api/workshops/${editingId}` : "/api/workshops";
      const method = editingId ? "PATCH" : "POST";
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
    } catch (err: any) {
      alert(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this workshop?")) return;
    try {
      setDeletingId(id);
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/workshops/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
      if (editingId === id) resetForm();
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div id="workshops-section" className="space-y-6 mt-6 scroll-mt-20">
      {/* Bulk discover bar */}
      <div className="border rounded-lg p-4 bg-gradient-to-br from-accent/5 to-transparent flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Bulk discover workshops</div>
          <div className="text-xs text-fg-muted">
            Uses Gemini + Google Search to find recent AI/ML workshops,
            verifies deadlines, lets you review and save in bulk.
          </div>
        </div>
        <button
          onClick={() => setDiscoverOpen(true)}
          className="px-4 py-2 rounded bg-accent text-white text-sm font-semibold cursor-pointer"
        >
          Discover workshops
        </button>
      </div>

      <WorkshopDiscoveryModal
        open={discoverOpen}
        onClose={() => setDiscoverOpen(false)}
        getToken={getToken}
        onSaved={load}
      />

      {/* JSON bulk import (collapsible) */}
      <WorkshopJsonImport getToken={getToken} onSaved={load} />

      {/* Paste URL preview bar */}
      <div className="border rounded-lg p-4 bg-surface-alt/30">
        <label className="block text-sm font-medium mb-2">
          Auto-fill from URL
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://workshop-site.com/..."
            className="flex-1 border rounded px-3 py-2 text-sm bg-surface"
          />
          <button
            onClick={fetchFromUrl}
            disabled={fetching || !urlInput.trim()}
            className="px-4 py-2 rounded bg-accent text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            {fetching ? "Fetching..." : "Fetch & preview"}
          </button>
        </div>
        {previewMsg && (
          <p className="mt-2 text-xs text-fg-muted">{previewMsg}</p>
        )}
      </div>

      {/* Form */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold">
          {editingId ? "Edit workshop" : "New workshop"}
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium">Title *</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm bg-surface"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium">Full name / description</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm bg-surface"
              value={form.fullName || ""}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Host conference</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm bg-surface"
              placeholder="e.g. NeurIPS 2026"
              value={form.hostConference || ""}
              onChange={(e) =>
                setForm({ ...form, hostConference: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium">Category</label>
            <input
              list="workshop-sub-options"
              className="w-full border rounded px-3 py-2 text-sm bg-surface"
              value={form.sub || ""}
              onChange={(e) => setForm({ ...form, sub: e.target.value })}
              placeholder="Pick or type custom..."
            />
            <datalist id="workshop-sub-options">
              {SUB_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </datalist>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium">Link *</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm bg-surface"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Submission deadline *</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 text-sm bg-surface"
              value={toDateInput(form.deadline)}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Event date (display)</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm bg-surface"
              placeholder="e.g. Dec 7-11, 2026"
              value={form.date || ""}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium">Place</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm bg-surface"
              placeholder="e.g. Vancouver, Canada"
              value={form.place || ""}
              onChange={(e) => setForm({ ...form, place: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={!!form.published}
              onChange={(e) =>
                setForm({ ...form, published: e.target.checked })
              }
            />
            Published
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded bg-accent text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : editingId ? "Update" : "Save"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded border text-sm cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Search + table */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">
          All workshops ({items.length})
        </h3>
        <input
          type="search"
          placeholder="Search..."
          className="border rounded px-3 py-1.5 text-sm bg-surface"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-[800px] w-full text-xs sm:text-sm">
          <thead className="bg-surface-alt/50 text-left">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Host</th>
              <th className="px-3 py-2">Deadline</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2 text-center">Pub.</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-medium">{w.title}</div>
                  {w.place && (
                    <div className="text-xs text-fg-muted">{w.place}</div>
                  )}
                </td>
                <td className="px-3 py-2">{w.hostConference || "—"}</td>
                <td className="px-3 py-2">
                  {w.deadline
                    ? new Date(w.deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-3 py-2">{w.sub || "—"}</td>
                <td className="px-3 py-2 text-center">
                  {w.published ? "✓" : "—"}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => startEdit(w)}
                    className="text-accent hover:underline mr-3 cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => del(w.id!)}
                    disabled={deletingId === w.id}
                    className="text-red-600 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === w.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-fg-muted"
                >
                  No workshops yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
