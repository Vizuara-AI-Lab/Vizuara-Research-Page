"use client";

import { useState } from "react";

type Row = {
  title: string;
  fullName?: string;
  hostConference?: string;
  link: string;
  deadline: string;
  date?: string;
  place?: string;
  sub?: string;
  published?: boolean;
  _error?: string | null;
};

const SCHEMA_EXAMPLE = `[
  {
    "title": "Workshop on Efficient LLMs",
    "fullName": "ICML 2026 Workshop on Efficient Large Language Models",
    "hostConference": "ICML 2026",
    "link": "https://example.com/ellm-icml2026",
    "deadline": "2026-05-15",
    "date": "Jul 10-11, 2026",
    "place": "Seoul, South Korea",
    "sub": "ML",
    "published": true
  }
]`;

const AI_PROMPT = `You are a research-workshop data generator. Return a JSON array (no prose, no markdown fences) of upcoming AI/ML workshops. Each object MUST have these exact keys:

{
  "title":          "short workshop name",
  "fullName":       "full workshop title / tagline",
  "hostConference": "host conference + year, e.g. NeurIPS 2026",
  "link":           "canonical workshop CFP/website URL (real, working)",
  "deadline":       "ISO date YYYY-MM-DD of the EARLIEST submission deadline",
  "date":           "display date of the workshop event, e.g. Dec 14, 2026",
  "place":          "city, country",
  "sub":            "category code (ML, CV, NLP, SP, RO, DM, HCI, AP) — or any custom string",
  "published":      true
}

Rules:
- Do not invent URLs. Only include workshops whose CFP page actually exists.
- The deadline must be a real SUBMISSION deadline (not notification / camera-ready / registration).
- Pick the chronologically EARLIEST submission deadline if multiple exist.
- Output ONLY the JSON array. Nothing else.`;

function validateRow(obj: any): Row {
  const r: Row = {
    title: String(obj?.title || "").trim(),
    fullName: String(obj?.fullName || "").trim(),
    hostConference: String(obj?.hostConference || "").trim(),
    link: String(obj?.link || "").trim(),
    deadline: String(obj?.deadline || "").trim(),
    date: String(obj?.date || "").trim(),
    place: String(obj?.place || "").trim(),
    sub: String(obj?.sub || "ML").trim(),
    published: obj?.published !== false,
  };
  const errs: string[] = [];
  if (!r.title) errs.push("title required");
  if (!r.link) errs.push("link required");
  if (!r.deadline) errs.push("deadline required");
  if (r.deadline && !/^\d{4}-\d{2}-\d{2}/.test(r.deadline))
    errs.push("deadline must be YYYY-MM-DD");
  r._error = errs.length ? errs.join(", ") : null;
  return r;
}

export default function WorkshopJsonImport({
  getToken,
  onSaved,
}: {
  getToken: () => Promise<string | undefined>;
  onSaved: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedWhat, setCopiedWhat] = useState<"schema" | "prompt" | null>(null);

  function parsePreview() {
    setParseError(null);
    setRows(null);
    if (!text.trim()) return setParseError("Paste JSON first");
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (err: any) {
      return setParseError(`Invalid JSON: ${err.message}`);
    }
    if (!Array.isArray(data))
      return setParseError("JSON must be an array of workshop objects");
    setRows(data.map(validateRow));
  }

  async function copy(kind: "schema" | "prompt") {
    const content = kind === "schema" ? SCHEMA_EXAMPLE : AI_PROMPT;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedWhat(kind);
      setTimeout(() => setCopiedWhat(null), 2000);
    } catch {
      alert("Copy failed — please select & copy manually");
    }
  }

  async function submit() {
    if (!rows?.length) return;
    const valid = rows.filter((r) => !r._error);
    if (!valid.length) return alert("No valid rows to save");
    if (!confirm(`Save ${valid.length} valid workshops to Firestore?`)) return;

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
          items: valid.map(({ _error, ...r }) => r),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      alert(`Saved ${j.saved} workshops`);
      setText("");
      setRows(null);
      setExpanded(false);
      onSaved();
    } catch (err: any) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-surface-alt/30 transition-colors"
      >
        <div className="text-left">
          <div className="text-sm font-semibold">Import from JSON</div>
          <div className="text-xs text-fg-muted">
            Paste JSON directly, or use an AI prompt to generate it.
          </div>
        </div>
        <span className="text-fg-muted">{expanded ? "−" : "+"}</span>
      </button>

      {expanded && (
        <div className="p-4 border-t border-border space-y-3">
          {/* Copy buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => copy("schema")}
              className="text-xs px-3 py-1.5 rounded border border-border hover:bg-surface-alt cursor-pointer"
            >
              {copiedWhat === "schema" ? "✓ Copied!" : "Copy JSON format"}
            </button>
            <button
              onClick={() => copy("prompt")}
              className="text-xs px-3 py-1.5 rounded border border-border hover:bg-surface-alt cursor-pointer"
            >
              {copiedWhat === "prompt"
                ? "✓ Copied!"
                : "Copy AI prompt (paste to ChatGPT/Claude)"}
            </button>
          </div>

          {/* JSON textarea */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={SCHEMA_EXAMPLE}
            rows={10}
            className="w-full border rounded px-3 py-2 text-xs font-mono bg-surface resize-y"
          />

          <div className="flex gap-2">
            <button
              onClick={parsePreview}
              className="px-3 py-1.5 rounded border border-border text-sm cursor-pointer hover:bg-surface-alt"
            >
              Validate & preview
            </button>
            {rows && rows.some((r) => !r._error) && (
              <button
                onClick={submit}
                disabled={saving}
                className="px-3 py-1.5 rounded bg-accent text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                {saving
                  ? "Saving..."
                  : `Submit ${rows.filter((r) => !r._error).length} valid`}
              </button>
            )}
          </div>

          {parseError && (
            <p className="text-xs text-red-600">{parseError}</p>
          )}

          {/* Preview table */}
          {rows && rows.length > 0 && (
            <div className="overflow-x-auto border rounded">
              <table className="w-full text-xs">
                <thead className="bg-surface-alt/50">
                  <tr>
                    <th className="px-2 py-1.5 text-left">#</th>
                    <th className="px-2 py-1.5 text-left">Title</th>
                    <th className="px-2 py-1.5 text-left">Host</th>
                    <th className="px-2 py-1.5 text-left">Deadline</th>
                    <th className="px-2 py-1.5 text-left">Cat.</th>
                    <th className="px-2 py-1.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-t ${
                        r._error ? "bg-red-50 dark:bg-red-950/20" : ""
                      }`}
                    >
                      <td className="px-2 py-1.5">{i + 1}</td>
                      <td className="px-2 py-1.5 max-w-[250px] truncate">
                        {r.title || "—"}
                      </td>
                      <td className="px-2 py-1.5">{r.hostConference || "—"}</td>
                      <td className="px-2 py-1.5">{r.deadline || "—"}</td>
                      <td className="px-2 py-1.5">{r.sub || "—"}</td>
                      <td className="px-2 py-1.5">
                        {r._error ? (
                          <span className="text-red-600">{r._error}</span>
                        ) : (
                          <span className="text-green-700">✓ valid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
