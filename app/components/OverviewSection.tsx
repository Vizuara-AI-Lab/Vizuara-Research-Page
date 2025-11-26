import Link from "next/link";

export default function OverviewSection() {
  return (
    <section id="overview" className="mb-20 scroll-mt-20">
      <div className="grid items-start gap-10 md:grid-cols-2">
        {/* Left: mission, focus areas, CTAs, stats */}
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700">
            <span className="h-2 w-2 rounded-full bg-vblue" />
            Research Group
          </div>

          <h1 className="text-5xl font-normal tracking-tight mb-4">
            Vizuara AI Labs
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed font-light">
            We develop efficient language and vision models and apply scientific
            machine learning to physics, ecology, and health. Our work blends
            theory, computation, and open science.
          </p>

          {/* Focus areas as scholarly chips */}
          <ul className="mt-6 flex flex-wrap gap-2">
            {[
              "Scientific ML",
              "Model Efficiency",
              "Language Processing",
              "Computational Physics",
              "Optimization",
            ].map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700"
              >
                {tag}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link
              href="/publications"
              className="inline-flex items-center justify-center rounded-md bg-vblue px-5 py-2.5 text-white hover:opacity-90"
            >
              View publications →
            </Link>
            <Link
              href="/research-areas"
              className="inline-flex items-center justify-center rounded-md border border-vblue px-5 py-2.5 text-vblue hover:bg-blue-50/50"
            >
              Explore research areas
            </Link>
          </div>

          {/* Impact stats */}
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            <div className="bg-gray-50 border border-gray-300 p-5 text-center">
              <div className="text-3xl font-normal text-gray-900">5+</div>
              <div className="text-sm text-gray-700 font-light">
                Publications
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-300 p-5 text-center">
              <div className="text-3xl font-normal text-gray-900">7+</div>
              <div className="text-sm text-gray-700 font-light">
                Research Areas
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-300 p-5 text-center">
              <div className="text-3xl font-normal text-gray-900">12+</div>
              <div className="text-sm text-gray-700 font-light">
                Researchers
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE — TWO FEATURED PAPERS */}
        <div className="space-y-6">
          {/* 1️⃣ NEW PAPER — AlignShift */}
          <figure className="relative overflow-hidden border border-gray-300 bg-gray-50">
            <img
              src="https://staging-8934-flyvidesh.wpcomstaging.com/wp-content/uploads/2025/05/Screenshot-2025-02-18-at-2.03.06 PM-1024x563.png"
              alt="AlignShift: Mitigating Data-Textual Misalignment in Multimodal Models"
              className="w-full h-64 md:h-[22rem] object-cover"
            />
            <figcaption className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm">
              <span className="text-gray-700 font-light">
                HULLMI: Human vs LLM identification with explainability
              </span>
              <a
                href="https://arxiv.org/abs/2409.04808"
                target="_blank"
                rel="noopener noreferrer"
                className="text-vblue hover:underline whitespace-nowrap"
              >
                Read paper →
              </a>
            </figcaption>
          </figure>

          {/* 2️⃣ Existing NanoVLMs paper
          <figure className="relative overflow-hidden border border-gray-300 bg-gray-50">
            <img
              src="https://research.vizuara.ai/lovable-uploads/2cc919d1-2b32-4ca7-ad64-4456c407a9f6.png"
              alt="Visualization from our recent research"
              className="w-full h-64 md:h-[22rem] object-cover"
            />
            <figcaption className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm">
              <span className="text-gray-700 font-light">
                NanoVLMs — small, coherent vision–language models
              </span>
              <a
                href="https://arxiv.org/abs/2502.07838"
                target="_blank"
                rel="noopener noreferrer"
                className="text-vblue hover:underline whitespace-nowrap"
              >
                Read paper →
              </a>
            </figcaption>
          </figure> */}
        </div>
      </div>
    </section>
  );
}
