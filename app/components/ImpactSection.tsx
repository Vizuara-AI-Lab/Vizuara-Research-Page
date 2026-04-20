"use client";

import AnimatedSection from "./AnimatedSection";
import AnimatedCounter from "./AnimatedCounter";
import { FaFlask, FaFileLines, FaUsers, FaArrowRight } from "react-icons/fa6";

export default function ImpactSection() {
  const stats = [
    { n: 10, s: "+", label: "Active Research Areas", icon: <FaFlask className="w-5 h-5" /> },
    { n: 20, s: "+", label: "Published Papers", icon: <FaFileLines className="w-5 h-5" /> },
    { n: 20, s: "+", label: "Research Team", icon: <FaUsers className="w-5 h-5" /> },
  ];

  return (
    <section id="impact" className="scroll-mt-20">
      <AnimatedSection>
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-fg-muted">
          <span className="w-6 h-px bg-steel" /> Impact
        </span>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-fg tracking-tight">
          Our Footprint
        </h2>
        <p className="mt-3 text-fg-muted max-w-xl leading-relaxed">
          A snapshot of our growing impact across research, education, and open science.
        </p>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-8 rounded-xl border border-border bg-surface transition-all hover:shadow-md">
              <div className="flex justify-center text-steel mb-3">{stat.icon}</div>
              <div className="text-4xl font-bold text-fg mb-1">
                <AnimatedCounter target={stat.n} suffix={stat.s} />
              </div>
              <div className="text-sm text-fg-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <div className="mt-8 flex items-center justify-center gap-4">
          <a href="/publications" className="inline-flex items-center gap-2 bg-accent text-white dark:text-bg px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer">
            View publications <FaArrowRight className="w-3 h-3" />
          </a>
          <a href="/research-areas" className="inline-flex items-center gap-2 border border-border px-5 py-2.5 rounded-lg text-sm font-medium text-fg hover:bg-surface-alt transition-colors cursor-pointer">
            Explore research areas
          </a>
        </div>
      </AnimatedSection>
    </section>
  );
}
