"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import PublicationCard from "./PublicationCard";
import AnimatedSection from "./AnimatedSection";
import { Search, X } from "lucide-react";
import type { Publication } from "../lib/scholar";

type Props = { publications: Publication[]; focusTopics?: string[] };

export default function PublicationsSection({ publications, focusTopics = [] }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const qParam = searchParams.get("q") || "";
  const tagsParam = searchParams.get("tags") || "";
  const tagsFromUrl = tagsParam ? tagsParam.split(",").map((t) => decodeURIComponent(t.trim())).filter(Boolean) : [];

  const [query, setQuery] = useState(qParam);
  const [selectedTags, setSelectedTags] = useState<string[]>(tagsFromUrl);

  useEffect(() => setQuery(qParam), [qParam]);
  useEffect(() => setSelectedTags(tagsFromUrl), [tagsParam]);

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    publications.forEach((p) => (p.tags ?? []).forEach((tag) => {
      const key = tag.trim();
      if (key) map.set(key, (map.get(key) || 0) + 1);
    }));
    return map;
  }, [publications]);

  const availableTags = useMemo(() => {
    if (focusTopics.length > 0) return focusTopics;
    return Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name]) => name);
  }, [tagCounts, focusTopics]);

  const updateUrl = (nextTags: string[], nextQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());
    nextTags.length > 0 ? params.set("tags", nextTags.map(encodeURIComponent).join(",")) : params.delete("tags");
    nextQuery.trim() ? params.set("q", nextQuery.trim()) : params.delete("q");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleTag = (name: string) => {
    const next = selectedTags.includes(name) ? selectedTags.filter((n) => n !== name) : [...selectedTags, name];
    setSelectedTags(next);
    updateUrl(next, query);
  };

  const clearTags = () => { setSelectedTags([]); updateUrl([], query); };
  const onSearchChange = (val: string) => { setQuery(val); updateUrl(selectedTags, val); };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return publications.filter((p) => {
      if (typeof p.year === "number" && p.year < 2020) return false;
      const hay = `${p.title} ${p.venue ?? ""} ${(p.tags ?? []).join(" ")}`.toLowerCase();
      return (q ? hay.includes(q) : true) && (selectedTags.length === 0 || selectedTags.every((tag) => (p.tags ?? []).some((t) => t.toLowerCase() === tag.toLowerCase())));
    });
  }, [publications, query, selectedTags]);

  const withYear = filtered.filter((p): p is Publication & { year: number } => typeof p.year === "number" && p.year >= 2020);
  const noYear = filtered.filter((p) => typeof p.year !== "number");
  const totalShown = withYear.length + noYear.length;
  const years = Array.from(new Set(withYear.map((p) => p.year))).sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();

  return (
    <section id="publications" className="scroll-mt-20">
      {/* Header */}
      <AnimatedSection>
        <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
          <span className="w-8 h-px bg-teal/40" />
          Papers
        </span>
        <h2 className="mt-4 text-4xl sm:text-5xl font-bold text-fg tracking-tight mb-3">
          Our Publications
        </h2>
        <p className="text-lg text-fg-muted mb-8 max-w-2xl">
          {totalShown} papers across AI, ML, Scientific Computing, and more.
        </p>
      </AnimatedSection>

      {/* Search + Tags */}
      <div className="mb-10 space-y-4">
        {/* Search bar */}
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fg-muted/50" />
          <input
            id="pub-search"
            type="text"
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, venue, or tags..."
            className="w-full rounded-xl border border-border bg-surface pl-12 pr-4 py-3.5 text-base text-fg placeholder:text-fg-muted/40 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
          />
        </div>

        {/* Tag filters */}
        <div className="flex flex-wrap gap-2">
          {availableTags.map((name) => {
            const active = selectedTags.includes(name);
            const count = tagCounts.get(name);
            return (
              <button
                key={name}
                onClick={() => toggleTag(name)}
                aria-pressed={active}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-ink text-white dark:bg-white dark:text-ink shadow-md"
                    : "bg-surface-alt text-fg-muted hover:text-fg hover:bg-surface border border-transparent hover:border-border"
                }`}
              >
                {name}
                {count ? <span className="ml-1.5 text-xs opacity-60">{count}</span> : ""}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <button
              onClick={clearTags}
              className="rounded-lg px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg bg-surface-alt cursor-pointer inline-flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-16 text-center">
          <p className="text-lg text-fg-muted">No publications match your filters.</p>
        </div>
      )}

      {/* Year groups */}
      {years.map((year) => {
        const yearPubs = withYear.filter((p) => p.year === year);
        return (
          <div key={year} className="mb-14">
            <div className="flex items-baseline justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-fg">{year}</h3>
                {year === currentYear && (
                  <span className="px-2 py-0.5 rounded-md bg-teal/10 text-teal text-xs font-semibold">Latest</span>
                )}
              </div>
              <span className="text-sm text-fg-muted font-medium">
                {yearPubs.length} {yearPubs.length === 1 ? "paper" : "papers"}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {yearPubs.map((pub, i) => (
                <PublicationCard
                  key={`${year}-${i}`}
                  title={pub.title}
                  authors={pub.authors}
                  venue={pub.venue}
                  paperLink={pub.paperLink}
                  imageUrl={pub.imageUrl}
                  isHighlighted={year === currentYear}
                  tags={pub.tags}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Undated */}
      {noYear.length > 0 && (
        <div className="mb-14">
          <div className="flex items-baseline justify-between mb-6">
            <h3 className="text-2xl font-bold text-fg">Other</h3>
            <span className="text-sm text-fg-muted font-medium">{noYear.length} papers</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {noYear.map((pub, i) => (
              <PublicationCard
                key={`undated-${i}`}
                title={pub.title}
                authors={pub.authors}
                venue={pub.venue}
                paperLink={pub.paperLink}
                imageUrl={pub.imageUrl}
                tags={pub.tags}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
