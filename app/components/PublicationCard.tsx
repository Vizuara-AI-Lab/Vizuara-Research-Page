"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface PublicationCardProps {
  title: string;
  authors?: string;
  venue?: string;
  paperLink?: string;
  imageUrl?: string; // optional initial image (if server added it)
  isHighlighted?: boolean;
  tags?: string[]; // topic tags (AI, ML, Neural Networks, etc.)
}

const proxify = (u?: string) => {
  if (!u) return undefined;
  return /^https?:\/\//i.test(u) ? `/api/img?url=${encodeURIComponent(u)}` : u; // local /papers/* stays as-is
};

export default function PublicationCard({
  title,
  authors,
  venue,
  paperLink,
  imageUrl,
  isHighlighted = false,
  tags = [],
}: PublicationCardProps) {
  // If imageUrl is provided, run it through the proxy to avoid mixed-content
  const [thumb, setThumb] = useState<string | undefined>(() =>
    proxify(imageUrl)
  );
  const [asked, setAsked] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Lazy-fetch thumbnail when card enters viewport (resolves non‑Scholar URL + returns proxyUrl)
  useEffect(() => {
    if (!paperLink || thumb) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting && !asked) {
          setAsked(true);
          const qs = new URLSearchParams({
            url: paperLink,
            title, // helps resolve a proper landing page (arXiv/publisher) if paperLink is a Scholar URL
          }).toString();

          fetch(`/api/og?${qs}`)
            .then((r) => r.json())
            .then((j) => {
              // Prefer proxyUrl; otherwise proxy the raw imageUrl
              const next: string | undefined =
                j?.proxyUrl || proxify(j?.imageUrl);
              if (next) setThumb(next);
            })
            .catch(() => {
              // ignore errors; keep fallback
            })
            .finally(() => io.disconnect());
        }
      },
      { rootMargin: "200px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [paperLink, title, thumb, asked]);

  const wrapperClass = isHighlighted
    ? "border-l border-vblue bg-gradient-to-br from-blue-50/30 to-transparent hover:from-blue-50/50"
    : "border-l border-gray-300 hover:border-vblue";

  const Thumb = (
    <div className="w-26 h-24 shrink-0 overflow-hidden bg-gray-100">
      {thumb ? (
        <img
          src={thumb}
          alt={`${title} thumbnail`}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full grid place-items-center text-gray-400 text-lg">
          🧪
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`${wrapperClass} transition-colors overflow-hidden`}
      ref={ref}
    >
      <div className="p-6 flex gap-4 min-h-[120px]">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h4 className="text-lg font-normal text-gray-900 mb-1">{title}</h4>

            {/* Authors */}
            {authors && (
              <p className="text-gray-600 mb-2 font-light text-sm">
                Authors: {authors}
              </p>
            )}

            {/* Topic tags (click to filter) */}
            {tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {tags.map((t, i) => (
                  <Link
                    key={`${t}-${i}`}
                    href={`/publications?tags=${encodeURIComponent(t)}`}
                    prefetch={false}
                    className="rounded-full border border-gray-300 px-2.5 py-0.5 text-xs text-gray-700 hover:border-vblue hover:text-vblue transition"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {venue && <p className="text-vblue font-light text-sm">{venue}</p>}
            {paperLink && (
              <a
                href={paperLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-vblue hover:opacity-90 underline font-light inline-flex items-center gap-1"
              >
                Read Paper →
              </a>
            )}
          </div>
        </div>

        {/* Thumbnail (clickable if paperLink exists) */}
        {paperLink ? (
          <a
            href={paperLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open paper: ${title}`}
            className="block"
          >
            {Thumb}
          </a>
        ) : (
          Thumb
        )}
      </div>
    </div>
  );
}
