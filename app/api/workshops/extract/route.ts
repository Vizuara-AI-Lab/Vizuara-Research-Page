import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { verifyAdminFromRequest } from "@/app/lib/adminGuard";

const MONTHS =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

// Try to find "submission deadline: June 15, 2026" style strings.
function findDeadline(text: string): string | null {
  const patterns = [
    new RegExp(
      `(?:submission|paper|abstract|camera.?ready|full.?paper)\\s*(?:deadline|due|by)?[^\\n]{0,40}?(${MONTHS}\\s+\\d{1,2}(?:,|\\s)?\\s*\\d{4})`,
      "i"
    ),
    new RegExp(
      `(?:deadline|due)[^\\n]{0,40}?(${MONTHS}\\s+\\d{1,2}(?:,|\\s)?\\s*\\d{4})`,
      "i"
    ),
    new RegExp(
      `(?:deadline|submission)[^\\n]{0,40}?(\\d{1,2}\\s+${MONTHS}\\s+\\d{4})`,
      "i"
    ),
    new RegExp(
      `(?:deadline|submission)[^\\n]{0,40}?(\\d{4}-\\d{2}-\\d{2})`,
      "i"
    ),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const parsed = new Date(m[1]);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }
  }
  return null;
}

function findEventDate(text: string): string | null {
  // e.g. "December 7-11, 2026" or "Dec 7, 2026"
  const re = new RegExp(
    `(${MONTHS}\\s+\\d{1,2}(?:\\s?[-–]\\s?\\d{1,2})?,?\\s*\\d{4})`,
    "i"
  );
  const m = text.match(re);
  return m?.[1] || null;
}

function findHostConference(text: string, title: string): string | null {
  const hosts = [
    "NeurIPS",
    "ICML",
    "ICLR",
    "CVPR",
    "ICCV",
    "ECCV",
    "ACL",
    "EMNLP",
    "NAACL",
    "AAAI",
    "IJCAI",
    "KDD",
    "WWW",
    "SIGGRAPH",
    "INTERSPEECH",
    "ICASSP",
    "CHI",
  ];
  const haystack = `${title} ${text}`;
  for (const h of hosts) {
    const re = new RegExp(`\\b${h}\\s*(20\\d{2})?`, "i");
    const m = haystack.match(re);
    if (m) return m[1] ? `${h} ${m[1]}` : h;
  }
  return null;
}

function guessSub(title: string, text: string): string {
  const hay = `${title} ${text}`.toLowerCase();
  if (/\b(vision|image|video|cvpr|iccv|eccv)\b/.test(hay)) return "CV";
  if (/\b(nlp|language|llm|text|acl|emnlp|naacl)\b/.test(hay)) return "NLP";
  if (/\b(speech|audio|asr|tts|interspeech|icassp)\b/.test(hay)) return "SP";
  if (/\b(robot|manipulation|icra|iros)\b/.test(hay)) return "RO";
  if (/\b(hci|human[- ]computer|chi|ubicomp|cscw)\b/.test(hay)) return "HCI";
  if (/\b(data\s*min|kdd)\b/.test(hay)) return "DM";
  return "ML";
}

export async function POST(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; VizuaraBot/1.0; +https://vizuara.com)",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Fetch failed: ${res.status}` },
        { status: 502 }
      );
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const ogTitle =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").first().text() ||
      "";

    const ogDesc =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    $("script,style,noscript").remove();
    const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 20000);

    const deadline = findDeadline(bodyText);
    const eventDate = findEventDate(bodyText);
    const hostConference = findHostConference(bodyText, ogTitle);
    const sub = guessSub(ogTitle, bodyText);

    const title = ogTitle.trim().slice(0, 200);
    const fullName = ogDesc.trim().slice(0, 300);

    return NextResponse.json({
      preview: {
        title,
        fullName,
        hostConference: hostConference || "",
        link: url,
        deadline: deadline || "",
        date: eventDate || "",
        place: "",
        sub,
      },
    });
  } catch (err: any) {
    console.error("[POST /api/workshops/extract]", err);
    return NextResponse.json(
      { error: err?.message || "Extraction failed" },
      { status: 500 }
    );
  }
}
