# Workshop Auto-Fetch System

A pipeline that pulls live workshop data from OpenReview's API, stores it in Firestore, and serves it on `/upcoming-venues`. No manual data entry needed for workshops that use OpenReview (the majority of NeurIPS/ICLR/ICML/CVPR/ACL etc. workshops).

---

## How it works (big picture)

```
  ┌─────────────────────┐   sync script   ┌─────────────────────┐
  │   OpenReview API    │ ──────────────→ │  Firestore          │
  │ (800+ active venues)│    (12 min)     │  autoWorkshops/     │
  └─────────────────────┘                 │  autoWorkshopsMeta/ │
                                          └──────────┬──────────┘
                                                     │
                                          reads      ▼
                                          ┌─────────────────────┐
                                          │ /api/public-workshops│
                                          │     (207ms)          │
                                          └──────────┬──────────┘
                                                     │
                                                     ▼
                                          ┌─────────────────────┐
                                          │  /upcoming-venues   │
                                          │   Workshops tab     │
                                          └─────────────────────┘
```

Two data sources merge on the public page:

1. **`autoWorkshops` collection** (fetched from OpenReview by the sync script)
2. **`workshops` collection** (manually added via `/admin` — legacy or for workshops OpenReview doesn't host)

Both are deduped on the client by `title+deadline`, manual wins.

---

## Key files

| File | Purpose |
|---|---|
| `scripts/seed-workshops.js` | Standalone sync script — reads OpenReview, writes Firestore. **This is what you run.** |
| `app/api/public-workshops/route.ts` | Public GET endpoint — reads `autoWorkshops` from Firestore. Also has a live-fetch fallback if Firestore is empty. |
| `app/api/public-workshops/sync/route.ts` | Next.js sync endpoint (for Vercel Cron). Works but timing-sensitive on cold Vercel deploys. |
| `app/lib/openreview.ts` | OpenReview REST client — login, disk token cache, throttle, 429 retry. |
| `app/lib/openreviewWorkshops.ts` | Shared workshop-fetching logic used by the Next.js route. |
| `app/components/UpcomingVenuesSection.tsx` | Frontend — fetches both sources in parallel, renders merged list. |
| `vercel.json` | Vercel Cron schedule (currently unused; kept for future activation). |

---

## How to refresh data

### Option A — **Manual (current setup, recommended)**

From the project directory:
```bash
node scripts/seed-workshops.js 200
```
- `200` = max venues to scan. Default is 200. Can go up to ~472 (all active workshop venues) but each venue costs ~2s → higher cap = longer runtime.
- Takes ~12 min
- Prints a `✓` per workshop found, then "Done. Wrote N workshops to Firestore."
- After it finishes, `/upcoming-venues` instantly reflects the new data.

See **reminder.md** for the exact command from any directory.

### Option B — Vercel Cron (active on production deploys)

`vercel.json` schedules `GET /api/public-workshops/sync` at **03:00 UTC daily**. Vercel auto-sends `Authorization: Bearer $CRON_SECRET` to the endpoint.

**For this to work on production, set these env vars in Vercel dashboard → Project Settings → Environment Variables:**

| Variable | Source |
|---|---|
| `CRON_SECRET` | Same value as in your local `.env.local` |
| `OPENREVIEW_EMAIL` | Your OpenReview login email |
| `OPENREVIEW_PASSWORD` | OpenReview password |
| `FIREBASE_PROJECT_ID` | `vizuara-research-page` |
| `FIREBASE_CLIENT_EMAIL` | From service account JSON |
| `FIREBASE_PRIVATE_KEY` | Full `-----BEGIN PRIVATE KEY-----...` string |

**Tier notes:**
- Hobby tier allows **daily cron only** (max 1 run/day). Our schedule `0 3 * * *` = once daily, so Hobby works.
- Pro tier allows more frequent. Cap stays at 120 venues to fit the 300s `maxDuration` regardless.

**Manually trigger** (after deploy) to confirm it works:
```bash
curl -X GET https://your-vercel-domain.vercel.app/api/public-workshops/sync \
  -H "Authorization: Bearer <CRON_SECRET>"
```
Should return `{ ok: true, saved: N, ... }` within ~2 min.

**If it fails:** check Vercel → Deployments → Functions → `api/public-workshops/sync` logs. Common issues: missing env var, OpenReview 429 from recent activity, cold token cache forcing a `/login` hit that's rate-limited.

**Cap**: GET uses `cap=120` to fit the Hobby 300s timeout. If you upgrade to Pro (`maxDuration` up to 900s), bump `runSync(120)` in `app/api/public-workshops/sync/route.ts` to 300-400 for wider coverage.

### Option C — GitHub Actions, Firebase Function, cron-job.org, Mac cron

All documented briefly in the conversation but not implemented. See the "alternatives" discussion if needed.

---

## Data model

**`autoWorkshops`** collection — one document per workshop:
```ts
{
  title: string
  fullName: string
  hostConference: string     // "NeurIPS 2026", etc.
  link: string               // canonical workshop URL
  deadline: string           // ISO — submission deadline
  date: string               // display date of the event
  place: string              // city, country
  sub: string                // ML / CV / NLP / SP / RO / DM / HCI / AP (auto-guessed)
  venueId: string            // OpenReview group ID, e.g. "ICLR.cc/2026/Workshop/AIMS"
  syncedAt: Timestamp
}
```

**`autoWorkshopsMeta/status`** — single status doc:
```ts
{
  saved: number             // how many written last run
  scanned: number           // how many venues examined
  totalCandidates: number   // total workshop-ish venues available
  syncedAt: Timestamp
}
```

**`workshops`** collection — manual/legacy entries. Same shape roughly, managed via `/admin`.

---

## Credentials required

In `.env.local`:
```
OPENREVIEW_EMAIL=<your OpenReview account email>
OPENREVIEW_PASSWORD=<password>
FIREBASE_PROJECT_ID=vizuara-research-page
FIREBASE_CLIENT_EMAIL=<firebase admin service account email>
FIREBASE_PRIVATE_KEY=<the full BEGIN/END PRIVATE KEY string>
```

The sync script reads `.env.local` directly (simple parser inside the script — no dotenv dependency). If you change creds, next run picks them up.

---

## Gotchas / things future-you should know

1. **OpenReview has a hard per-user rate limit** of ~3 req / 5s. The script throttles to 400ms between requests. If you get hit with 429s during debugging, **stop and wait ~5 min** before retrying — each attempt adds to the rate counter.

2. **OpenReview `/login` has a separate 100 req/period limit.** This matters if you restart Next.js a lot during dev. Mitigation: the script writes a token to `/tmp/vizuara-openreview-token.json` and reuses it for 23h. Don't delete this file unless you intentionally want to re-login.

3. **Every sync is a full wipe-and-replace.** Not a diff. So if OpenReview's API is down when you run the script, the script will fail *before* touching Firestore — old data stays intact. Safe.

4. **Past-deadline workshops stay visible until next sync.** I haven't added a browser-side filter (trivial to add if needed).

5. **Coverage is partial.** OpenReview covers ~50% of AI/ML workshops — mostly the ones from host conferences that use OpenReview for submissions. Workshops with their own CFP sites (many AAAI, CVPR side events, domain-specific workshops) won't appear. For those, the admin manual-add flow still exists at `/admin → Workshops`.

6. **Auto-category ("sub" field) is a heuristic.** Based on venue ID keywords + title terms. Sometimes wrong — e.g., linguistics workshops get labeled "ML". Can be fixed by editing the manual record, or by improving `guessSub()` in `scripts/seed-workshops.js` and `app/lib/openreviewWorkshops.ts`.

---

## Debugging

**Check current Firestore state:**
```bash
node -e '
const admin=require("firebase-admin");
require("dotenv").config?.({path:".env.local"});
const pk=process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,"\n");
admin.initializeApp({credential:admin.credential.cert({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:pk})});
admin.firestore().collection("autoWorkshops").get().then(s=>{console.log("count:",s.size);process.exit(0)});
'
```

**Check public endpoint is working:**
```bash
curl -s http://localhost:3000/api/public-workshops | head -c 400
```

**Watch a sync in progress:**
```bash
node scripts/seed-workshops.js 200 2>&1 | tee /tmp/seed.log
# In another terminal: tail -f /tmp/seed.log
```

---

## Timeline of decisions

- Originally: admin manually curated every workshop in Firestore (`workshops` collection).
- Then added Gemini + Google Search grounding for bulk discovery via admin UI.
- Then switched to OpenReview as the primary automated source (more accurate dates, real URLs).
- Attempted Vercel Cron for full automation — shelved due to OpenReview rate limits and timing-sensitive cold starts.
- Landed on manual standalone script — simple, reliable, you decide when.
