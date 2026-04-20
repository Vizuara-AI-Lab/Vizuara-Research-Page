import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const envPath = resolve(process.cwd(), ".env.local");
const envRaw = readFileSync(envPath, "utf8");
for (const line of envRaw.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (!m) continue;
  let val = m[2].trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  if (!(m[1] in process.env)) process.env[m[1]] = val;
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(
  /\\n/g,
  "\n"
);

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase env vars in .env.local");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

const db = getFirestore();

// Inserted in display order — FAQ API sorts by createdAt asc.
const faqs = [
  {
    question: "Who are these bootcamps for?",
    answer:
      "Our bootcamps are designed for students, researchers, and professionals who want to publish original research papers in AI and ML. We have programs ranging from high school level (beginner) to advanced professional tracks. No prior research experience is required, just strong motivation to learn.",
  },
  {
    question: "What is the typical bootcamp duration?",
    answer:
      "Most bootcamps run for 4 months, with the exception of the AI High School Research Bootcamp (8 weeks) and the Reinforcement Learning Bootcamp (7 weeks of foundations + 3 months of hands-on research). Each program is designed to take you from fundamentals to a submission-ready paper.",
  },
  {
    question: "Will I actually publish a research paper?",
    answer:
      "Publishing original research is the core goal of our bootcamps, and our students have co-authored papers submitted to top venues like NeurIPS, ICML, ICLR, CVPR, and AAAI. Faculty provide detailed paper reviews, structured guidance, and full submission support throughout the program. That said, publication outcomes ultimately depend on each student's individual effort, consistency, and engagement. The depth and quality of your final paper will reflect the time, rigor, and ownership you bring to your research.",
  },
  {
    question: "What venues do students typically publish at?",
    answer:
      "Our students have published at NeurIPS, ICML, ICLR, CVPR, AAAI, ACL, EMNLP, and various top-tier workshops. We also support submissions to journals like Nature Machine Intelligence, Journal of Fluid Mechanics, and arXiv preprints.",
  },
  {
    question: "Who are the instructors?",
    answer:
      "All bootcamps are led by PhD researchers from MIT, Purdue, and IIT Madras with active publication records. Our founders, Dr. Raj Dandekar, Dr. Sreedath Panat, and Dr. Rajat Dandekar, personally mentor students and review papers.",
  },
  {
    question: "What is the time commitment per week?",
    answer:
      "Expect roughly 10–15 hours per week. This includes live sessions, reading papers, coding experiments, and writing. The program is designed to be intensive but manageable alongside studies or work.",
  },
  {
    question: "Do I need a strong coding background?",
    answer:
      "A basic understanding of Python is recommended. For advanced bootcamps (SciML, RL, GenAI), familiarity with PyTorch or JAX is helpful but not mandatory, as we cover the necessary tools during the program.",
  },
  {
    question: "How do I enroll?",
    answer:
      "Visit the specific bootcamp page and fill out the application form. For general inquiries, email us at research@vizuara.com. Cohorts have limited seats, so we recommend applying early.",
  },
  {
    question: "Does Vizuara cover workshop registration, compute, or project costs?",
    answer:
      "No. Vizuara does not fund or reimburse any external expenses related to your research. This includes conference or workshop registration fees, travel and accommodation, cloud or GPU compute costs, dataset or API subscriptions, and any third-party tooling required for your project. Our bootcamps provide research mentorship, structured curriculum, paper reviews, and submission guidance, but all external costs are the responsibility of the student. We recommend planning for these expenses in advance and exploring institutional funding, student grants, or cloud provider credits where applicable.",
  },
];

const col = db.collection("faqs");
const existing = await col.get();
const existingKeys = new Set(
  existing.docs.map((d) => (d.data().question || "").trim().toLowerCase())
);

let added = 0;
let skipped = 0;
for (const f of faqs) {
  if (existingKeys.has(f.question.trim().toLowerCase())) {
    skipped++;
    console.log(`skip: ${f.question}`);
    continue;
  }
  const now = new Date();
  await col.add({
    question: f.question,
    answer: f.answer,
    published: true,
    createdAt: now,
    updatedAt: now,
  });
  await new Promise((r) => setTimeout(r, 50));
  added++;
  console.log(`ok:   ${f.question}`);
}

console.log(`\nDone. Added ${added}, skipped ${skipped}.`);
process.exit(0);
