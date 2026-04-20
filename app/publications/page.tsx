import { Suspense } from "react";
import PublicationsSection from "../components/PublicationsSection";
import { headers } from "next/headers";

export const revalidate = 3600;

async function getPubs() {
  try {
    const hdrs = await headers();
    const host = hdrs.get("host") || "localhost:3000";
    const proto = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${proto}://${host}`;

    const res = await fetch(`${baseUrl}/api/pubs`, { cache: "no-store" });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    return data.publications || [];
  } catch (err) {
    console.warn("Local API failed, trying production...", (err as Error).message);
    try {
      const res = await fetch("https://vizuara-research-page.vercel.app/api/pubs", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        return data.publications || [];
      }
    } catch {}
    return [];
  }
}

export default async function Page() {
  const publications = await getPubs();
  return (
    <main className="min-h-screen pt-20 pb-16">
      <div className="mx-auto w-full max-w-7xl px-6">
        <Suspense fallback={<div className="p-6 text-fg-muted">Loading...</div>}>
          <PublicationsSection
            publications={publications as any}
            focusTopics={["AI", "ML", "LLM", "SciML"]}
          />
        </Suspense>
      </div>
    </main>
  );
}
