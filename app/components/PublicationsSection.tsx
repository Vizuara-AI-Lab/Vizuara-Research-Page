"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import PublicationCard from "./PublicationCard";
import type { Publication } from "../lib/scholar";

type Props = {
  publications: Publication[];
  // Optional: preferred topic chips to show first (e.g., ['AI','ML','LLM'])
  focusTopics?: string[];
};

export default function PublicationsSection({
  publications,
  focusTopics = [],
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial filters from URL
  const qParam = searchParams.get("q") || "";
  const tagsParam = searchParams.get("tags") || "";
  const tagsFromUrl = tagsParam
    ? tagsParam
        .split(",")
        .map((t) => decodeURIComponent(t.trim()))
        .filter(Boolean)
    : [];

  const [query, setQuery] = useState(qParam);
  const [selectedTags, setSelectedTags] = useState<string[]>(tagsFromUrl);

  // Sync state when URL changes
  useEffect(() => setQuery(qParam), [qParam]);
  useEffect(() => setSelectedTags(tagsFromUrl), [tagsParam]);

  // Build tag counts from publications
  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    publications.forEach((p) => {
      (p.tags ?? []).forEach((tag) => {
        const key = tag.trim();
        if (!key) return;
        map.set(key, (map.get(key) || 0) + 1);
      });
    });
    return map;
  }, [publications]);

  // Choose which tags to show as chips
  const availableTags = useMemo(() => {
    if (focusTopics.length > 0) return focusTopics;
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name]) => name);
  }, [tagCounts, focusTopics]);

  // Helpers to update URL (q + tags) without scroll jump
  const updateUrl = (nextTags: string[], nextQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextTags.length > 0) {
      params.set("tags", nextTags.map(encodeURIComponent).join(","));
    } else {
      params.delete("tags");
    }
    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleTag = (name: string) => {
    const next = selectedTags.includes(name)
      ? selectedTags.filter((n) => n !== name)
      : [...selectedTags, name];
    setSelectedTags(next);
    updateUrl(next, query);
  };

  const clearTags = () => {
    setSelectedTags([]);
    updateUrl([], query);
  };

  const onSearchChange = (val: string) => {
    setQuery(val);
    updateUrl(selectedTags, val);
  };

  

  // Filter publications: search in title, venue, tags; require all selected tags
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return publications.filter((p) => {
      const hay = `${p.title} ${p.venue ?? ""} ${(p.tags ?? []).join(
        " "
      )}`.toLowerCase();

      const matchesQuery = q ? hay.includes(q) : true;

      const matchesTags =
        selectedTags.length === 0
          ? true
          : selectedTags.every((tag) =>
              (p.tags ?? []).some((t) => t.toLowerCase() === tag.toLowerCase())
            );

      return matchesQuery && matchesTags;
    });
  }, [publications, query, selectedTags]);

  // Group by year
  const withYear = filtered.filter(
    (p): p is Publication & { year: number } => typeof p.year === "number"
  );
  const noYear = filtered.filter((p) => typeof p.year !== "number");
  const years = Array.from(new Set(withYear.map((p) => p.year))).sort(
    (a, b) => b - a
  );
  const currentYear = new Date().getFullYear();

  return (
    <section id="publications" className="mb-20 scroll-mt-20">
      <h2 className="text-3xl font-normal text-gray-900 mb-2 tracking-tight border-b border-gray-300 pb-2">
        Our Publications
      </h2>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="w-full md:max-w-md">
          <label htmlFor="pub-search" className="sr-only">
            Search publications
          </label>
          <input
            id="pub-search"
            type="text"
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search title, venue, or tags…"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vblue"
          />
        </div>

        {/* Topic chips */}
        <div className="flex flex-wrap gap-2">
          {availableTags.map((name) => {
            const active = selectedTags.includes(name);
            const count = tagCounts.get(name);
            return (
              <button
                key={name}
                onClick={() => toggleTag(name)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  active
                    ? "bg-vblue text-white border-vblue"
                    : "border-gray-300 text-gray-700 hover:border-vblue hover:text-vblue"
                }`}
                title={`${name}${count ? ` • ${count}` : ""}`}
              >
                {name}
                {count ? ` (${count})` : ""}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <button
              onClick={clearTags}
              className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:border-vblue"
              title="Clear topic filters"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-gray-700">
          No publications match your filters.
        </div>
      )}

      {/* Year groups */}
      {years.map((year) => {
        const yearPubs = withYear.filter((p) => p.year === year);
        return (
          <div key={year} className="mb-10">
            <div className="flex items-baseline justify-between border-b border-gray-200 pb-2 mb-6">
              <h3 className="text-xl font-normal text-gray-900">{year}</h3>
              <span className="text-sm text-gray-600 font-light">
                {yearPubs.length} {yearPubs.length === 1 ? "paper" : "papers"}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {yearPubs.map((pub, i) => (
                <PublicationCard
                  key={`${year}-${i}-${pub.title}`}
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
        <div className="mb-10">
          <div className="flex items-baseline justify-between border-b border-gray-200 pb-2 mb-6">
            <h3 className="text-xl font-normal text-gray-900">Undated</h3>
            <span className="text-sm text-gray-600 font-light">
              {noYear.length} {noYear.length === 1 ? "paper" : "papers"}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {noYear.map((pub, i) => (
              <PublicationCard
                key={`undated-${i}-${pub.title}`}
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
