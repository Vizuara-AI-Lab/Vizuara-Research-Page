"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  published?: boolean;
}

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQ[] | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/faqs")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const list: FAQ[] = (j.faqs || []).filter(
          (f: FAQ) => f.published !== false
        );
        setFaqs(list);
      })
      .catch(() => {
        if (!cancelled) setFaqs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  if (faqs !== null && faqs.length === 0) return null;

  return (
    <section id="faq" className="py-28 scroll-mt-16 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
              <span className="w-8 h-px bg-teal/40" />
              FAQ
              <span className="w-8 h-px bg-teal/40" />
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold text-fg tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed">
              Everything you need to know about our research bootcamps.
            </p>
          </div>
        </AnimatedSection>

        {faqs === null ? (
          <div className="flex items-center justify-center py-10 text-fg-muted text-sm">
            <div className="h-4 w-4 border-2 border-border border-t-teal rounded-full animate-spin mr-2" />
            Loading FAQs...
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <AnimatedSection key={faq.id} delay={idx * 0.03}>
                  <div
                    className={`rounded-2xl border transition-all duration-300 ${
                      isOpen
                        ? "border-teal/30 bg-bg shadow-md"
                        : "border-border bg-bg hover:border-steel/40"
                    }`}
                  >
                    <button
                      onClick={() => toggle(idx)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
                    >
                      <span className="text-base font-semibold text-fg leading-snug">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-teal shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        maxHeight: isOpen ? "500px" : "0px",
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <div className="px-6 pb-5">
                        <div className="h-px bg-border mb-4" />
                        <p className="text-sm text-fg-muted leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        )}

        <AnimatedSection delay={0.3}>
          <div className="mt-12 flex flex-col items-center text-center">
            <p className="text-sm text-fg-muted mb-5">Still have questions?</p>
            <a
              href="mailto:research@vizuara.com?subject=Question about Bootcamps"
              className="inline-flex items-center justify-center px-8 py-3 rounded-full text-white font-semibold text-base transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#0118D8" }}
            >
              Contact Us
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
