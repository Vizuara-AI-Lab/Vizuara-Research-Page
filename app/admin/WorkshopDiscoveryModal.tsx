"use client";

import { useState } from "react";

type Candidate = {
  title: string;
  fullName?: string;
  hostConference?: string;
  link: string;
  deadline: string;
  date?: string;
  place?: string;
  sub?: string;
  description?: string;
  verificationStatus?: "verified" | "corrected" | "unverified";
  originalDeadline?: string | null;
  deadlineType?: string | null;
  _selected?: boolean;
};

const SUBS = ["ML", "CV", "NLP", "SP", "RO", "DM", "HCI", "AP"];

const STATUS_STYLE: Record<string, string> = {
  verified: "bg-green-100 text-green-800",
  corrected: "bg-amber-100 text-amber-800",
  unverified: "bg-gray-100 text-gray-700",
};

function daysLeft(iso: string): number {
  const d = new Date(iso).getTime();
  if (isNaN(d)) return -1;
  return Math.floor((d - Date.now()) / 86400000);
}

function deadlineColor(iso: string): string {
  const d = daysLeft(iso);
  if (d < 0) return "text-gray-500";
  if (d <= 7) return "text-red-600 font-semibold";
  if (d <= 14) return "text-amber-600 font-semibold";
  return "text-emerald-700";
}

export default function WorkshopDiscoveryModal({
  open,
  onClose,
  getToken,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  getToken: () => Promise<string | undefined>;
  onSaved: () => void;
}) {
  const [source, setSource] = useState<"gemini" | "openreview">("openreview");
  const [topic, setTopic] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [rows, setRows] = useState<Candidate[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    verified: number;
    corrected: number;
    unverified: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function runDiscover() {
    if (!startDate) {
      setError("Start date is required");
      return;
    }
    if (endDate && endDate < startDate) {
      setError("End date must be after start date");
      return;
    }
    setLoading(true);
    setError(null);
    setRows([]);
    setSummary(null);
    setStage(
      source === "openreview"
        ? "Fetching from OpenReview..."
        : "Asking Gemini + Google Search..."
    );
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in first");

      const endpoint =
        source === "openreview"
          ? "/api/workshops/openreview"
          : "/api/workshops/discover";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic, startDate, endDate: endDate || null }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Discovery failed");
      const list = (j.candidates || []).map((c: any) => ({
        ...c,
        _selected: true,
      }));
      setRows(list);
      setSummary(j.summary || null);
      setStage("");
    } catch (err: any) {
      setError(err.message || "Discovery failed");
      setStage("");
    } finally {
      setLoading(false);
    }
  }

  function patch(i: number, p: Partial<Candidate>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
  }

  function remove(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function saveSelected() {
    const selected = rows.filter((r) => r._selected);
    if (!selected.length) return alert("Nothing selected");
    if (!confirm(`Save ${selected.length} workshops to Firestore?`)) return;

    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in first");
      const res = await fetch("/api/workshops/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: selected.map(({ _selected, ...w }) => ({
            ...w,
            published: true,
          })),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      alert(`Saved ${j.saved} workshops`);
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = rows.filter((r) => r._selected).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-stretch sm:items-center justify-center p-0 sm:p-4">
      <datalist id="discover-sub-options">
        {SUBS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <div className="bg-surface w-full max-w-6xl max-h-[100vh] sm:max-h-[90vh] rounded-none sm:rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Discover workshops</h2>
          <button
            onClick={onClose}
            className="text-fg-muted hover:text-fg cursor-pointer text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-border space-y-3">
          {/* Source selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setSource("openreview")}
              className={`flex-1 px-3 py-2 rounded text-xs font-semibold border cursor-pointer transition-colors ${
                source === "openreview"
                  ? "bg-accent text-white border-accent"
                  : "border-border text-fg-muted hover:bg-surface-alt"
              }`}
            >
              OpenReview
              <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                Exact deadlines, official URLs (~50% coverage)
              </span>
            </button>
            <button
              onClick={() => setSource("gemini")}
              className={`flex-1 px-3 py-2 rounded text-xs font-semibold border cursor-pointer transition-colors ${
                source === "gemini"
                  ? "bg-accent text-white border-accent"
                  : "border-border text-fg-muted hover:bg-surface-alt"
              }`}
            >
              Gemini + Google Search
              <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                Broader coverage, scrapes + verifies deadlines
              </span>
            </button>
          </div>

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={
              source === "openreview"
                ? "Topic filter (optional) — matches venue ID substring"
                : "Topic (optional) — blank = all recent AI/ML workshops"
            }
            className="w-full border rounded px-3 py-2 text-sm bg-surface"
          />
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
            <div className="flex-1 min-w-0">
              <label className="text-xs text-fg-muted block mb-1">
                Deadline from <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm bg-surface"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-xs text-fg-muted block mb-1">
                Deadline until <span className="text-fg-muted">(optional)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm bg-surface"
                placeholder="Any"
              />
            </div>
            <button
              onClick={runDiscover}
              disabled={loading || !startDate}
              className="px-4 py-2 rounded bg-accent text-white text-sm font-semibold disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {loading ? "Searching..." : "Discover workshops"}
            </button>
          </div>
          {stage && (
            <p className="text-xs text-fg-muted flex items-center gap-2">
              <span className="h-3 w-3 border-2 border-border border-t-accent rounded-full animate-spin" />
              {stage}{" "}
              {source === "openreview"
                ? "(30-60s — rate-limited)"
                : "(30-90s)"}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600">Error: {error}</p>
          )}
          {summary && (
            <p className="text-xs text-fg-muted">
              Found {summary.total} —{" "}
              <span className="text-green-700">
                {summary.verified} verified
              </span>
              ,{" "}
              <span className="text-amber-700">
                {summary.corrected} corrected
              </span>
              ,{" "}
              <span className="text-gray-600">
                {summary.unverified} unverified
              </span>
            </p>
          )}
        </div>

        {/* Results table */}
        <div className="flex-1 overflow-auto">
          {!rows.length && !loading && (
            <div className="p-10 text-center text-fg-muted text-sm">
              Enter a topic (or leave blank) and click Discover.
            </div>
          )}

          {rows.length > 0 && (
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-surface-alt sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) => ({ ...r, _selected: e.target.checked }))
                        )
                      }
                    />
                  </th>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-left">Title</th>
                  <th className="px-2 py-2 text-left">Host</th>
                  <th className="px-2 py-2 text-left">Deadline</th>
                  <th className="px-2 py-2 text-left">Cat.</th>
                  <th className="px-2 py-2 text-left">Place</th>
                  <th className="px-2 py-2 text-left">Link</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const d = daysLeft(r.deadline);
                  return (
                    <tr key={i} className="border-t align-top">
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={!!r._selected}
                          onChange={(e) =>
                            patch(i, { _selected: e.target.checked })
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            STATUS_STYLE[r.verificationStatus || "unverified"]
                          }`}
                          title={
                            r.verificationStatus === "corrected" &&
                            r.originalDeadline
                              ? `Originally claimed: ${r.originalDeadline}`
                              : undefined
                          }
                        >
                          {r.verificationStatus || "unverified"}
                        </span>
                        {r.deadlineType && (
                          <div className="text-[10px] text-fg-muted mt-0.5">
                            {r.deadlineType}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 max-w-[260px]">
                        <input
                          className="w-full border rounded px-1.5 py-1 text-xs bg-surface"
                          value={r.title}
                          onChange={(e) => patch(i, { title: e.target.value })}
                        />
                        {r.description && (
                          <div className="text-[10px] text-fg-muted mt-1 line-clamp-2">
                            {r.description}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          className="w-32 border rounded px-1.5 py-1 text-xs bg-surface"
                          value={r.hostConference || ""}
                          onChange={(e) =>
                            patch(i, { hostConference: e.target.value })
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="date"
                          className={`border rounded px-1.5 py-1 text-xs bg-surface ${deadlineColor(
                            r.deadline
                          )}`}
                          value={(r.deadline || "").slice(0, 10)}
                          onChange={(e) => patch(i, { deadline: e.target.value })}
                        />
                        <div className="text-[10px] text-fg-muted mt-0.5">
                          {d >= 0 ? `${d}d left` : "past"}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          list="discover-sub-options"
                          className="w-20 border rounded px-1 py-1 text-xs bg-surface"
                          value={r.sub || ""}
                          onChange={(e) => patch(i, { sub: e.target.value })}
                          placeholder="Custom"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          className="w-28 border rounded px-1.5 py-1 text-xs bg-surface"
                          value={r.place || ""}
                          onChange={(e) => patch(i, { place: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline text-xs break-all"
                        >
                          Open ↗
                        </a>
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => remove(i)}
                          className="text-red-600 hover:underline text-xs cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-3">
          <div className="text-xs text-fg-muted">
            {rows.length > 0 && `${selectedCount} of ${rows.length} selected`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded border text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={saveSelected}
              disabled={!selectedCount || saving}
              className="px-4 py-2 rounded bg-accent text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : `Save ${selectedCount} to Firestore`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
