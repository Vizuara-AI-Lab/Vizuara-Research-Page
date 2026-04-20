"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, FileText } from "lucide-react";

interface PublicationCardProps {
  title: string;
  authors?: string;
  venue?: string;
  paperLink?: string;
  imageUrl?: string;
  isHighlighted?: boolean;
  tags?: string[];
}

const proxify = (u?: string) => {
  if (!u) return undefined;
  return /^https?:\/\//i.test(u) ? `/api/img?url=${encodeURIComponent(u)}` : u;
};

export default function PublicationCard({ title, authors, venue, paperLink, imageUrl, isHighlighted = false, tags = [] }: PublicationCardProps) {
  const [thumb, setThumb] = useState<string | undefined>(() => proxify(imageUrl));
  const [asked, setAsked] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!paperLink || thumb) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !asked) {
        setAsked(true);
        fetch(`/api/og?${new URLSearchParams({ url: paperLink, title })}`)
          .then((r) => r.json())
          .then((j) => { const next = j?.proxyUrl || proxify(j?.imageUrl); if (next) setThumb(next); })
          .catch(() => {})
          .finally(() => io.disconnect());
      }
    }, { rootMargin: "200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [paperLink, title, thumb, asked]);

  return (
    <div
      ref={ref}
      className={`group rounded-2xl border bg-surface overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        isHighlighted ? "border-teal/30" : "border-border hover:border-steel/40"
      }`}
    >
      {/* Thumbnail with venue gradient overlay */}
      <div className="relative w-full h-48 bg-surface-alt overflow-hidden flex items-center justify-center">
        {thumb ? (
          <img
            src={thumb}
            alt={`${title} thumbnail`}
            className="max-w-full max-h-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.08] p-2"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <FileText className="w-10 h-10 text-steel/30" />
        )}
        {isHighlighted && (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-teal/90 text-white text-[10px] font-bold uppercase tracking-wider">
            New
          </div>
        )}
        {venue && (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
              style={{
                background:
                  "linear-gradient(to top, rgba(1,24,216,0.65) 0%, rgba(27,86,253,0.3) 55%, rgba(27,86,253,0) 100%)",
              }}
            />
            <div className="absolute bottom-2 inset-x-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] line-clamp-2">
                {venue}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h4 className="text-base font-bold text-fg leading-snug mb-2 line-clamp-2 group-hover:text-teal transition-colors">
          {paperLink ? (
            <a href={paperLink} target="_blank" rel="noopener noreferrer">{title}</a>
          ) : title}
        </h4>

        {/* Co-authors */}
        {authors && (
          <p className="text-sm text-fg-muted mb-3 line-clamp-2">{authors}</p>
        )}

        {/* Keywords / tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 5).map((t, i) => (
              <Link
                key={`${t}-${i}`}
                href={`/publications?tags=${encodeURIComponent(t)}`}
                prefetch={false}
                className="rounded-md bg-surface-alt px-2 py-0.5 text-[11px] font-medium text-fg-muted hover:text-teal hover:bg-teal/5 transition-colors"
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {/* Read link */}
        {paperLink && (
          <div className="pt-3 border-t border-border">
            <a
              href={paperLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg hover:text-teal transition-colors"
            >
              Read Paper
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
