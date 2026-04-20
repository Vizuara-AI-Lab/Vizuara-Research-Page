import { NextResponse } from "next/server";
import { parse } from "yaml";

const BASE =
  "https://raw.githubusercontent.com/ccfddl/ccf-deadlines/main/conference";

// folder/file pairs for relevant AI/ML/CV/NLP/HCI/Systems conferences
const CONF_FILES: { folder: string; file: string }[] = [
  // AI
  ...["nips","icml","iclr","cvpr","aaai","ijcai","acl","emnlp","naacl","eacl",
    "coling","eccv","iccv","wacv","aistats","uai","colt","icra","iros","aamas",
    "kr","colm","corl","bmvc","accv","icaps","rss","icann","log","acml","icpr",
    "icdar","gecco","ecai","alt","cec","probml","cpal",
  ].map((f) => ({ folder: "AI", file: f })),
  // CG (multimedia, speech, vision)
  ...["mm","icassp","interspeech","icme","icmr","icip","sig","siga","slt","vis","vr","ismar",
  ].map((f) => ({ folder: "CG", file: f })),
  // HI (human-computer interaction)
  ...["chi","cscw","ubicomp","uist","iui","icmi","percom","icwsm",
  ].map((f) => ({ folder: "HI", file: f })),
  // MX (interdisciplinary — MLSys, WWW, MICCAI, etc.)
  ...["mlsys","www","miccai","bibm","bigdata","cogsci","recomb",
  ].map((f) => ({ folder: "MX", file: f })),
  // DS (systems — ASPLOS, OSDI-like, etc.)
  ...["asplos","eurosys","isca","micro","hpca","sc","socc","sigmetrics",
  ].map((f) => ({ folder: "DS", file: f })),
];

interface RawConf {
  title: string;
  description?: string;
  sub?: string;
  rank?: { ccf?: string; core?: string };
  confs: {
    year: number;
    id: string;
    link: string;
    timeline: { deadline: string; abstract_deadline?: string }[];
    timezone?: string;
    date: string;
    place: string;
  }[];
}

export async function GET() {
  try {
    const fetches = CONF_FILES.map((c) =>
      fetch(`${BASE}/${c.folder}/${c.file}.yml`, { next: { revalidate: 86400 } })
        .then((r) => (r.ok ? r.text() : null))
        .catch(() => null)
    );

    const texts = await Promise.all(fetches);
    const now = new Date();

    const venues: any[] = [];

    for (const text of texts) {
      if (!text) continue;
      try {
        const parsed: RawConf[] = parse(text);
        for (const conf of parsed) {
          for (const c of conf.confs) {
            const tl = c.timeline?.[c.timeline.length - 1];
            if (!tl?.deadline) continue;

            const deadlineDate = new Date(tl.deadline);
            if (deadlineDate.getTime() <= now.getTime()) continue;

            venues.push({
              title: conf.title,
              fullName: conf.description || null,
              year: c.year,
              link: c.link,
              deadline: tl.deadline,
              abstractDeadline: tl.abstract_deadline || null,
              timezone: c.timezone || "UTC",
              place: c.place,
              date: c.date,
              rank: conf.rank?.ccf || null,
              sub: conf.sub || "AI",
            });
          }
        }
      } catch {
        // skip malformed YAML
      }
    }

    venues.sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );

    return NextResponse.json(venues, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("Upcoming venues fetch error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
