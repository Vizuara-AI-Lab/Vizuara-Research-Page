"use client";

import AnimatedSection from "./AnimatedSection";
import AnimatedCounter from "./AnimatedCounter";
import { FaMicroscope, FaArrowRight } from "react-icons/fa6";

const researchProjects = [
  { category: "Scientific ML", title: "Battery Degradation Prediction in EVs Using SciML", authors: "S. Murgai, H. Bhagwat, R.A. Dandekar et al.", paperLink: "https://arxiv.org/abs/2410.14347" },
  { category: "Machine Learning", title: "Music Recommendation with Regional Tune Recognition", authors: "T. Bhimrajka, S. Goel, O. Lalla", paperLink: undefined },
  { category: "Aerospace AI", title: "ML Models in Liquid Rocket Engine Control", authors: "M. Gandho", paperLink: "https://www.jsr.org/hs/index.php/path/article/view/7649" },
  { category: "Computer Vision", title: "Rice Leaf Disease Detection with AI Models", authors: "A. Gupta, V. Singhal, D. Vaidya", paperLink: undefined },
  { category: "Environmental AI", title: "Harmful Algal Bloom Modeling Using SciML", authors: "K. Rangwala", paperLink: undefined },
];

export default function JuniorResearchSection() {
  return (
    <section id="junior-research" className="scroll-mt-20">
      <AnimatedSection>
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-fg-muted">
          <span className="w-6 h-px bg-steel" /> Student Research
        </span>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-fg tracking-tight">
          Junior Research
        </h2>
        <p className="mt-3 text-fg-muted leading-relaxed mb-10">Student research from our AI High School Program.</p>
      </AnimatedSection>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        {researchProjects.map((p, i) => (
          <AnimatedSection key={i} delay={i * 0.05}>
            <div className="rounded-xl border border-border bg-surface p-5 h-full flex flex-col">
              <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider text-steel mb-2">
                <FaMicroscope className="w-2.5 h-2.5 mr-1.5" />{p.category}
              </span>
              <h4 className="text-sm font-semibold text-fg leading-snug mb-2 grow">{p.title}</h4>
              <p className="text-xs text-fg-muted mb-3">{p.authors}</p>
              {p.paperLink && (
                <a href={p.paperLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors">
                  Read Paper <FaArrowRight className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection>
        <div className="flex items-center justify-center gap-10 sm:gap-16 py-8 rounded-xl bg-surface-alt/50 mb-8">
          {[{ n: 10, l: "Research Papers" }, { n: 15, s: "+", l: "Active Projects" }, { n: 30, s: "+", l: "Participants" }].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-2xl font-bold text-fg">
                <AnimatedCounter target={s.n} suffix={s.s || ""} />
              </div>
              <div className="text-xs text-fg-muted mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <div className="text-center">
          <a href="https://ai-highschool-research.vizuara.ai/" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-accent text-white dark:text-bg px-6 py-3 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer">
            Join Our Program <FaArrowRight className="w-3 h-3" />
          </a>
        </div>
      </AnimatedSection>
    </section>
  );
}
