"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Fraunces } from "next/font/google";
import { X, ArrowRight, MapPin } from "lucide-react";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const STORAGE_KEY = "vizuara-neurips26-announcement-seen";

const ACCEPTANCES = [
  { workshop: "Reliable Evaluation for Language Models", domain: "RL Evaluation" },
  { workshop: "Evaluation of Interactive Agents", domain: "AI Agents" },
  { workshop: "Simulation for Science", domain: "Simulation" },
  { workshop: "Transitioning from Pretraining to Post-Training", domain: "RL Post-Training" },
  { workshop: "AI for Stochastic Dynamics", domain: "PDEs · Scientific ML" },
  { workshop: "SLMs for Agentic Systems", domain: "Small Language Models" },
  { workshop: "New in ML", domain: "Physics-Informed ML" },
];

const SUMMARY =
  "Spanning reinforcement learning, AI agents, Scientific ML, physics-informed AI with simulations, and small language models.";

/* ─── Shared bits ─── */

function NeurIPSLogo({ height }: { height: number }) {
  return (
    <span className="inline-flex rounded-md bg-white px-3 py-1.5 shadow-sm">
      <img src="/venues/neurips-cropped.png" alt="NeurIPS" style={{ height, width: "auto" }} />
    </span>
  );
}

const CITIES = ["Sydney", "Paris", "Atlanta"];

// Faint landmark silhouettes for the three NeurIPS 2026 venues, centred on
// 1/6, 1/2 and 5/6 of the width so they line up with the city labels below.
function VenueSkyline() {
  return (
    <div className="relative">
      <div className="mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">
        NeurIPS 2026 · Venues
      </div>
      <svg viewBox="0 0 300 92" className="block h-auto w-full" aria-hidden>
        <defs>
          <linearGradient id="skyline-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.05" />
            <stop offset="0.75" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.26" />
          </linearGradient>
          <linearGradient id="skyline-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* distant low-rise haze across the whole horizon */}
        <g fill="url(#skyline-haze)">
          <path d="M0 84 V76 H6 V72 H12 V78 H18 V74 H96 V70 H104 V76 H112 V71 H120 V77 H126 V73 H174 V75 H182 V70 H190 V76 H198 V72 H206 V78 H300 V84 Z" />
        </g>

        <g fill="url(#skyline-fill)">
          {/* Sydney — Opera House sails + harbour towers */}
          <rect x="6" y="58" width="7" height="26" />
          <rect x="14" y="64" width="6" height="20" />
          <rect x="84" y="62" width="6" height="22" />
          <path d="M18 84 H88 V80 H18 Z" />
          <path d="M24 80 Q29 64 42 57 Q38 69 40 80 Z" />
          <path d="M37 80 Q44 58 60 50 Q54 66 56 80 Z" />
          <path d="M52 80 Q58 64 71 59 Q67 70 69 80 Z" />
          <path d="M64 80 Q70 69 80 66 Q77 73 78 80 Z" />

          {/* Paris — Eiffel Tower + low Haussmann blocks */}
          <rect x="116" y="74" width="12" height="10" />
          <rect x="172" y="73" width="12" height="11" />
          <rect x="149.6" y="6" width="0.8" height="9" />
          <path d="M132 84 L140.5 61 L145.5 41 L148.4 22 L149.3 14 H150.7 L151.6 22 L154.5 41 L159.5 61 L168 84 H162.5 Q150 67 137.5 84 Z" />
          <rect x="138.5" y="59.5" width="23" height="2.4" />
          <rect x="144" y="39.5" width="12" height="1.8" />

          {/* Atlanta — Bank of America Plaza spire + downtown towers */}
          <rect x="212" y="68" width="8" height="16" />
          <rect x="221" y="58" width="9" height="26" />
          <path d="M232 84 V50 H236 V46 H240 V50 H243 V84 Z" />
          <rect x="246" y="36" width="12" height="48" />
          <path d="M246 36 L252 25 L258 36 Z" />
          <rect x="251.6" y="13" width="0.8" height="12" />
          <rect x="261" y="45" width="9" height="39" rx="4.5" />
          <path d="M273 84 V54 L278 51 L283 54 V84 Z" />
          <rect x="286" y="64" width="9" height="20" />
          <rect x="0" y="84" width="300" height="8" />
        </g>
      </svg>
      <ul className="-mt-4 grid grid-cols-3 pb-4">
        {CITIES.map((city) => (
          <li key={city} className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/85">
            <MapPin className="h-3 w-3 text-[#9DB8FF]" />
            {city}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Actions({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      <button
        onClick={onClose}
        className={`inline-flex items-center justify-center rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors cursor-pointer border-[color:var(--paper-rule)] text-[color:var(--paper-ink)] hover:bg-black/[0.03]`}
      >
        Continue to site
      </button>
      <a
        href="/publications"
        onClick={onClose}
        className={`group inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all cursor-pointer bg-accent text-white hover:bg-accent-hover`}
      >
        Explore our research
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </a>
    </div>
  );
}

/* ─── Card: royal-blue cover panel + index list ─── */

function CoverCard({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid h-full sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="neurips-cover relative flex flex-col justify-between overflow-hidden px-7 py-8 sm:px-8 sm:py-10 text-white">
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full border border-white/10" />
        <div className="relative">
          <NeurIPSLogo height={26} />
          <div className="mt-8 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/60">Announcement</div>
        </div>
        <div className="relative my-8 sm:my-0">
          <div className={`${fraunces.className} text-[120px] sm:text-[160px] leading-[0.75] font-medium italic`}>7</div>
          <h2 id="neurips-title" className={`${fraunces.className} mt-4 text-[26px] sm:text-[30px] leading-[1.1] font-medium`}>
            Acceptances at <span className="italic">NeurIPS Workshop 2026</span>
          </h2>
        </div>
        <div className="relative -mx-7 -mb-8 sm:-mx-8 sm:-mb-10">
          <VenueSkyline />
        </div>
      </div>

      <div className="neurips-paper flex flex-col px-6 py-8 sm:px-9 sm:py-10">
        <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--paper-muted)]">
          Vizuara Research
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--paper-muted)]">{SUMMARY}</p>

        <ol className="mt-5 flex-1">
          {ACCEPTANCES.map((a, i) => (
            <motion.li
              key={a.workshop}
              className="neurips-row flex items-baseline gap-3 py-2.5"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
            >
              <span className={`${fraunces.className} w-5 shrink-0 text-sm italic text-accent`}>{i + 1}</span>
              <span className={`${fraunces.className} flex-1 text-[15px] leading-snug`}>{a.workshop}</span>
              <span className="hidden shrink-0 text-right text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[color:var(--paper-muted)] sm:inline">
                {a.domain}
              </span>
            </motion.li>
          ))}
        </ol>

        <p className={`${fraunces.className} mt-5 text-[15px] italic text-[color:var(--paper-muted)]`}>
          Congratulations to all our authors.
        </p>
        <div className="mt-5">
          <Actions onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

/* ─── Shell ─── */

export default function NeurIPSAnnouncement() {
  const [open, setOpen] = useState(false);

  // Show once per browser session, shortly after the hero has painted.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {}
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="neurips-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={close}
        >
          <style>{`
            .neurips-overlay {
              background: rgba(10, 14, 42, 0.42);
              backdrop-filter: blur(10px) saturate(120%);
              -webkit-backdrop-filter: blur(10px) saturate(120%);
            }
            .neurips-paper {
              --paper: #FFFCF5;
              --paper-ink: #0A0E2A;
              --paper-muted: #5C5F73;
              --paper-rule: #E4DCC6;
              --paper-gold: #A8862F;
              background:
                radial-gradient(120% 60% at 50% 0%, rgba(1,24,216,0.06), transparent 60%),
                radial-gradient(80% 50% at 100% 100%, rgba(233,223,195,0.55), transparent 70%),
                var(--paper);
              color: var(--paper-ink);
            }
            .dark .neurips-paper {
              --paper: #0D1025;
              --paper-ink: #EDEAE0;
              --paper-muted: #9AA2B5;
              --paper-rule: #262A4D;
              --paper-gold: #D9B866;
              background:
                radial-gradient(120% 60% at 50% 0%, rgba(27,86,253,0.14), transparent 60%),
                var(--paper);
            }
            .neurips-cover {
              background:
                radial-gradient(100% 70% at 0% 0%, rgba(91,138,255,0.45), transparent 60%),
                linear-gradient(165deg, #1B56FD 0%, #0118D8 45%, #0A0E2A 100%);
            }
            .neurips-scroll { scrollbar-width: none; }
            .neurips-scroll::-webkit-scrollbar { display: none; }
            .neurips-row { border-bottom: 1px dashed var(--paper-rule); }
          `}</style>

          <motion.div
            className="relative w-full max-w-3xl"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="neurips-title"
              className="neurips-scroll relative w-full max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-md shadow-[0_30px_80px_-20px_rgba(10,14,42,0.55)]"
            >
              <button
                onClick={close}
                aria-label="Close announcement"
                className="absolute top-3 right-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[#0A0E2A] shadow-sm backdrop-blur transition-colors hover:bg-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <CoverCard onClose={close} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
