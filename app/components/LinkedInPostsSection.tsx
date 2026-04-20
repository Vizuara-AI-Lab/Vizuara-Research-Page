"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FaLinkedin } from "react-icons/fa6";
import AnimatedSection from "./AnimatedSection";

const EMBED_HEIGHT = 620;

interface RawTestimonial {
  id: string;
  postUrl: string;
  author: string;
  context?: string;
  published?: boolean;
}

interface LinkedInPost {
  id: string;
  embedUrl: string;
  postUrl: string;
  author: string;
  context: string;
}

function deriveEmbedUrl(postUrl: string): string | null {
  const m = postUrl.match(/-(ugcPost|activity|share)-(\d+)/);
  if (!m) return null;
  return `https://www.linkedin.com/embed/feed/update/urn:li:${m[1]}:${m[2]}?collapsed=1`;
}

function LazyEmbed({ post }: { post: LinkedInPost }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className="group relative rounded-2xl overflow-hidden border border-border bg-surface transition-all duration-300 hover:shadow-xl hover:border-teal/30 hover:-translate-y-1"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-alt/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <FaLinkedin className="w-5 h-5 text-[#0A66C2] shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-fg truncate">
              {post.author}
            </div>
            {post.context && (
              <div className="text-[11px] text-fg-muted truncate">
                {post.context}
              </div>
            )}
          </div>
        </div>
        <a
          href={post.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold text-teal hover:underline shrink-0"
        >
          Open
        </a>
      </div>

      <div
        className="relative w-full bg-surface-alt/40"
        style={{ height: EMBED_HEIGHT }}
      >
        {visible ? (
          <iframe
            src={post.embedUrl}
            title={`LinkedIn post by ${post.author}`}
            loading="lazy"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-fg-muted text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-border border-t-teal rounded-full animate-spin" />
              Loading post...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LinkedInPostsSection() {
  const [raw, setRaw] = useState<RawTestimonial[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setRaw(j.testimonials || []);
      })
      .catch(() => {
        if (!cancelled) setRaw([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const posts = useMemo<LinkedInPost[]>(() => {
    if (!raw) return [];
    return raw
      .filter((t) => t.published !== false)
      .map((t) => {
        const embedUrl = deriveEmbedUrl(t.postUrl);
        if (!embedUrl) return null;
        return {
          id: t.id,
          embedUrl,
          postUrl: t.postUrl,
          author: t.author,
          context: t.context || "",
        };
      })
      .filter((p): p is LinkedInPost => p !== null);
  }, [raw]);

  if (raw !== null && posts.length === 0) return null;

  return (
    <section
      id="community"
      className="bg-surface/50 py-24 scroll-mt-16 border-t border-border"
    >
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
              <span className="w-8 h-px bg-teal/40" />
              From the Community
              <span className="w-8 h-px bg-teal/40" />
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold text-fg tracking-tight">
              Stories from our researchers
            </h2>
            <p className="mt-4 text-lg text-fg-muted max-w-2xl mx-auto leading-relaxed">
              Milestones, acceptances, and moments shared by Vizuara students
              and alumni on LinkedIn.
            </p>
          </div>
        </AnimatedSection>

        {raw === null ? (
          <div className="flex items-center justify-center py-10 text-fg-muted text-sm">
            <div className="h-4 w-4 border-2 border-border border-t-teal rounded-full animate-spin mr-2" />
            Loading testimonials...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {posts.map((p, i) => (
              <AnimatedSection key={p.id} delay={i * 0.08}>
                <LazyEmbed post={p} />
              </AnimatedSection>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
