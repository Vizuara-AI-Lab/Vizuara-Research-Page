"use client";

import { useState, useEffect } from "react";
import {
  Brain, Atom, Network, Bot, GraduationCap, Eye,
  ArrowUpRight, Clock, Mail, Copy, Check, CalendarCheck,
  Waypoints, Layers3, MessagesSquare,
} from "lucide-react";
import AnimatedSection from "./AnimatedSection";

interface Bootcamp {
  title: string;
  level: string;
  duration: string;
  highlights: string;
  participants: string;
  link: string;
  icon: React.ReactNode;
  enrollmentUrl?: string;
}

const bootcamps: Bootcamp[] = [
  {
    title: "Reinforcement Learning Research Bootcamp",
    level: "Intermediate to Advanced",
    duration: "7 weeks + 3 months research",
    highlights: "Comprehensive program to write high-quality research papers in Reinforcement Learning.",
    participants: "Open for applications",
    link: "https://rlresearcherbootcamp.vizuara.ai/",
    icon: <Brain className="w-10 h-10 text-white" strokeWidth={1.5} />,
    enrollmentUrl: "https://us-central1-vizuara-ai-labs.cloudfunctions.net/getActiveEnrollmentCount?courseId=course_20004941",
  },
  {
    title: "Scientific Machine Learning Bootcamp",
    level: "Advanced",
    duration: "4 months",
    highlights: "PINNs, Scientific Computing, Publication Guidance for real-world physics problems.",
    participants: "80+ Participants",
    link: "https://flyvidesh.online/ml-bootcamp/",
    icon: <Atom className="w-10 h-10 text-white" strokeWidth={1.5} />,
    enrollmentUrl: "https://us-central1-videsh-a52fb.cloudfunctions.net/getActiveEnrollmentCount?courseId=course_20000765",
  },
  {
    title: "ML/DL Research Bootcamp",
    level: "Beginner to Intermediate",
    duration: "4 months",
    highlights: "Deep Learning Architectures, Research Papers, and Industry Applications.",
    participants: "30+ Participants",
    link: "https://flyvidesh.online/ml-dl-bootcamp/",
    icon: <Network className="w-10 h-10 text-white" strokeWidth={1.5} />,
    enrollmentUrl: "https://us-central1-videsh-a52fb.cloudfunctions.net/getActiveEnrollmentCount?courseId=course_20000302",
  },
  {
    title: "Gen AI Professional Bootcamp",
    level: "Professional",
    duration: "4 months",
    highlights: "Advanced Model Architectures, Research Methodologies, and Novel Algorithm Development.",
    participants: "40+ Participants",
    link: "https://flyvidesh.online/gen-ai-professional-bootcamp/",
    icon: <Bot className="w-10 h-10 text-white" strokeWidth={1.5} />,
    enrollmentUrl: "https://us-central1-videsh-a52fb.cloudfunctions.net/getActiveEnrollmentCount?courseId=course_20000236",
  },
  {
    title: "AI High School Research Bootcamp",
    level: "Beginner to Intermediate",
    duration: "8 weeks",
    highlights: "Research Fundamentals, Mentorship, and College Prep for high school students.",
    participants: "25+ Participants",
    link: "https://ai-highschool-research.vizuara.ai/",
    icon: <GraduationCap className="w-10 h-10 text-white" strokeWidth={1.5} />,
    enrollmentUrl: "https://us-central1-vizuara-ai-labs.cloudfunctions.net/getActiveEnrollmentCount?courseId=course_20000408",
  },
  {
    title: "Computer Vision Research Bootcamp",
    level: "Beginner to Intermediate",
    duration: "4-Month Intensive",
    highlights: "Build foundations, work on impactful CV problems, and publish at top-tier venues.",
    participants: "Open for applications",
    link: "https://cvresearchbootcamp.vizuara.ai/",
    icon: <Eye className="w-10 h-10 text-white" strokeWidth={1.5} />,
    enrollmentUrl: "https://us-central1-vizuara-ai-labs.cloudfunctions.net/getActiveEnrollmentCount?courseId=course_20005408",
  },
  {
    title: "VLA Bootcamp",
    level: "Intermediate",
    duration: "4 months",
    highlights: "Master Vision-Language-Action models and build AI brains for autonomous driving.",
    participants: "Open for applications",
    link: "https://vla.vizuara.ai/",
    icon: <Waypoints className="w-10 h-10 text-white" strokeWidth={1.5} />,
  },
  {
    title: "GPU Engineer's Bootcamp: 5D Parallelism",
    level: "Beginner to Industrial-Grade",
    duration: "4 months",
    highlights: "Code GPT-2 from scratch and distribute training across 8 GPUs with 5D parallelism.",
    participants: "Open for applications",
    link: "https://5d-parallelism.vizuara.ai/",
    icon: <Layers3 className="w-10 h-10 text-white" strokeWidth={1.5} />,
  },
  {
    title: "AI Context Engineering Workshop",
    level: "Professional",
    duration: "4 months",
    highlights: "Master context engineering for LLMs and build production-grade AI agents.",
    participants: "Open for applications",
    link: "https://context-engineering.vizuara.ai/",
    icon: <MessagesSquare className="w-10 h-10 text-white" strokeWidth={1.5} />,
  },
];

const cardBackgrounds = [
  "from-[#1f1b4d] via-[#5b21b6] to-[#2563eb]",
  "from-[#073042] via-[#0891b2] to-[#14b8a6]",
  "from-[#06362f] via-[#047857] to-[#22c55e]",
  "from-[#0f245c] via-[#1d4ed8] to-[#38bdf8]",
  "from-[#5a2608] via-[#d97706] to-[#facc15]",
  "from-[#4a1024] via-[#be123c] to-[#f43f5e]",
  "from-[#12372a] via-[#0f766e] to-[#34d399]",
  "from-[#27272a] via-[#52525b] to-[#a3a3a3]",
  "from-[#3f1d38] via-[#a21caf] to-[#fb7185]",
];

export default function BootcampShaderCards() {
  const [enrollments, setEnrollments] = useState<Record<number, number>>({});

  useEffect(() => {
    async function fetchEnrollments() {
      try {
        const res = await fetch("/api/enrollments");
        if (!res.ok) return;
        const data = await res.json();
        if (data.counts && typeof data.counts === "object") {
          setEnrollments(data.counts);
        }
      } catch {}
    }
    fetchEnrollments();
  }, []);

  return (
    <section id="programs" className="scroll-mt-16 py-24 bg-bg">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
              <span className="w-8 h-px bg-teal/40" />
              Programs
              <span className="w-8 h-px bg-teal/40" />
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold text-fg mb-5 tracking-tight">
              Research Bootcamps
            </h2>
            <p className="text-lg md:text-xl text-fg-muted max-w-3xl mx-auto leading-relaxed">
              Intensive training programs designed to accelerate your journey from
              learning AI/ML to publishing original research at top-tier venues.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bootcamps.map((bootcamp, index) => {
            const isOpen = bootcamp.participants.toLowerCase().includes("open");
            const liveCount = enrollments[index];
            const displayParticipants = liveCount != null
              ? `${liveCount}+ Participants`
              : bootcamp.participants;
            return (
              <a
                key={index}
                href={bootcamp.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative h-[22rem] block cursor-pointer transition-transform duration-300 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-br ${cardBackgrounds[index % cardBackgrounds.length]}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.18),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_45%)]" />
                </div>

                {/* Overlay content */}
                <div className="relative z-10 p-7 rounded-3xl h-full flex flex-col bg-black/75 backdrop-blur-[2px] border border-white/10 transition-all duration-300 group-hover:bg-black/65">
                  {/* Icon */}
                  <div className="mb-5 filter drop-shadow-lg">{bootcamp.icon}</div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-3 leading-snug">
                    {bootcamp.title}
                  </h3>

                  {/* Meta chips */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md bg-white/10 text-white/90 backdrop-blur-sm">
                      {bootcamp.level}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md bg-white/10 text-white/90 backdrop-blur-sm inline-flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {bootcamp.duration}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm leading-relaxed flex-grow text-white/85">
                    {bootcamp.highlights}
                  </p>

                  {/* Footer */}
                  <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/15">
                    <span className={`text-xs font-semibold inline-flex items-center gap-1.5 ${isOpen && liveCount == null ? "text-blue-300" : "text-white/80"}`}>
                      {isOpen && liveCount == null && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
                        </span>
                      )}
                      {displayParticipants}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-white group-hover:gap-2 transition-all">
                      Learn more
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Lead Researcher CTA */}
        <LeadResearcherCard />

      </div>
    </section>
  );
}

/* ── Lead Researcher Card ── */
function LeadResearcherCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("research@vizuara.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatedSection delay={0.3}>
      <div className="mt-16 rounded-2xl border border-border bg-bg p-8 md:p-10 flex flex-col md:flex-row items-center gap-10">
        {/* Photo */}
        <div className="shrink-0">
          <img
            src="/prathamesh.jpeg"
            alt="Prathamesh Joshi"
            className="w-52 h-52 md:w-60 md:h-60 rounded-2xl object-cover border-2 border-border"
          />
        </div>

        {/* Details */}
        <div className="flex-1 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
            </span>
            Lead AI Scientist
          </span>
          <h3 className="text-2xl font-bold text-fg mb-1">Prathamesh Joshi</h3>
          <p className="text-sm text-fg-muted mb-4">
            Max Planck Institute alum · Generative AI & Scientific ML
          </p>
          <p className="text-sm text-fg-muted leading-relaxed mb-5">
            Prathamesh brings expertise spanning Generative AI and Scientific Machine Learning,
            with publications at ICLR Workshops, IEEE conferences, and other top venues. He has
            mentored students through intensive bootcamps, guiding them toward publications at
            NeurIPS Workshops, ICLR, JuliaCon, and AAAI Workshops.
          </p>
          <p className="text-base font-semibold text-fg mb-2">
            Have questions about our programs? Reach out directly.
          </p>
          <p className="text-sm text-fg-muted mb-5 flex items-center gap-2 justify-center md:justify-start">
            <CalendarCheck className="w-4 h-4 text-teal" />
            Email us to book a free 1:1 consultation call.
          </p>

          {/* Email copy + social icons */}
          <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
            {/* Email with copy */}
            <button
              onClick={handleCopy}
              className="group inline-flex items-center gap-2.5 bg-fg text-bg px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              research@vizuara.com
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
            {copied && (
              <span className="text-xs font-medium text-green-600 dark:text-green-400">Copied!</span>
            )}

            {/* LinkedIn icon */}
            <a
              href="https://www.linkedin.com/in/prathamesh-joshi-b49b31242/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-fg-muted hover:text-teal hover:border-teal/30 transition-colors cursor-pointer"
              aria-label="LinkedIn"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>

            {/* Google Scholar icon */}
            <a
              href="https://scholar.google.com/citations?user=uXzuYvgAAAAJ&hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-fg-muted hover:text-teal hover:border-teal/30 transition-colors cursor-pointer"
              aria-label="Google Scholar"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
