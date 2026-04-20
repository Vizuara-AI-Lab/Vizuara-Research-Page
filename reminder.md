# Daily Workshop Sync — Run This Command

Refreshes the Workshops tab on `/upcoming-venues` with the latest data from OpenReview.
Takes ~12 minutes. Run it whenever you want fresh data (weekly is plenty).

---

## From the project directory

```bash
node scripts/seed-workshops.js 200
```

First `cd` into the project if you're not already there:

```bash
cd /Users/zodiac/Desktop/Vizuara/Vizuara-Research-Page && node scripts/seed-workshops.js 200
```

---

## From any directory (absolute path — copy-paste anywhere)

```bash
cd /Users/zodiac/Desktop/Vizuara/Vizuara-Research-Page && node scripts/seed-workshops.js 200
```

---

## One-liner with log file (if you want to review output after)

```bash
cd /Users/zodiac/Desktop/Vizuara/Vizuara-Research-Page && node scripts/seed-workshops.js 200 2>&1 | tee /tmp/workshop-sync.log
```

---

## What to expect

- Script prints progress per venue: `[N/200] ✓ Workshop title | YYYY-MM-DD`
- Takes ~12 min total
- Ends with `✓ Done. Wrote N workshops to Firestore.`
- After that, reload `/upcoming-venues` → fresh data.

See `workshop-fetch.md` for full details on how it all works.
