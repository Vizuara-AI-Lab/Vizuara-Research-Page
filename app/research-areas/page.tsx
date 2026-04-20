import ResearchAreasSection from "../components/ResearchAreasSection";

export const metadata = {
  title: "Research Areas — Vizuara AI Labs",
  description: "Our work across Scientific ML, model efficiency, language processing, healthcare AI, physics AI, optimization, and chemistry AI.",
};

export default function Page() {
  return (
    <main className="min-h-screen pt-20 pb-16">
      <div className="mx-auto w-full max-w-7xl px-6">
        <ResearchAreasSection />
      </div>
    </main>
  );
}
