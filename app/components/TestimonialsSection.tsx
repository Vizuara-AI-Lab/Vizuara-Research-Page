"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

interface Quote {
  id: string;
  text: string;
  name: string;
  role?: string;
  published?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const AVATAR_GRADIENTS = [
  "from-teal/80 to-accent/80",
  "from-accent/80 to-teal/70",
  "from-fg/70 to-teal/70",
  "from-teal/70 to-fg/80",
];

function gradientFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function splitIntoColumns<T>(arr: T[], cols: number): T[][] {
  const out: T[][] = Array.from({ length: cols }, () => []);
  arr.forEach((t, i) => out[i % cols].push(t));
  return out;
}

const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Quote[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.ul
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-transparent list-none m-0 p-0"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map((q, i) => (
                <motion.li
                  key={`${index}-${q.id}-${i}`}
                  aria-hidden={index === 1 ? "true" : "false"}
                  tabIndex={index === 1 ? -1 : 0}
                  whileHover={{
                    scale: 1.02,
                    y: -6,
                    transition: { type: "spring", stiffness: 400, damping: 17 },
                  }}
                  className="p-8 rounded-3xl border border-border shadow-md shadow-black/5 max-w-sm w-full bg-surface transition-all duration-300 cursor-default select-none group"
                >
                  <blockquote className="m-0 p-0">
                    <p className="text-fg leading-relaxed font-normal m-0 text-[15px]">
                      &ldquo;{q.text}&rdquo;
                    </p>
                    <footer className="flex items-center gap-3 mt-6">
                      <span
                        aria-hidden="true"
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold tracking-wide text-white bg-gradient-to-br ${gradientFor(
                          q.name
                        )} ring-2 ring-border group-hover:ring-teal/40 transition-all duration-300`}
                      >
                        {getInitials(q.name)}
                      </span>
                      <div className="flex flex-col">
                        <cite className="font-semibold not-italic tracking-tight leading-5 text-fg">
                          {q.name}
                        </cite>
                        {q.role && (
                          <span className="text-xs leading-5 tracking-tight text-teal font-medium mt-0.5">
                            {q.role}
                          </span>
                        )}
                      </div>
                    </footer>
                  </blockquote>
                </motion.li>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.ul>
    </div>
  );
};

export default function TestimonialsSection() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/quotes")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const list: Quote[] = (j.quotes || []).filter(
          (q: Quote) => q.published !== false
        );
        setQuotes(list);
      })
      .catch(() => {
        if (!cancelled) setQuotes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [firstColumn, secondColumn, thirdColumn] = useMemo(
    () => splitIntoColumns(quotes || [], 3),
    [quotes]
  );

  if (quotes !== null && quotes.length === 0) return null;

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="bg-bg py-24 relative overflow-hidden border-t border-border"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{
          duration: 1.0,
          ease: [0.16, 1, 0.3, 1],
          opacity: { duration: 0.8 },
        }}
        className="max-w-7xl px-6 mx-auto z-10"
      >
        <div className="flex flex-col items-center justify-center max-w-[600px] mx-auto mb-16">
          <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
            <span className="w-8 h-px bg-teal/40" />
            Testimonials
            <span className="w-8 h-px bg-teal/40" />
          </span>

          <h2
            id="testimonials-heading"
            className="text-4xl md:text-5xl font-bold tracking-tight mt-4 text-center text-fg"
          >
            In their own words
          </h2>
          <p className="text-center mt-5 text-fg-muted text-lg leading-relaxed max-w-lg">
            Reflections from researchers who have been through a Vizuara
            bootcamp.
          </p>
        </div>

        {quotes === null ? (
          <div className="flex items-center justify-center py-10 text-fg-muted text-sm">
            <div className="h-4 w-4 border-2 border-border border-t-teal rounded-full animate-spin mr-2" />
            Loading testimonials...
          </div>
        ) : (
          <div
            className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[740px] overflow-hidden"
            role="region"
            aria-label="Scrolling Testimonials"
          >
            <TestimonialsColumn testimonials={firstColumn} duration={28} />
            <TestimonialsColumn
              testimonials={secondColumn}
              className="hidden md:block"
              duration={34}
            />
            <TestimonialsColumn
              testimonials={thirdColumn}
              className="hidden lg:block"
              duration={30}
            />
          </div>
        )}
      </motion.div>
    </section>
  );
}
