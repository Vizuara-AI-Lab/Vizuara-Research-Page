import { Suspense } from "react";
import PublicationsSection from "../components/PublicationsSection";

export const revalidate = 3600;

async function getPubs() {
  // In dev, relative fetch works
  const res = await fetch("http://localhost:3000/api/pubs", {
    cache: "no-store",
  });
  if (!res.ok) return { publications: [] };
  return res.json();
}

export default async function Page() {
  const { publications } = await getPubs();
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <PublicationsSection
        publications={publications}
        focusTopics={["AI", "ML", "LLM", "SciML"]}
      />
    </Suspense>
  );
}
