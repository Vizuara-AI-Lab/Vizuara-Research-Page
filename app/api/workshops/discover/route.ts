import { NextResponse } from "next/server";
import { verifyAdminFromRequest } from "@/app/lib/adminGuard";

export const maxDuration = 300;

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODEL = "gemini-2.5-pro";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
};

function jsonFromGemini(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();
  const first = raw.indexOf("[");
  const last = raw.lastIndexOf("]");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(raw.slice(first, last + 1));
    } catch {}
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function callGeminiWithSearch(prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Gemini search failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
  if (!text) throw new Error("Gemini returned no text");
  return text;
}

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`Gemini failed: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
}

async function jinaScrape(
  url: string
): Promise<{ markdown: string; title: string } | null> {
  try {
    const r = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: "application/json", "X-No-Cache": "true" },
      signal: AbortSignal.timeout(45_000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return {
      markdown: data?.data?.content || "",
      title: data?.data?.title || "",
    };
  } catch {
    return null;
  }
}

function isDead(markdown: string): boolean {
  const m = markdown.toLowerCase().slice(0, 4000);
  return (
    m.includes("404") ||
    m.includes("page not found") ||
    m.includes("does not exist") ||
    m.includes("no longer available")
  );
}

async function discoverCandidates(
  topic: string,
  startDate: string,
  endDate: string | null
): Promise<Candidate[]> {
  const topicLine = topic
    ? `The admin is specifically interested in workshops related to: "${topic}".`
    : `Search broadly across recent AI/ML/NLP/CV/Speech/Robotics workshops.`;

  const rangeLine = endDate
    ? `Submission deadline MUST fall between ${startDate} and ${endDate} (inclusive).`
    : `Submission deadline MUST be on or after ${startDate} (no upper bound).`;

  const prompt = `You are a research-workshop finder for a machine learning lab.

${topicLine}

Use Google Search to find 10-15 REAL, UPCOMING workshops that:
- Are co-located with or hosted by major AI conferences (NeurIPS, ICML, ICLR, CVPR, ICCV, ECCV, ACL, EMNLP, NAACL, AAAI, ICRA, etc.), OR are standalone workshops in AI/ML
- ${rangeLine}
- Have a REAL, WORKING CFP/website URL (not invented)

Return ONLY a JSON array. No prose, no markdown fences. Each item must have these exact keys:
{
  "title": "<short workshop name, e.g. 'Workshop on Efficient LLMs'>",
  "fullName": "<full workshop title / tagline>",
  "hostConference": "<host conference + year, e.g. 'NeurIPS 2026'>",
  "link": "<canonical workshop URL>",
  "deadline": "<ISO date of the EARLIEST submission deadline, e.g. '2026-05-15'>",
  "date": "<display date of the workshop event, e.g. 'Dec 14, 2026'>",
  "place": "<city, country>",
  "sub": "<one of: ML, CV, NLP, SP, RO, DM, HCI, AP>",
  "description": "<1-2 sentence scope summary>"
}

Strict rules:
- No fabricated URLs. Submission deadline > notification/camera-ready.
- Date format for "deadline" MUST be ISO (YYYY-MM-DD).
- Today's date: ${new Date().toISOString().slice(0, 10)}.
- ${rangeLine}

Return ONLY the JSON array.`;

  const text = await callGeminiWithSearch(prompt);
  const arr = jsonFromGemini(text);
  if (!Array.isArray(arr)) return [];
  return arr.filter((c: any) => c?.title && c?.link && c?.deadline) as Candidate[];
}

async function verifyCandidates(candidates: Candidate[]): Promise<Candidate[]> {
  const scraped = await Promise.all(
    candidates.map(async (c) => {
      const first = await jinaScrape(c.link);
      if (first && !isDead(first.markdown) && first.markdown.length > 200) {
        return { c, md: first.markdown };
      }
      try {
        const root = new URL(c.link).origin;
        if (root && root !== c.link) {
          const alt = await jinaScrape(root);
          if (alt && !isDead(alt.markdown) && alt.markdown.length > 200) {
            return { c, md: alt.markdown };
          }
        }
      } catch {}
      return { c, md: null };
    })
  );

  const scrapedList = scraped
    .map((s, i) =>
      s.md
        ? `--- WORKSHOP ${i} (${s.c.title}) ---\nClaimed deadline: ${s.c.deadline}\n\n${s.md.slice(0, 8000)}\n`
        : null
    )
    .filter(Boolean)
    .join("\n");

  if (!scrapedList) {
    return candidates.map((c) => ({ ...c, verificationStatus: "unverified" as const }));
  }

  const extractPrompt = `You will read scraped workshop CFP pages and extract the EARLIEST submission deadline for each.

Deadline selection rules:
- Consider ONLY submission-type deadlines: abstract submission, paper submission, full paper, workshop paper, ARR commitment.
- IGNORE: notification of acceptance, camera-ready deadline, conference dates, registration deadlines.
- Sort all submission deadlines by CALENDAR date and pick the FIRST (earliest).

For each workshop below, return a JSON object in an array with:
{
  "index": <number>,
  "deadline": "<YYYY-MM-DD of earliest submission deadline>",
  "deadlineType": "<e.g. 'abstract submission' | 'paper submission' | 'workshop paper'>"
}

If you cannot confidently determine a deadline for an index, return deadline: null for it.

Return ONLY the JSON array. No prose, no fences.

PAGES:
${scrapedList}`;

  let extracted: any[] = [];
  try {
    const out = await callGemini(extractPrompt);
    const parsed = jsonFromGemini(out);
    if (Array.isArray(parsed)) extracted = parsed;
  } catch {}

  const byIdx = new Map<number, { deadline: string | null; deadlineType: string | null }>();
  for (const e of extracted) {
    if (typeof e?.index === "number") {
      byIdx.set(e.index, {
        deadline: e.deadline || null,
        deadlineType: e.deadlineType || null,
      });
    }
  }

  return scraped.map((s, i) => {
    const c = s.c;
    if (!s.md) return { ...c, verificationStatus: "unverified" as const };
    const ex = byIdx.get(i);
    if (!ex?.deadline) return { ...c, verificationStatus: "unverified" as const };

    const claimed = new Date(c.deadline).getTime();
    const verified = new Date(ex.deadline).getTime();
    const same =
      !isNaN(claimed) && !isNaN(verified) && Math.abs(claimed - verified) <= 86400000;

    return {
      ...c,
      deadline: ex.deadline,
      originalDeadline: same ? null : c.deadline,
      verificationStatus: same ? ("verified" as const) : ("corrected" as const),
      deadlineType: ex.deadlineType || null,
    };
  });
}

export async function POST(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!GEMINI_API_KEY)
    return NextResponse.json(
      { error: "GEMINI_API_KEY missing in environment" },
      { status: 500 }
    );

  const body = await req.json().catch(() => ({}));
  const topic: string = (body?.topic || "").toString().trim().slice(0, 200);
  const startDate: string = (body?.startDate || "").toString().trim();
  const endDate: string | null = body?.endDate ? String(body.endDate).trim() : null;

  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return NextResponse.json(
      { error: "startDate (YYYY-MM-DD) is required" },
      { status: 400 }
    );
  }
  if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return NextResponse.json(
      { error: "endDate must be YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const startMs = new Date(startDate).getTime();
  const endMs = endDate ? new Date(endDate).getTime() + 86400000 - 1 : null;

  const inRange = (iso: string) => {
    const t = new Date(iso).getTime();
    if (isNaN(t)) return false;
    if (t < startMs) return false;
    if (endMs !== null && t > endMs) return false;
    return true;
  };

  try {
    const discovered = await discoverCandidates(topic, startDate, endDate);
    if (!discovered.length) {
      return NextResponse.json({ candidates: [], summary: { total: 0 } });
    }

    // Pre-filter by date range
    const withinRange = discovered.filter((c) => inRange(c.deadline));

    const verified = await verifyCandidates(withinRange);

    // Post-filter: enforce date range on the verified/corrected deadline
    const final = verified.filter((c) => inRange(c.deadline));

    const summary = {
      total: final.length,
      verified: final.filter((c) => c.verificationStatus === "verified").length,
      corrected: final.filter((c) => c.verificationStatus === "corrected").length,
      unverified: final.filter((c) => c.verificationStatus === "unverified").length,
    };

    return NextResponse.json({ candidates: final, summary });
  } catch (err: any) {
    console.error("[workshops/discover]", err);
    return NextResponse.json(
      { error: err?.message || "Discovery failed" },
      { status: 500 }
    );
  }
}
