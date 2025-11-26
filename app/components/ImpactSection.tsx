import StatCard from "./StatCard";

export default function ImpactSection() {
  const stats = [
    { value: "7+", label: "Active Research Areas" },
    { value: "5+", label: "Published Papers" },
    { value: "12+", label: "Research Team" },
  ];

  return (
    <section id="impact" className="mb-20 scroll-mt-20">
      {/* Header */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700">
          <span className="h-2 w-2 rounded-full bg-vblue" />
          Impact snapshot
        </div>
        <h2 className="mt-3 text-3xl font-normal text-gray-900 tracking-tight">
          Impact
        </h2>
        <p className="text-gray-600 font-light mt-2">
          A quick view of our lab’s footprint across research areas,
          publications, and people.
        </p>
      </div>

      {/* Panel with stats + CTAs */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50/30 to-transparent p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              value={stat.value}
              label={stat.label}
              isHighlighted
            />
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600 font-light">
            Data reflects the latest updates from our publications and active
            projects.
          </p>
          <div className="flex gap-3">
            <a
              href="/publications"
              className="inline-flex items-center rounded-md bg-vblue px-4 py-2 text-white hover:opacity-90 text-sm"
            >
              View publications →
            </a>
            <a
              href="/research-areas"
              className="inline-flex items-center rounded-md border border-vblue px-4 py-2 text-vblue hover:bg-blue-50/50 text-sm"
            >
              Explore research areas
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}