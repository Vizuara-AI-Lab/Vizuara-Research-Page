# Marketing Campaign Post Tracking Feature

This document explains the admin dashboard feature that creates marketing campaign posts, gives each post a unique tracking URL, redirects visitors to the intended page, and stores click/session analytics. It is written as a handoff document so the same feature can be rebuilt in another project with a separate database.

## Feature Summary

Admins can create a marketing post from the admin dashboard with:

- an internal title
- a platform label, such as LinkedIn, X, YouTube, or Email
- a full post caption/script
- one or more post images
- a destination URL where visitors should land after clicking
- a custom or auto-generated tracking slug
- an active/inactive flag

After saving, the system creates a unique URL in this format:

```text
https://research.vizuara.ai/r/{slug}
```

Example:

```text
https://research.vizuara.ai/r/research-bootcamp-launch
```

The admin copies this URL into a social post. When a user clicks it, the app:

1. Finds the matching campaign by `slug`.
2. Increments the campaign click count.
3. Stores click metadata such as referrer, user agent, country, and city.
4. Redirects the visitor to the configured destination URL.
5. If the destination is on the same site, appends `?_c={slug}` so the frontend can track the session.
6. Tracks the visitor session duration, pages visited, bounce status, and aggregate engagement stats.

## Responsible Code Files

### Admin UI

- `app/admin/page.tsx`
  - Contains the `PostCampaignsEditor` component.
  - Adds the `Post Campaigns` tab to the admin dashboard.
  - Lets admins create, edit, delete, refresh, search, preview, and copy campaign URLs.
  - Uploads post images to Firebase Storage.
  - Displays campaign analytics: clicks, sessions, average time, bounce rate, average pages per visit, click-to-session rate, total time on site, destination, and pages visited.

- `app/admin/layout.tsx`
  - Protects the admin area at the layout level.
  - Redirects or blocks users who are signed in but not admin users.

- `app/admin/useAuth.ts`
  - Handles Google sign-in.
  - Gets Firebase ID tokens used by the admin API requests.
  - Calls `/api/admin/me` to confirm admin access.

### Admin Auth And Firebase

- `app/api/admin/me/route.ts`
  - Verifies the current Firebase auth token.
  - Returns whether the user is an admin.

- `app/lib/adminGuard.ts`
  - Shared server-side admin guard.
  - Reads the `Authorization: Bearer {token}` header.
  - Verifies the Firebase ID token.
  - Checks Firestore collection `Users` for a document where `email` matches and `role` is `ADMIN`.

- `app/lib/firebaseAdmin.ts`
  - Initializes Firebase Admin SDK.
  - Exports `adminAuth` and `db`.
  - Uses `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.

- `app/lib/firebaseClient.ts`
  - Provides client-side Firebase services, including Storage.
  - Used by the admin page to upload and delete campaign images.

### Campaign API Routes

- `app/api/post-campaigns/route.ts`
  - `GET`: Lists all campaign post documents for admins.
  - `POST`: Creates a campaign post.
  - Generates a unique slug.
  - Validates caption and image.
  - Cleans destination URLs.
  - Rewrites `research.vizuara.ai` links inside the caption to the final `/r/{slug}` tracking URL.
  - Stores the campaign in Firestore collection `postCampaigns`.

- `app/api/post-campaigns/[id]/route.ts`
  - `GET`: Fetches one campaign by document ID.
  - `PATCH`: Updates campaign details.
  - `DELETE`: Deletes a campaign document.
  - Checks that a changed slug is unique across all campaigns.

- `app/api/post-campaigns/[id]/sessions/route.ts`
  - `GET`: Fetches the latest 200 session records for a campaign.
  - Used by the admin dashboard to compute the page breakdown shown under "Pages visited by your audience".

### Public Tracking Routes

- `app/r/[slug]/route.ts`
  - Public redirect endpoint.
  - Looks up `postCampaigns` by `slug`.
  - Increments `clickCount`.
  - Stores a click document in `postCampaigns/{campaignId}/clicks`.
  - Redirects the visitor to `destinationUrl`.
  - Adds `?_c={slug}` only when redirecting to the same site, keeping external URLs clean.

- `app/api/track-session/route.ts`
  - Receives frontend session beacons.
  - Validates origin and slug format.
  - Verifies the campaign exists.
  - Stores a session document in `postCampaigns/{campaignId}/sessions`.
  - Updates aggregate session fields on the parent campaign document.

### Frontend Session Tracker

- `app/components/CampaignTracker.tsx`
  - Client component mounted globally.
  - Reads `?_c={slug}` from the URL.
  - Stores campaign/session state in `sessionStorage`.
  - Tracks visited paths during navigation.
  - Sends a beacon to `/api/track-session` when the tab is hidden or the page is unloaded.

- `app/layout.tsx`
  - Mounts `<CampaignTracker />` for the whole site.
  - This is required for same-site campaign session tracking to work across pages.

## Firestore Database Structure

The current implementation uses Firestore with this structure:

```text
postCampaigns/{campaignId}
postCampaigns/{campaignId}/clicks/{clickId}
postCampaigns/{campaignId}/sessions/{sessionId}
Users/{userId}
```

Only `postCampaigns` and its subcollections are part of the marketing campaign feature. `Users` is used for admin authorization.

## Collection: `postCampaigns`

Each document represents one marketing campaign post.

Recommended schema:

```ts
type PostCampaign = {
  title: string;
  caption: string;
  platform: string;
  destinationUrl: string;
  slug: string;

  imageUrl: string;
  imagePath: string;
  imageUrls: string[];
  imagePaths: string[];

  published: boolean;

  clickCount: number;
  lastClickedAt?: Timestamp | Date;

  sessionCount?: number;
  totalSessionDuration?: number;
  totalPagesVisited?: number;
  bounceCount?: number;

  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
};
```

Field details:

| Field | Type | Required | Purpose |
| --- | --- | --- | --- |
| `title` | string | yes | Internal campaign title shown in admin. Generated from caption if empty. |
| `caption` | string | yes | Full post caption/script. Any `research.vizuara.ai` link is rewritten to `/r/{slug}`. |
| `platform` | string | no | Admin label for source platform, for example `LinkedIn`, `X`, `YouTube`, `Email`. |
| `destinationUrl` | string | yes | Final URL after redirect. Can be a same-site path like `/publications` or an absolute `http/https` URL. Defaults to `/`. |
| `slug` | string | yes | Unique public tracking slug. Used in `/r/{slug}`. |
| `imageUrl` | string | yes | Primary image download URL. |
| `imagePath` | string | no | Primary Firebase Storage path. Used for deletion. |
| `imageUrls` | string[] | yes | All campaign image download URLs. |
| `imagePaths` | string[] | no | All Firebase Storage paths for uploaded images. |
| `published` | boolean | yes | Admin active/inactive status. Current redirect route does not block inactive campaigns. |
| `clickCount` | number | yes | Total number of times `/r/{slug}` was opened. Starts at `0`. |
| `lastClickedAt` | timestamp | no | Last time the tracking URL was clicked. |
| `sessionCount` | number | no | Total tracked same-site sessions. |
| `totalSessionDuration` | number | no | Sum of all tracked session durations in seconds. |
| `totalPagesVisited` | number | no | Sum of page counts across tracked sessions. |
| `bounceCount` | number | no | Number of sessions considered bounced. |
| `createdAt` | timestamp | yes | Creation timestamp. |
| `updatedAt` | timestamp | yes | Last update timestamp. |

## Subcollection: `postCampaigns/{campaignId}/clicks`

Each document represents one click on the public tracking URL.

Recommended schema:

```ts
type CampaignClick = {
  createdAt: Timestamp | Date;
  referrer: string;
  userAgent: string;
  ipCountry: string;
  ipCity: string;
};
```

Field details:

| Field | Type | Purpose |
| --- | --- | --- |
| `createdAt` | timestamp | Time of click. |
| `referrer` | string | HTTP `referer` header, if available. |
| `userAgent` | string | Browser/device user agent string. |
| `ipCountry` | string | Vercel country header `x-vercel-ip-country`, if available. |
| `ipCity` | string | Vercel city header `x-vercel-ip-city`, if available. |

Current dashboard usage:

- The dashboard does not list individual click documents yet.
- Click documents are stored for future detailed analytics.
- The dashboard mainly uses the parent document `clickCount`.

## Subcollection: `postCampaigns/{campaignId}/sessions`

Each document represents one tracked same-site user session after a campaign click.

Recommended schema:

```ts
type CampaignSession = {
  createdAt: Timestamp | Date;
  duration: number;
  pageCount: number;
  pages: string[];
  bounce: boolean;
};
```

Field details:

| Field | Type | Purpose |
| --- | --- | --- |
| `createdAt` | timestamp | Time the session beacon was received. |
| `duration` | number | Session duration in seconds. Capped at 3600 seconds. |
| `pageCount` | number | Number of unique paths visited. Minimum is `1`. |
| `pages` | string[] | Same-site paths visited during the session. Capped at 50 paths. |
| `bounce` | boolean | `true` when duration is less than 15 seconds or page count is 1. |

Current dashboard usage:

- Latest 200 sessions are fetched when the admin opens campaign details.
- The dashboard aggregates `pages` to show "Pages visited by your audience".
- Parent campaign aggregate fields are used for fast stat cards.

## Collection: `Users`

This collection is used for admin authorization, not campaign analytics.

The admin guard expects at least:

```ts
type User = {
  email: string;
  role: 'ADMIN' | string;
};
```

The current check is:

```text
Users where email == decodedFirebaseEmail and role == "ADMIN"
```

For another project, you can replace this with your own role system, but every admin-only route must still verify server-side authorization.

## Storage Structure

Campaign images are uploaded to Firebase Storage using paths like:

```text
publication-images/post-campaign-{safeName}
```

The campaign document stores:

- public download URLs in `imageUrl` and `imageUrls`
- storage paths in `imagePath` and `imagePaths`

The paths are important because the admin dashboard uses them to delete images from storage when an image or campaign is deleted.

## API Contract

### `GET /api/post-campaigns`

Admin only.

Returns:

```json
{
  "posts": [
    {
      "id": "campaignDocId",
      "title": "Campaign title",
      "slug": "campaign-slug",
      "clickCount": 0
    }
  ]
}
```

### `POST /api/post-campaigns`

Admin only.

Request body:

```json
{
  "title": "Optional title",
  "caption": "Full post caption",
  "platform": "LinkedIn",
  "destinationUrl": "/publications",
  "slug": "optional-custom-slug",
  "imageUrl": "https://...",
  "imagePath": "publication-images/...",
  "imageUrls": ["https://..."],
  "imagePaths": ["publication-images/..."],
  "published": true
}
```

Validation:

- `caption` is required.
- at least one image is required.
- `destinationUrl` must be a same-site path or an `http/https` URL.
- slug is slugified and made unique.

Creates a `postCampaigns` document with `clickCount: 0`.

### `GET /api/post-campaigns/{id}`

Admin only. Returns one campaign document by Firestore document ID.

### `PATCH /api/post-campaigns/{id}`

Admin only. Updates one campaign.

Important behavior:

- If `slug` changes, the API checks uniqueness.
- If `caption` changes, the tracking domain is rewritten using the effective slug.
- Empty caption or image is rejected.

### `DELETE /api/post-campaigns/{id}`

Admin only. Deletes one campaign document.

Note: the admin UI also tries to delete associated Firebase Storage images. The API itself only deletes the Firestore campaign document.

### `GET /api/post-campaigns/{id}/sessions`

Admin only.

Returns latest 200 session documents:

```json
{
  "sessions": [
    {
      "id": "sessionDocId",
      "duration": 42,
      "pageCount": 3,
      "pages": ["/", "/publications", "/team"],
      "bounce": false,
      "createdAt": "2026-07-04T10:00:00.000Z"
    }
  ]
}
```

### `GET /r/{slug}`

Public endpoint.

Behavior:

- Finds a campaign where `slug == {slug}`.
- If not found, redirects to `/`.
- Increments `clickCount`.
- Sets `lastClickedAt` and `updatedAt`.
- Creates a document in `clicks`.
- Redirects to `destinationUrl`.
- If `destinationUrl` is same-origin, adds `_c={slug}` to the URL.

### `POST /api/track-session`

Public endpoint, but same-origin protected.

Request body:

```json
{
  "campaign": "campaign-slug",
  "duration": 42,
  "pages": ["/", "/publications"]
}
```

Validation and limits:

- Origin must match the current host or localhost.
- `campaign` must match `/^[a-z0-9-]{1,70}$/`.
- `duration` is rounded and capped between `0` and `3600`.
- `pages` is converted to strings and capped at 50 paths.
- Campaign existence is verified before writing.

Writes:

- one document in `postCampaigns/{campaignId}/sessions`
- aggregate increments on `postCampaigns/{campaignId}`

Aggregate updates:

```ts
sessionCount += 1;
totalSessionDuration += duration;
totalPagesVisited += pageCount;
bounceCount += bounce ? 1 : 0;
updatedAt = now;
```

## Tracking Flow

### 1. Admin creates campaign

The admin opens:

```text
/admin -> Post Campaigns
```

The `PostCampaignsEditor` form collects the caption, destination, slug, images, and metadata. Images are uploaded to Firebase Storage first. The campaign is then saved through `POST /api/post-campaigns`.

### 2. Tracking URL is generated

The slug is either:

- manually entered by the admin, or
- generated from title/caption

The backend ensures uniqueness by querying existing campaign documents. If a slug already exists, it appends a numeric suffix:

```text
my-post
my-post-2
my-post-3
```

### 3. User clicks public URL

The user clicks:

```text
https://research.vizuara.ai/r/{slug}
```

The route `app/r/[slug]/route.ts` records the click and redirects to the destination.

### 4. Same-site sessions are tracked

If the destination is on the same site, the redirect URL receives:

```text
?_c={slug}
```

`CampaignTracker` reads this query parameter, stores it in `sessionStorage`, tracks visited paths, and sends a beacon when the visitor leaves.

### 5. Dashboard shows analytics

The dashboard reads aggregate fields from each `postCampaigns` document:

- `clickCount`
- `sessionCount`
- `totalSessionDuration`
- `totalPagesVisited`
- `bounceCount`

It computes:

- average session duration = `totalSessionDuration / sessionCount`
- average pages per visit = `totalPagesVisited / sessionCount`
- bounce rate = `bounceCount / sessionCount`
- click-to-session rate = `sessionCount / clickCount`

When "More details" is opened, the dashboard fetches recent session documents and counts paths in the `pages` array.

## Indexes Needed

Firestore may ask for indexes depending on query usage. The current feature relies on these query patterns:

```text
postCampaigns where slug == {slug} limit 1
postCampaigns orderBy createdAt desc
postCampaigns/{id}/sessions orderBy createdAt desc limit 200
Users where email == {email} and role == "ADMIN" limit 1
```

Recommended indexes for a new database:

- `postCampaigns.slug` single-field index
- `postCampaigns.createdAt` descending single-field index
- `postCampaigns/{id}/sessions.createdAt` descending single-field index
- composite index on `Users.email` + `Users.role` if Firestore requests it

Firestore usually creates single-field indexes automatically. Composite indexes may need to be created from the Firebase console if prompted.

## Porting Notes For Another Project

To reuse this feature in another project, implement these pieces:

1. A protected admin UI for creating campaigns.
2. A `postCampaigns` table/collection with the schema above.
3. A unique slug check.
4. A public redirect endpoint equivalent to `/r/{slug}`.
5. A frontend session tracker mounted globally.
6. A session ingestion endpoint equivalent to `/api/track-session`.
7. A click subcollection/table and session subcollection/table.
8. Aggregate counters on the campaign record for fast dashboard stats.
9. Server-side admin authorization on all campaign management APIs.
10. Image storage for campaign media, or replace image fields with your own media system.

If the new project does not use Firestore, the equivalent relational schema would be:

```sql
campaign_posts (
  id primary key,
  title text not null,
  caption text not null,
  platform text,
  destination_url text not null,
  slug text unique not null,
  image_url text not null,
  image_path text,
  image_urls jsonb,
  image_paths jsonb,
  published boolean not null default true,
  click_count integer not null default 0,
  last_clicked_at timestamp,
  session_count integer not null default 0,
  total_session_duration integer not null default 0,
  total_pages_visited integer not null default 0,
  bounce_count integer not null default 0,
  created_at timestamp not null,
  updated_at timestamp not null
);

campaign_clicks (
  id primary key,
  campaign_id references campaign_posts(id),
  created_at timestamp not null,
  referrer text,
  user_agent text,
  ip_country text,
  ip_city text
);

campaign_sessions (
  id primary key,
  campaign_id references campaign_posts(id),
  created_at timestamp not null,
  duration integer not null,
  page_count integer not null,
  pages jsonb not null,
  bounce boolean not null
);
```

Use a unique index on `campaign_posts.slug`, an index on `campaign_clicks.campaign_id`, and an index on `campaign_sessions.campaign_id`.

## Current Limitations

- The `published` field is shown in admin, but `/r/{slug}` currently redirects even when `published` is `false`.
- Individual click rows are stored but not displayed in the dashboard.
- Session tracking only works when the destination is on the same site, because external destinations do not receive the `_c` tracking parameter.
- The session beacon is sent when the tab becomes hidden or the page unloads. If a browser blocks the beacon, the click still counts but the session may not.
- The delete API removes the campaign document only. Image cleanup is handled by the admin UI, not by the API.
