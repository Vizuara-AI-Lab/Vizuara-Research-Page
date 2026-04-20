"use client";

import AnimatedSection from "./AnimatedSection";
import AnimatedCounter from "./AnimatedCounter";
import GlassHero from "./GlassHero";
import BootcampShaderCards from "./BootcampShaderCards";
import ResearchAreasGrid from "./ResearchAreasGrid";
import TestimonialsSection from "./TestimonialsSection";
import LinkedInPostsSection from "./LinkedInPostsSection";
import FAQSection from "./FAQSection";
import dynamic from "next/dynamic";
const PdfThumbnail = dynamic(() => import("./PdfThumbnail"), { ssr: false });
import {
  FaFlask, FaBolt, FaBrain, FaAward,
  FaArrowRight, FaUsers, FaFileLines,
  FaLinkedin, FaGraduationCap,
} from "react-icons/fa6";

/* ─── DATA ─── */

const featuredPapers = [
  {
    title: "Simulating Misinformation Propagation in Social Networks using Large Language Models",
    venue: "Outstanding Paper Award at ACM CIKM 2025",
    authors: "R. G. Maurya, V. Shukla, R. A. Dandekar, R. Dandekar, S. Panat",
    link: "https://arxiv.org/pdf/2511.10384",
    award: true,
    venueLogo: "/venues/acm-cikm-2025.png",
  },
  {
    title: "EARS-UDE: Evaluating Auditory Response in Sensory Overload with Universal Differential Equations",
    venue: "NeurIPS Workshop on AI4Science 2025 (Spotlight)",
    authors: "M. Salunke, P. D. Joshi, R. A. Dandekar, R. Dandekar, S. Panat",
    link: "https://arxiv.org/pdf/2510.26804",
    award: false,
    venueLogo: "/venues/neurips.png",
  },
  {
    title: "Regional-TinyStories: A Small Language Model Framework for Evaluating Language Learning, Tokenizers, and Datasets",
    venue: "IJCNLP-AACL 2025",
    authors: "N. Patil, M. A. Inamdar, A. Gosai, G. Pathak, A. Joshi, A. Joshirao, R. Dandekar, R. Dandekar, S. Panat",
    link: "https://arxiv.org/pdf/2504.07989",
    award: false,
    venueLogo: "/venues/emnlp.png",
  },
];

/* ─── HELPERS ─── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
      <span className="w-8 h-px bg-teal/40" />
      {children}
    </span>
  );
}

/* ─── MAIN PAGE ─── */

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">

      {/* ══════ HERO ══════ */}
      <GlassHero />

      {/* ══════ FEATURED PAPERS (right after hero) ══════ */}
      <section id="publications" className="py-28 scroll-mt-16 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection>
            <SectionLabel>Publications</SectionLabel>
            <h2 className="mt-4 text-4xl sm:text-5xl font-bold text-fg tracking-tight leading-tight">
              Featured Research
            </h2>
            <p className="mt-4 text-lg text-fg-muted max-w-2xl leading-relaxed">
              A curated look at the papers our researchers and students have published at leading AI/ML conferences.
            </p>
          </AnimatedSection>

          <style>{`
            @keyframes award-shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            .award-shimmer {
              background-image: linear-gradient(
                90deg,
                #b45309 0%,
                #f59e0b 25%,
                #fef3c7 50%,
                #f59e0b 75%,
                #b45309 100%
              );
              background-size: 200% 100%;
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
              animation: award-shimmer 6s linear infinite;
            }
            .dark .award-shimmer {
              background-image: linear-gradient(
                90deg,
                #f59e0b 0%,
                #fcd34d 25%,
                #fffbeb 50%,
                #fcd34d 75%,
                #f59e0b 100%
              );
            }
          `}</style>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {featuredPapers.map((p, i) => (
              <AnimatedSection key={i} delay={0.1 + i * 0.08}>
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-border bg-bg overflow-hidden h-full flex flex-col transition-all hover:shadow-lg hover:border-teal/30 hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="relative w-full aspect-[4/3.8] border-b border-border overflow-hidden">
                    <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.08]">
                      <PdfThumbnail url={p.link} className="absolute inset-0 w-full h-full" />
                    </div>
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(1,24,216,0.9) 0%, rgba(27,86,253,0.6) 45%, rgba(27,86,253,0.18) 80%, rgba(27,86,253,0) 100%)",
                      }}
                    />
                    <div className="absolute bottom-2.5 inset-x-3 flex items-end justify-between gap-3">
                      <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] line-clamp-2 max-w-[65%]">
                        {p.venue}
                      </span>
                      {p.venueLogo && (
                        <div className="shrink-0 flex items-center justify-center rounded-lg bg-white/95 dark:bg-white shadow-lg ring-1 ring-black/10 px-2 py-1.5">
                          <img
                            src={p.venueLogo}
                            alt={p.venue}
                            className="h-7 w-auto max-w-[80px] object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col grow">
                    {p.award && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider mb-2">
                        <FaAward className="w-3.5 h-3.5 text-amber-500" />
                        <span className="award-shimmer">Award Winner</span>
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-fg leading-snug mb-3 grow">
                      {p.title}
                    </h3>
                    <p className="text-sm text-fg-muted mb-4">{p.authors}</p>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-teal group-hover:text-teal/80 transition-colors">
                      Read Paper <FaArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </a>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={0.3}>
            <div className="mt-10 text-center">
              <a href="/publications" className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-lg text-base font-semibold text-fg hover:bg-surface-alt transition-colors cursor-pointer">
                View all publications <FaArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider max-w-7xl mx-auto" />

      {/* ══════ PROGRAMS (Shader Cards) ══════ */}
      <BootcampShaderCards />

      {/* ══════ RESEARCH AREAS (Expand Cards) ══════ */}
      <ResearchAreasGrid />

      {/* ══════ FOUNDERS (after Research Areas) ══════ */}
      <section id="founders" className="py-28 scroll-mt-16 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <SectionLabel>Our Team</SectionLabel>
              <h2 className="mt-4 text-4xl sm:text-5xl font-bold text-fg tracking-tight leading-tight">Founded by Researchers</h2>
              <p className="mt-4 text-lg text-fg-muted max-w-2xl mx-auto leading-relaxed">An interdisciplinary team with roots in MIT, Purdue, and IIT Madras.</p>
            </div>
          </AnimatedSection>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { name: "Dr. Raj Dandekar", role: "Co-founder, Vizuara AI Labs", badge: "MIT PhD", photo: "/instructors/Raj.jpeg", bio: "PhD from MIT, B.Tech from IIT Madras. Dr. Raj specializes in building LLMs from scratch, including DeepSeek-style architectures. His expertise spans AI agents, scientific machine learning, and end-to-end model development.", topics: ["GenAI", "LLMs", "AI Agents", "RAG", "SLMs"], unis: [{ name: "MIT", logo: "/instructors/mit-logo.png" }, { name: "IIT Madras", logo: "/instructors/iitmadras-logo.png" }], linkedin: "https://www.linkedin.com/in/raj-abhijit-dandekar-67a33118a/", scholar: "https://scholar.google.com/citations?user=xTLUWMIAAAAJ&hl=en" },
              { name: "Dr. Sreedath Panat", role: "Co-founder, Vizuara AI Labs", badge: "MIT PhD", photo: "/instructors/SreedathP.png", bio: "PhD from MIT, B.Tech from IIT Madras. 10+ years of research experience. Dr. Panat brings deep technical expertise from both academia and industry to make complex AI concepts accessible and practical.", topics: ["Computer Vision", "ML Foundations", "Scientific ML"], unis: [{ name: "MIT", logo: "/instructors/mit-logo.png" }, { name: "IIT Madras", logo: "/instructors/iitmadras-logo.png" }], linkedin: "https://in.linkedin.com/in/sreedath-panat", scholar: "https://scholar.google.com/citations?user=qq8OirYAAAAJ&hl=en" },
              { name: "Dr. Rajat Dandekar", role: "Co-founder, Vizuara AI Labs", badge: "Purdue PhD", photo: "/instructors/Rajat.png", bio: "PhD from Purdue University, B.Tech and M.Tech from IIT Madras. Dr. Rajat brings deep expertise in reinforcement learning and reasoning models, focusing on advanced AI techniques for real-world applications.", topics: ["Reinforcement Learning", "RLHF", "Reasoning Models"], unis: [{ name: "Purdue", logo: "/instructors/purdue-logo.png" }, { name: "IIT Madras", logo: "/instructors/iitmadras-logo.png" }], linkedin: "https://www.linkedin.com/in/rajat-dandekar-901324b1/", scholar: "https://scholar.google.com/citations?user=bU7G7K8AAAAJ&hl=en" },
            ].map((f, i) => (
              <AnimatedSection key={f.name} delay={0.1 + i * 0.1}>
                <div className="rounded-2xl border border-border bg-bg p-6 h-full flex flex-col items-center text-center transition-all hover:shadow-lg hover:border-teal/30">
                  <div className="relative mb-4">
                    <img src={f.photo} alt={f.name} className="w-28 h-28 rounded-full object-cover border-2 border-border" />
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-accent text-white px-3 py-0.5 rounded-full whitespace-nowrap">{f.badge}</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3 mb-3">
                    {f.topics.map((t) => (<span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-alt text-fg-muted">{t}</span>))}
                  </div>
                  <h3 className="text-lg font-bold text-fg">{f.name}</h3>
                  <p className="text-sm text-teal font-medium mb-3">{f.role}</p>
                  <p className="text-sm text-fg-muted leading-relaxed mb-5 grow">{f.bio}</p>
                  <div className="flex items-center justify-center gap-4 mb-5">
                    {f.unis.map((u) => (<div key={u.name} className="flex items-center gap-1.5"><img src={u.logo} alt={u.name} className="h-6 w-auto object-contain" /><span className="text-xs text-fg-muted font-medium">{u.name}</span></div>))}
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-border w-full justify-center">
                    <a href={f.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted hover:text-teal transition-colors"><FaLinkedin className="w-3.5 h-3.5" /> LinkedIn</a>
                    <a href={f.scholar} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted hover:text-teal transition-colors"><FaGraduationCap className="w-3.5 h-3.5" /> Scholar</a>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ LINKEDIN POSTS ══════ */}
      <LinkedInPostsSection />

      {/* ══════ TESTIMONIALS ══════ */}
      <TestimonialsSection />

      {/* ══════ FAQ ══════ */}
      <FAQSection />

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-border py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Vizuara" className="h-8" />
              <span className="text-base font-bold text-fg">Vizuara Research Bootcamps</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-fg-muted">
              <a href="mailto:research@vizuara.com" className="hover:text-fg transition-colors">research@vizuara.com</a>
              <span>&copy; {new Date().getFullYear()} Vizuara AI Labs</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
