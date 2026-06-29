'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const CAMPAIGN_KEY = '_vc';
const START_KEY = '_vs';
const PAGES_KEY = '_vp';

// Slug must be alphanumeric + hyphens, max 70 chars
const SLUG_RE = /^[a-z0-9-]{1,70}$/;

export default function CampaignTracker() {
  const pathname = usePathname();
  const beaconSent = useRef(false);
  const visitedPaths = useRef<Set<string>>(new Set());

  // On first mount: read ?_c from URL and start session
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const campaign = params.get('_c');
      if (campaign && SLUG_RE.test(campaign)) {
        sessionStorage.setItem(CAMPAIGN_KEY, campaign);
        sessionStorage.setItem(START_KEY, String(Date.now()));
        visitedPaths.current.add(window.location.pathname);
        sessionStorage.setItem(PAGES_KEY, JSON.stringify([...visitedPaths.current]));
      } else {
        // Restore existing session pages into ref
        const saved = sessionStorage.getItem(PAGES_KEY);
        if (saved) {
          JSON.parse(saved).forEach((p: string) => visitedPaths.current.add(p));
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track each page navigation
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(CAMPAIGN_KEY)) return;
      visitedPaths.current.add(pathname);
      sessionStorage.setItem(PAGES_KEY, JSON.stringify([...visitedPaths.current]));
    } catch {}
  }, [pathname]);

  // Send beacon when the user leaves (tab hidden / page unloaded)
  useEffect(() => {
    const send = () => {
      if (beaconSent.current) return;
      try {
        const campaign = sessionStorage.getItem(CAMPAIGN_KEY);
        if (!campaign) return;
        beaconSent.current = true;

        const start = parseInt(sessionStorage.getItem(START_KEY) || '0', 10);
        const duration = start ? Math.round((Date.now() - start) / 1000) : 0;
        const pages = JSON.parse(sessionStorage.getItem(PAGES_KEY) || '[]');

        navigator.sendBeacon(
          '/api/track-session',
          new Blob([JSON.stringify({ campaign, duration, pages })], {
            type: 'application/json',
          }),
        );
      } catch {}
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') send();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', send);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', send);
    };
  }, []);

  return null;
}
