"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, ExternalLink, X } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

interface Venue {
  title: string;
  fullName: string | null;
  year: number;
  link: string;
  deadline: string;
  abstractDeadline: string | null;
  timezone: string;
  place: string;
  date: string;
  rank: string | null;
  sub: string;
}

const SUB_LABELS: Record<string, string> = {
  ML: "Machine Learning",
  CV: "Computer Vision",
  NLP: "NLP",
  RO: "Robotics",
  SP: "Speech",
  DM: "Data Mining",
  AP: "Applications",
  KR: "Knowledge",
  HCI: "HCI",
};

const SUB_COLORS: Record<string, string> = {
  ML: "bg-[#0118D8]/10 text-[#0118D8] dark:bg-[#1B56FD]/20 dark:text-[#5B8AFF]",
  CV: "bg-[#7C3AED]/10 text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-[#A78BFA]",
  NLP: "bg-[#B45309]/10 text-[#B45309] dark:bg-[#B45309]/20 dark:text-[#F59E0B]",
  RO: "bg-[#DC2626]/10 text-[#DC2626] dark:bg-[#DC2626]/20 dark:text-[#F87171]",
  SP: "bg-[#0891B2]/10 text-[#0891B2] dark:bg-[#0891B2]/20 dark:text-[#22D3EE]",
  DM: "bg-[#059669]/10 text-[#059669] dark:bg-[#059669]/20 dark:text-[#34D399]",
  AP: "bg-[#4F46E5]/10 text-[#4F46E5] dark:bg-[#4F46E5]/20 dark:text-[#818CF8]",
  KR: "bg-[#D97706]/10 text-[#D97706] dark:bg-[#D97706]/20 dark:text-[#FBBF24]",
};

function getDeadlineStatus(deadline: string) {
  const now = Date.now();
  const dl = new Date(deadline).getTime();
  const diff = dl - now;
  if (diff < 0) return { label: "Passed", bgColor: "bg-surface-alt text-fg-muted" };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 7) return { label: `${days}d left`, bgColor: "bg-[#DC2626]/10 text-[#DC2626]" };
  if (days <= 30) return { label: `${days}d left`, bgColor: "bg-[#D97706]/10 text-[#D97706]" };
  return { label: `${days}d left`, bgColor: "bg-[#0118D8]/10 text-[#0118D8]" };
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

type Mode = "conferences" | "workshops";

export default function UpcomingVenuesSection() {
  const [mode, setMode] = useState<Mode>("conferences");
  const [conferences, setConferences] = useState<Venue[]>([]);
  const [workshops, setWorkshops] = useState<Venue[]>([]);
  const [loadingConf, setLoadingConf] = useState(true);
  const [loadingWs, setLoadingWs] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [detailVenue, setDetailVenue] = useState<Venue | null>(null);

  useEffect(() => {
    fetch("/api/upcoming-venues")
      .then((r) => r.json())
      .then((data) => {
        setConferences(Array.isArray(data) ? data : []);
        setLoadingConf(false);
      })
      .catch(() => setLoadingConf(false));

    const toVenue = (w: any): Venue => ({
      title: w.title,
      fullName: w.fullName || w.hostConference || null,
      year: w.deadline
        ? new Date(w.deadline).getFullYear()
        : new Date().getFullYear(),
      link: w.link,
      deadline: w.deadline,
      abstractDeadline: null,
      timezone: "UTC",
      place: w.place || "",
      date: w.date || "",
      rank: null,
      sub: w.sub || "ML",
    });

    const key = (v: Venue) =>
      `${v.title.toLowerCase()}|${(v.deadline || "").slice(0, 10)}`;

    // Manual workshops (Firestore) — fast, show immediately.
    fetch("/api/workshops")
      .then((r) => r.json())
      .then((j) => {
        const manualList = ((j.workshops || []) as any[]).map(toVenue);
        setWorkshops((prev) => {
          const seen = new Map<string, Venue>();
          for (const v of prev) seen.set(key(v), v);
          for (const v of manualList) seen.set(key(v), v); // manual wins
          return Array.from(seen.values()).sort(
            (a, b) =>
              new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
        });
        setLoadingWs(false);
      })
      .catch(() => setLoadingWs(false));

    // OpenReview (auto) — may take 30-60s on cold cache; backfills when ready.
    fetch("/api/public-workshops")
      .then((r) => r.json())
      .then((j) => {
        const autoList = ((j.workshops || []) as any[]).map(toVenue);
        setWorkshops((prev) => {
          const seen = new Map<string, Venue>();
          for (const v of autoList) seen.set(key(v), v);
          for (const v of prev) seen.set(key(v), v); // manual (already in prev) wins
          return Array.from(seen.values()).sort(
            (a, b) =>
              new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
        });
      })
      .catch(() => {});
  }, []);

  const venues = mode === "conferences" ? conferences : workshops;
  const loading = mode === "conferences" ? loadingConf : loadingWs;
  const allSubs = Array.from(new Set(venues.map((v) => v.sub))).sort();
  const filtered =
    filter === "ALL" ? venues : venues.filter((v) => v.sub === filter);

  function switchMode(m: Mode) {
    setMode(m);
    setFilter("ALL");
  }

  return (
    <section id="upcoming-venues" className="py-28 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
              <span className="w-8 h-px bg-teal/40" />
              Upcoming Venues
              <span className="w-8 h-px bg-teal/40" />
            </span>
            <h2 className="mt-4 text-4xl sm:text-5xl font-bold text-fg tracking-tight leading-tight">
              {mode === "conferences" ? "Conference Deadlines" : "Workshop Deadlines"}
            </h2>
            <p className="mt-4 text-lg text-fg-muted max-w-2xl mx-auto leading-relaxed">
              Upcoming AI & ML {mode === "conferences" ? "conferences" : "workshops"} to plan your next submission.
            </p>
          </div>
        </AnimatedSection>

        {/* Conference / Workshop toggle */}
        <AnimatedSection delay={0.03}>
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-full border border-border bg-surface-alt p-1">
              <button
                onClick={() => switchMode("conferences")}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  mode === "conferences"
                    ? "bg-accent text-white"
                    : "text-fg-muted hover:text-fg"
                }`}
              >
                Conferences{!loadingConf && ` (${conferences.length})`}
              </button>
              <button
                onClick={() => switchMode("workshops")}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  mode === "workshops"
                    ? "bg-accent text-white"
                    : "text-fg-muted hover:text-fg"
                }`}
              >
                Workshops{!loadingWs && ` (${workshops.length})`}
              </button>
            </div>
          </div>
        </AnimatedSection>

        {/* Filter chips */}
        {!loading && venues.length > 0 && (
          <AnimatedSection delay={0.05}>
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              <button
                onClick={() => setFilter("ALL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  filter === "ALL"
                    ? "bg-accent text-white"
                    : "bg-surface-alt text-fg-muted hover:bg-surface-alt/80"
                }`}
              >
                All ({venues.length})
              </button>
              {allSubs.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    filter === s
                      ? "bg-accent text-white"
                      : "bg-surface-alt text-fg-muted hover:bg-surface-alt/80"
                  }`}
                >
                  {SUB_LABELS[s] || s} (
                  {venues.filter((v) => v.sub === s).length})
                </button>
              ))}
            </div>
          </AnimatedSection>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 text-fg-muted text-sm py-20">
            <div className="h-5 w-5 border-2 border-border border-t-accent rounded-full animate-spin" />
            Loading upcoming venues...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-center text-fg-muted py-20">
            No upcoming venues found.
          </p>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v, i) => {
              const dlStatus = v.deadline
                ? getDeadlineStatus(v.deadline)
                : null;
              return (
                <AnimatedSection key={`${v.title}-${v.year}-${i}`} delay={0.05 + i * 0.03}>
                  <div
                    className="group flex flex-col h-full rounded-2xl border border-border bg-surface p-6 transition-all hover:shadow-lg hover:border-teal/30 hover:-translate-y-0.5"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-fg leading-snug">
                          {v.title}{" "}
                          <span className="text-fg-muted font-normal">
                            {v.year}
                          </span>
                        </h3>
                        {v.fullName && (
                          <p className="text-xs text-fg-muted mt-0.5 leading-snug">
                            {v.fullName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          SUB_COLORS[v.sub] || "bg-surface-alt text-fg-muted"
                        }`}
                      >
                        {SUB_LABELS[v.sub] || v.sub}
                      </span>
                      {v.rank && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-alt text-fg-muted">
                          CCF {v.rank}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-2.5 text-sm grow">
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0118D8]/10">
                          <Calendar className="w-3.5 h-3.5 text-[#0118D8]" />
                        </span>
                        <span className="text-fg">{v.date}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#7C3AED]/10">
                          <MapPin className="w-3.5 h-3.5 text-[#7C3AED]" />
                        </span>
                        <span className="text-fg">{v.place}</span>
                      </div>
                      {v.deadline && (
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#D97706]/10">
                            <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                          </span>
                          <span className="text-fg">
                            Deadline: {formatDate(v.deadline)}
                          </span>
                          {dlStatus && (
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${dlStatus.bgColor}`}
                            >
                              {dlStatus.label}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex items-center gap-2">
                      <button
                        onClick={() => setDetailVenue(v)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent text-white text-xs font-semibold px-3 py-2 hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        View details
                      </button>
                      <a
                        href={v.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-border text-fg-muted hover:text-fg hover:border-teal/50 text-xs font-semibold px-3 py-2 transition-colors"
                        title="Open website"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Website
                      </a>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        )}
      </div>

      {detailVenue && (
        <VenueDetailModal
          venue={detailVenue}
          onClose={() => setDetailVenue(null)}
        />
      )}
    </section>
  );
}

function VenueDetailModal({
  venue,
  onClose,
}: {
  venue: Venue;
  onClose: () => void;
}) {
  const dlStatus = venue.deadline ? getDeadlineStatus(venue.deadline) : null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-surface w-full max-w-lg rounded-2xl shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-fg-muted hover:text-fg p-1 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-7">
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                SUB_COLORS[venue.sub] || "bg-surface-alt text-fg-muted"
              }`}
            >
              {SUB_LABELS[venue.sub] || venue.sub}
            </span>
            {venue.rank && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-alt text-fg-muted">
                CCF {venue.rank}
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-fg leading-tight pr-8">
            {venue.title}{" "}
            <span className="text-fg-muted font-normal">{venue.year}</span>
          </h3>
          {venue.fullName && (
            <p className="text-sm text-fg-muted mt-2 leading-relaxed">
              {venue.fullName}
            </p>
          )}

          <div className="mt-6 space-y-3 text-sm">
            {venue.date && (
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#0118D8]/10">
                  <Calendar className="w-4 h-4 text-[#0118D8]" />
                </span>
                <div>
                  <div className="text-xs text-fg-muted">Event date</div>
                  <div className="text-fg font-medium">{venue.date}</div>
                </div>
              </div>
            )}
            {venue.place && (
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#7C3AED]/10">
                  <MapPin className="w-4 h-4 text-[#7C3AED]" />
                </span>
                <div>
                  <div className="text-xs text-fg-muted">Location</div>
                  <div className="text-fg font-medium">{venue.place}</div>
                </div>
              </div>
            )}
            {venue.deadline && (
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#D97706]/10">
                  <Clock className="w-4 h-4 text-[#D97706]" />
                </span>
                <div className="flex-1">
                  <div className="text-xs text-fg-muted">
                    Submission deadline
                  </div>
                  <div className="text-fg font-medium flex items-center gap-2 flex-wrap">
                    {formatDate(venue.deadline)}
                    {dlStatus && (
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${dlStatus.bgColor}`}
                      >
                        {dlStatus.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            {venue.abstractDeadline && (
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#059669]/10">
                  <Clock className="w-4 h-4 text-[#059669]" />
                </span>
                <div>
                  <div className="text-xs text-fg-muted">
                    Abstract deadline
                  </div>
                  <div className="text-fg font-medium">
                    {formatDate(venue.abstractDeadline)}
                  </div>
                </div>
              </div>
            )}
            {venue.timezone && venue.timezone !== "UTC" && (
              <div className="text-xs text-fg-muted pl-12">
                Timezone: {venue.timezone}
              </div>
            )}
          </div>

          <a
            href={venue.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent text-white text-sm font-semibold px-4 py-2.5 hover:opacity-90 transition-opacity w-full justify-center"
          >
            <ExternalLink className="w-4 h-4" />
            Visit official website
          </a>
        </div>
      </div>
    </div>
  );
}
