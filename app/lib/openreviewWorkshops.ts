import { orFetch } from "./openreview";

export type OrWorkshop = {
  title: string;
  fullName: string;
  hostConference: string;
  link: string;
  deadline: string; // ISO
  date: string;
  place: string;
  sub: string;
  venueId: string;
};

const SUB_BY_HOST: Record<string, string> = {
  "ICLR.cc": "ML",
  "ICML.cc": "ML",
  NeurIPS: "ML",
  "aclweb.org": "NLP",
  EMNLP: "NLP",
  NAACL: "NLP",
  "thecvf.com": "CV",
  CVPR: "CV",
  ICCV: "CV",
  ECCV: "CV",
  ICASSP: "SP",
  SLT: "SP",
  Interspeech: "SP",
  "roboticsfoundation.org": "RO",
  HRI: "HCI",
  CHI: "HCI",
  ACM: "AP",
  IEEE: "AP",
};

function guessSub(venueId: string, title: string): string {
  const hay = `${venueId} ${title}`.toLowerCase();
  for (const [key, sub] of Object.entries(SUB_BY_HOST)) {
    if (venueId.includes(key)) return sub;
  }
  if (/\b(vision|image|video|cvpr|iccv|eccv)\b/.test(hay)) return "CV";
  if (/\b(nlp|language|llm|text|acl|emnlp|naacl)\b/.test(hay)) return "NLP";
  if (/\b(speech|audio|asr|interspeech|icassp)\b/.test(hay)) return "SP";
  if (/\b(robot|icra|iros)\b/.test(hay)) return "RO";
  if (/\b(hci|human[- ]computer|chi|ubicomp|cscw)\b/.test(hay)) return "HCI";
  return "ML";
}

function hostFromVenueId(venueId: string): string {
  const parts = venueId.split("/");
  const yearIdx = parts.findIndex((p) => /^\d{4}$/.test(p));
  if (yearIdx <= 0) return parts[0].replace(/\.(cc|org|net)$/, "");
  const year = parts[yearIdx];
  const prev = parts[yearIdx - 1].replace(/\.(cc|org|net)$/, "");
  return `${prev} ${year}`;
}

function fmtDisplayDate(ms?: number): string {
  if (!ms || typeof ms !== "number" || ms < 1_000_000_000_000) return "";
  try {
    return new Date(ms).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, i: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return out;
}

async function fetchVenueData(venueId: string): Promise<OrWorkshop | null> {
  try {
    const [groupRes, invRes] = await Promise.all([
      orFetch("/groups", { id: venueId }).catch(() => null),
      orFetch("/invitations", {
        id: `${venueId}/-/Submission`,
        expired: "true",
      }).catch(() => null),
    ]);

    const group = groupRes?.groups?.[0];
    if (!group) return null;
    const c = group.content || {};
    const getVal = (k: string) => c?.[k]?.value;

    const title: string = getVal("title") || getVal("subtitle") || venueId;
    const subtitle: string = getVal("subtitle") || "";
    const website: string =
      getVal("website") ||
      `https://openreview.net/group?id=${encodeURIComponent(venueId)}`;
    const place: string = getVal("location") || "";
    const startDate: number | undefined = getVal("start_date");

    const inv = invRes?.invitations?.[0];
    const duedate: number | undefined = inv?.duedate;
    if (!duedate) return null;

    return {
      title,
      fullName: subtitle || title,
      hostConference: subtitle || hostFromVenueId(venueId),
      link: website,
      deadline: new Date(duedate).toISOString(),
      date: fmtDisplayDate(startDate),
      place,
      sub: guessSub(venueId, title),
      venueId,
    };
  } catch {
    return null;
  }
}

export type FetchOpts = {
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
  topic?: string;
  cap?: number;
  concurrency?: number;
};

export async function fetchOpenReviewWorkshops(
  opts: FetchOpts
): Promise<{
  workshops: OrWorkshop[];
  scanned: number;
  totalCandidates: number;
}> {
  const {
    startDate,
    endDate = null,
    topic = "",
    cap = 120,
    concurrency = 4,
  } = opts;

  const startMs = new Date(startDate).getTime();
  const endMs = endDate ? new Date(endDate).getTime() + 86400000 - 1 : null;
  const inRange = (iso: string) => {
    const t = new Date(iso).getTime();
    if (isNaN(t)) return false;
    if (t < startMs) return false;
    if (endMs !== null && t > endMs) return false;
    return true;
  };

  const startYear = Number(startDate.slice(0, 4));
  const endYear = endDate ? Number(endDate.slice(0, 4)) : startYear + 1;

  const venuesRes = await orFetch("/groups", { id: "active_venues" });
  const allMembers: string[] = venuesRes?.groups?.[0]?.members || [];

  const topicLower = topic.trim().toLowerCase();
  const candidates = allMembers.filter((vid) => {
    if (!vid.includes("/Workshop")) return false;
    if (/Proposal|Proposals/i.test(vid)) return false;
    const yMatch = vid.match(/\/(\d{4})\//);
    if (!yMatch) return false;
    const y = Number(yMatch[1]);
    if (y < startYear || y > endYear) return false;
    if (topicLower && !vid.toLowerCase().includes(topicLower)) return false;
    return true;
  });

  const batch = candidates.slice(0, cap);
  const results = await mapLimit(batch, concurrency, fetchVenueData);
  const withDeadlines = results.filter(
    (x): x is OrWorkshop => !!x && !!x.deadline
  );

  const final = withDeadlines.filter((c) => inRange(c.deadline));
  final.sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  return {
    workshops: final,
    scanned: batch.length,
    totalCandidates: candidates.length,
  };
}
