"use client";

import AnimatedSection from "./AnimatedSection";
import AnimatedCounter from "./AnimatedCounter";
import {
  FaBrain, FaAtom, FaNetworkWired, FaRobot, FaGraduationCap, FaEye,
  FaClock, FaArrowRight, FaBookOpen, FaUsers, FaFileLines, FaEnvelope,
  FaDiagramProject, FaLayerGroup, FaComments,
} from "react-icons/fa6";

const bootcamps = [
  { title: "Reinforcement Learning Research Bootcamp", level: "Intermediate to Advanced", duration: "7 weeks + 3 months research", highlights: "Comprehensive program to write high-quality research papers in Reinforcement Learning", participants: "Open for applications", link: "https://rlresearcherbootcamp.vizuara.ai/", icon: <FaBrain />, color: "#7C3AED" },
  { title: "Scientific Machine Learning Bootcamp", level: "Advanced", duration: "4 months", highlights: "PINNs, Scientific Computing, Publication Guidance", participants: "80+ Participants", link: "https://flyvidesh.online/ml-bootcamp/", icon: <FaAtom />, color: "#0891B2" },
  { title: "ML/DL Research Bootcamp", level: "Beginner to Intermediate", duration: "4 months", highlights: "Deep Learning Architectures, Research Papers, Industry Applications", participants: "30+ Participants", link: "https://flyvidesh.online/ml-dl-bootcamp/", icon: <FaNetworkWired />, color: "#0118D8" },
  { title: "Gen AI Professional Bootcamp", level: "Professional", duration: "4 months", highlights: "Advanced Model Architectures, Research Methodologies, Novel Algorithm Development", participants: "40+ Participants", link: "https://flyvidesh.online/gen-ai-professional-bootcamp/", icon: <FaRobot />, color: "#2563EB" },
  { title: "AI High School Research Bootcamp", level: "Beginner to Intermediate", duration: "8 weeks", highlights: "Research Fundamentals, Mentorship, College Prep", participants: "25+ Participants", link: "https://ai-highschool-research.vizuara.ai/", icon: <FaGraduationCap />, color: "#D97706" },
  { title: "Computer Vision Research Bootcamp", level: "Beginner to Intermediate", duration: "4-Month Intensive Program", highlights: "Build strong foundations, work on impactful problems in CV, and publish at top-tier venues.", participants: "Open for applications", link: "https://cvresearchbootcamp.vizuara.ai/", icon: <FaEye />, color: "#DC2626" },
  { title: "VLA Bootcamp", level: "Intermediate", duration: "4 months", highlights: "Master Vision-Language-Action models and build AI brains for autonomous driving.", participants: "Open for applications", link: "https://vla.vizuara.ai/", icon: <FaDiagramProject />, color: "#0F766E" },
  { title: "GPU Engineer's Bootcamp: 5D Parallelism", level: "Beginner to Industrial-Grade", duration: "4 months", highlights: "Code GPT-2 from scratch and distribute training across 8 GPUs with 5D parallelism.", participants: "Open for applications", link: "https://5d-parallelism.vizuara.ai/", icon: <FaLayerGroup />, color: "#52525B" },
  { title: "AI Context Engineering Workshop", level: "Professional", duration: "4 months", highlights: "Master context engineering for LLMs and build production-grade AI agents.", participants: "Open for applications", link: "https://context-engineering.vizuara.ai/", icon: <FaComments />, color: "#A21CAF" },
];

export default function BootcampsSection() {
  return (
    <section id="bootcamps" className="scroll-mt-20">
      <AnimatedSection>
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-fg-muted">
          <span className="w-6 h-px bg-steel" /> Programs
        </span>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-fg tracking-tight">
          Research Bootcamps
        </h2>
        <p className="mt-3 text-fg-muted max-w-2xl leading-relaxed">
          Intensive training programs designed to accelerate your journey in AI and ML research.
        </p>
      </AnimatedSection>

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bootcamps.map((b, i) => (
          <AnimatedSection key={i} delay={i * 0.06}>
            <a href={b.link} target="_blank" rel="noopener noreferrer"
              className="group flex flex-col h-full rounded-xl border border-border bg-surface p-6 transition-all hover:shadow-lg hover:border-steel/40 hover:-translate-y-0.5 cursor-pointer">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg text-white mb-4" style={{ backgroundColor: b.color }}>
                <span className="text-lg">{b.icon}</span>
              </div>
              <h3 className="text-base font-semibold text-fg leading-snug mb-2">{b.title}</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-alt text-fg-muted font-medium">{b.level}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-alt text-fg-muted font-medium flex items-center gap-1">
                  <FaClock className="w-2.5 h-2.5" />{b.duration}
                </span>
              </div>
              <p className="text-sm text-fg-muted leading-relaxed mb-4 grow">{b.highlights}</p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className={`text-xs font-medium ${b.participants.includes("Open") ? "text-accent dark:text-accent" : "text-fg-muted"}`}>
                  {b.participants.includes("Open") && <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent mr-1.5 animate-pulse" />}
                  {b.participants}
                </span>
                <FaArrowRight className="w-3 h-3 text-fg-muted group-hover:text-fg group-hover:translate-x-0.5 transition-all" />
              </div>
            </a>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection delay={0.2}>
        <div className="mt-12 flex items-center justify-center gap-10 sm:gap-16 py-8 rounded-xl bg-surface-alt/50">
          {[
            { icon: <FaBookOpen />, n: 9, l: "Programs" },
            { icon: <FaUsers />, n: 120, s: "+", l: "Participants" },
            { icon: <FaFileLines />, n: 15, s: "+", l: "Publications" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="flex justify-center text-steel mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-fg">
                <AnimatedCounter target={s.n} suffix={s.s || ""} />
              </div>
              <div className="text-xs text-fg-muted mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.25}>
        <div className="mt-8 text-center">
          <a href="mailto:research@vizuara.com?subject=Bootcamp Enrollment Inquiry"
            className="inline-flex items-center gap-2 bg-accent text-white dark:text-bg px-6 py-3 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer">
            <FaEnvelope className="w-3.5 h-3.5" /> Contact Us for Enrollment
          </a>
        </div>
      </AnimatedSection>
    </section>
  );
}
