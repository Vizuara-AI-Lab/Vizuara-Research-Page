"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const ANNOUNCEMENTS = [
  { text: "10 papers accepted at NeurIPS 2026 Workshops", href: "/publications" },
  { text: "“No-Three-in-Line Problem” accepted in Frontiers in AI", href: "/publications" },
];

const ROTATE_MS = 4500;

// Slim highlight strip above the navbar. Rotates through ANNOUNCEMENTS;
// the parent decides when it is shown and handles dismissal.
export default function AnnouncementBanner({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % ANNOUNCEMENTS.length), ROTATE_MS);
    return () => clearInterval(t);
  }, []);

  const item = ANNOUNCEMENTS[index];

  return (
    <div className="announcement-banner relative h-9 overflow-hidden text-[13px] sm:text-sm text-ink">
      <style>{`
        .announcement-banner {
          background: linear-gradient(90deg, #EFE6CC 0%, #E4E2DA 35%, #C9D4FF 70%, #B7C4FF 100%);
        }
        .dark .announcement-banner {
          background: linear-gradient(90deg, #1A1D30 0%, #151835 40%, #13227A 75%, #1B56FD 100%);
        }
      `}</style>
      <div className="mx-auto flex h-full max-w-7xl items-center justify-center px-10">
        <AnimatePresence mode="wait">
          <motion.a
            key={index}
            href={item.href}
            className="group flex min-w-0 items-center gap-2.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <span className="h-1.5 w-1.5 shrink-0 bg-accent" aria-hidden />
            <span className="truncate font-medium">{item.text}</span>
            <span className="hidden shrink-0 font-semibold underline underline-offset-4 decoration-1 group-hover:decoration-2 sm:inline">
              See details →
            </span>
            <span className="hidden h-1.5 w-1.5 shrink-0 bg-accent sm:inline-block" aria-hidden />
          </motion.a>
        </AnimatePresence>
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
