"use client";

import {
  ArrowRight,
  Play,
  Target,
  Award,
  Star,
  Calendar,
  HelpCircle,
} from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";
import { ArrowUpRightIcon } from "./ArrowUpRightIcon";

/* ── Venues Marquee ──
   `logo` points to an image under /public/venues when we have a real
   logo asset; otherwise the venue is rendered as styled text.        */
type Venue = { name: string; logo?: string };
const VENUES: Venue[] = [
  { name: "NeurIPS Workshop", logo: "/venues/neurips.png" },
  { name: "ICLR Workshop", logo: "/venues/iclr.png" },
  { name: "ICML", logo: "/venues/icml.svg" },
  { name: "ICCV Workshop" },
  { name: "AAAI Workshop", logo: "/venues/aaai.png" },
  { name: "JuliaCon", logo: "/venues/juliacon.png" },
  { name: "MSML" },
  { name: "FastML", logo: "/venues/fastml_logo.png" },
  { name: "IEEE eScience", logo: "/venues/ieee-escience.png" },
  { name: "EMNLP / EACL", logo: "/venues/emnlp.png" },
  { name: "arXiv", logo: "/venues/arxiv.png" },
  { name: "EGU", logo: "/venues/egu.png" },
  { name: "PyCon Africa", logo: "/venues/pycon_africa.png" },
  { name: "MIT URTC", logo: "/venues/mit-urtc.png" },
  { name: "ACM CIKM", logo: "/venues/acm-cikm.png" },
];

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center justify-center transition-transform hover:-translate-y-1 cursor-default">
    <span className="text-xl font-bold text-fg sm:text-2xl">{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-fg-muted font-medium sm:text-xs">
      {label}
    </span>
  </div>
);

export default function GlassHero() {
  return (
    <div
      className="relative w-full bg-no-repeat bg-cover bg-center text-fg overflow-hidden hero-section"
    >
      <style>{`
        .hero-section {
          background-color: #ffffff;
          background-image: url('https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/hero/gridBackground.png');
          position: relative;
        }
        .hero-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 70% 60%, rgba(1,24,216,0.06) 0%, transparent 60%),
                      radial-gradient(ellipse at 30% 40%, rgba(27,86,253,0.04) 0%, transparent 50%);
          z-index: 1;
          pointer-events: none;
        }
        .dark .hero-section {
          background-color: #07091A;
          background-image: none;
        }
        .dark .hero-section::before {
          background: radial-gradient(ellipse at 70% 60%, rgba(27,86,253,0.08) 0%, transparent 60%);
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes shimmer2 {
          0% { background-position: 0% 0%; }
          100% { background-position: -200% 0%; }
        }
        .anim-fade { animation: fadeSlideIn 0.8s ease-out forwards; opacity: 0; }
        .anim-marquee { animation: marquee 35s linear infinite; }
        .d1 { animation-delay: 0.1s; }
        .d2 { animation-delay: 0.2s; }
        .d3 { animation-delay: 0.3s; }
        .d4 { animation-delay: 0.4s; }
        .d5 { animation-delay: 0.5s; }
      `}</style>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-6 sm:px-6 md:pt-28 md:pb-8 lg:px-8 min-h-screen flex flex-col justify-center">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8 items-start">
          {/* ── LEFT ── */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
            {/* Badge */}
            <div className="anim-fade d1">
              <div className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 backdrop-blur-md transition-colors hover:bg-surface-alt" style={{ backgroundImage: 'linear-gradient(110deg, var(--surface-alt) 45%, var(--bg) 55%, var(--surface-alt))', backgroundSize: '200% 100%', animation: 'shimmer2 2.5s linear infinite' }}>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-fg-muted flex items-center gap-2">
                  Top-Tier Research Programs
                  <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="anim-fade d2 text-5xl sm:text-6xl lg:text-[68px] xl:text-7xl font-bold tracking-tighter leading-[1.1] pb-2">
              Vizuara Research
              <br />
              <span className="inline-block pb-2 pr-2 bg-gradient-to-br from-fg via-fg to-accent bg-clip-text text-transparent">
                Bootcamps
              </span>
            </h1>

            {/* Description */}
            <p className="anim-fade d3 max-w-xl text-lg text-fg-muted leading-relaxed">
              From foundations to publishing at top-tier venues. We run intensive
              AI &amp; ML research bootcamps that prepare you to write and submit
              original research papers.
            </p>

            {/* CTAs */}
            <div className="anim-fade d4 flex flex-col sm:flex-row gap-3">
              <a
                href="#programs"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-fg text-bg px-7 py-3 text-sm font-semibold transition-all hover:scale-[1.02] hover:opacity-90 active:scale-[0.98] cursor-pointer"
              >
                Explore Programs
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#publications"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-surface-alt/60 px-7 py-3 text-sm font-semibold text-fg backdrop-blur-sm transition-colors hover:bg-surface-alt cursor-pointer" style={{ border: "2px solid #0118D8" }}
              >
                <Play className="w-4 h-4 fill-current" />
                Read Our Research
              </a>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="lg:col-span-5 space-y-6 lg:mt-4">
            {/* Stats Card */}
            <div className="anim-fade d5 relative overflow-hidden rounded-3xl border border-border bg-surface/80 p-6 backdrop-blur-xl shadow-2xl">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-alt ring-1 ring-border">
                    <Target className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-fg">
                      <AnimatedCounter target={50} suffix="+" />
                    </div>
                    <div className="text-sm text-fg-muted">
                      Papers Published
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-border mb-4" />

                {/* Mini Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-fg sm:text-2xl"><AnimatedCounter target={6} /></span>
                    <span className="text-[10px] uppercase tracking-wider text-fg-muted font-medium sm:text-xs">Programs</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-fg sm:text-2xl"><AnimatedCounter target={30} suffix="+" /></span>
                    <span className="text-[10px] uppercase tracking-wider text-fg-muted font-medium sm:text-xs">Research Areas</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-alt/60 px-3 py-1 text-[10px] font-medium tracking-wide text-fg-muted">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-hover opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                    </span>
                    ENROLLING NOW
                  </div>
                  <a href="/upcoming-venues" className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[10px] font-medium tracking-wide hover:border-accent/30 transition-colors cursor-pointer" style={{ backgroundImage: 'linear-gradient(110deg, var(--surface-alt) 45%, var(--bg) 55%, var(--surface-alt))', backgroundSize: '200% 100%', animation: 'shimmer2 2.5s linear infinite' }}>
                    <Calendar className="w-3 h-3 text-accent" />
                    <span className="text-fg-muted">UPCOMING VENUES</span>
                    <ArrowUpRightIcon size={14} />
                  </a>
                  <a href="/faq" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-alt/60 px-3 py-1 text-[10px] font-medium tracking-wide text-fg-muted hover:border-accent/30 transition-colors cursor-pointer">
                    <HelpCircle className="w-3 h-3 text-accent" />
                    FAQ
                    <ArrowRight className="w-3 h-3 rotate-90" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── FULL-WIDTH VENUES MARQUEE ── */}
        <div className="anim-fade d5 mt-28 relative overflow-hidden py-4">
          <h3 className="mb-4 px-8 text-xs font-semibold text-fg-muted tracking-wide uppercase">
            Publication Venues of Our Bootcamp Students
          </h3>

          <div
            className="relative flex overflow-hidden"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
            }}
          >
            <div className="anim-marquee flex items-center gap-14 whitespace-nowrap px-4">
              {[...VENUES, ...VENUES].map((v, i) => (
                <div
                  key={i}
                  className="flex shrink-0 items-center gap-2.5 opacity-80 transition-all hover:opacity-100 hover:scale-105 cursor-default"
                  title={v.name}
                >
                  {v.logo ? (
                    <img
                      src={v.logo}
                      alt={v.name}
                      className="h-9 w-auto max-w-[140px] object-contain dark:brightness-110"
                    />
                  ) : (
                    <span className="text-lg font-bold text-fg tracking-tight">
                      {v.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
