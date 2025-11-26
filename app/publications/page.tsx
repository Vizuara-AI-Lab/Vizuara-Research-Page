// app/publications/page.tsx
import { Suspense } from "react";
import PublicationsSection from "../components/PublicationsSection";
import { getPublicationsForAuthors, applyTags, type Publication } from "../lib/scholar";
import { PUB_TOPIC_OVERRIDES } from "../data/publication-topics";

export const revalidate = 21600;
// If you’re on `output: 'export'` and still have issues, you can also add:
// export const dynamic = 'force-dynamic';

const AUTHOR_IDS = ["xTLUWMIAAAAJ", "bU7G7K8AAAAJ", "qq8OirYAAAAJ"];
const FOCUS_TOPICS = [
  "AI",
  "ML",
  "LLM",
  "VLM",
  "SciML",
  "Neural Networks",
  "Reinforcement Learning",
];

export default async function Page() {
  let publications: Publication[] = [];

  // Build-safe fetch (won’t crash the prerender if env/network fails)
  try {
    publications = await getPublicationsForAuthors(AUTHOR_IDS, { maxPages: 2 });
  } catch (err) {
    console.error("Publications fetch failed:", err);
    publications = [];
  }

  // Handpicked image (ensure this file exists in /public/papers)
  const THUMB = "/papers/neural-network.png";
  publications = publications.map((p) => ({ ...p, imageUrl: THUMB }));

  // Topic tags (manual overrides + auto inference)
  publications = applyTags(publications, PUB_TOPIC_OVERRIDES);

  return (
    <Suspense
      fallback={
        <section className="mb-20 scroll-mt-20">
          <h2 className="text-3xl font-normal text-gray-900 mb-2 tracking-tight border-b border-gray-300 pb-2">
            Our Publications
          </h2>
          <div className="text-gray-600">Loading publications…</div>
        </section>
      }
    >
      <PublicationsSection publications={publications} focusTopics={FOCUS_TOPICS} />
    </Suspense>
  );
}