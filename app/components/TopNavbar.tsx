"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";

const nav = [
  { label: "Team", href: "/team" },
  { label: "Programs", href: "#programs" },
  { label: "Publications", href: "/publications" },
  { label: "Upcoming Venues", href: "/upcoming-venues" },
  { label: "FAQ", href: "/faq" },
];

export default function TopNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "h-14 bg-bg/60 backdrop-blur-xl border-b border-border/60 shadow-sm"
          : "h-16 bg-transparent"
      }`}
    >
      <div className="h-full mx-auto w-full max-w-7xl px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Vizuara" className="h-8" />
          <span className="text-lg font-bold text-fg tracking-tight hidden sm:inline">
            Vizuara
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 text-[17px] text-fg-muted hover:text-fg transition-colors rounded-md hover:bg-surface-alt/50 cursor-pointer"
            >
              {item.label}
            </a>
          ))}
          <div className="ml-3 pl-3 border-l border-border">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-surface-alt transition-colors cursor-pointer"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden bg-bg/95 backdrop-blur-xl border-b border-border"
          >
            <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-1">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-base text-fg-muted hover:text-fg rounded-md hover:bg-surface-alt/50 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
