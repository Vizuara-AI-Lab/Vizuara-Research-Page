# LinkedIn Testimonials Section — Implementation Guide

## Current File
`app/components/TestimonialsSection.tsx`

## Current State
The section currently uses **hardcoded testimonials** with Unsplash avatar images and static quote text. It displays as 3 auto-scrolling columns with framer-motion animations.

---

## How to Switch to Real LinkedIn Post Embeds

### Step 1: Get LinkedIn Post Embed URLs

For each LinkedIn post you want to embed:

1. Go to the LinkedIn post
2. Click the `...` menu on the post
3. Click **"Embed this post"**
4. LinkedIn gives you an iframe snippet like:
   ```html
   <iframe src="https://www.linkedin.com/embed/feed/update/urn:li:share:7270442708649877504" height="500" width="504" frameborder="0" allowfullscreen></iframe>
   ```
5. Copy just the `src` URL — that's the `postUrl`

### Step 2: Update the Data

Replace the `testimonials` array with LinkedIn post data:

```ts
interface LinkedInPost {
  name: string;       // Person's name (for accessibility)
  label: string;      // Short label like "Spotlight Poster Session"
  postUrl: string;    // The LinkedIn embed URL from Step 1
}

const linkedinPosts: LinkedInPost[] = [
  {
    name: "Miheer Salunke",
    label: "Spotlight Poster Session",
    postUrl: "https://www.linkedin.com/embed/feed/update/urn:li:share:XXXXXXXXXX",
  },
  {
    name: "Vizuara Researcher",
    label: "Research Update",
    postUrl: "https://www.linkedin.com/embed/feed/update/urn:li:share:XXXXXXXXXX",
  },
  // ... add more posts
];
```

### Step 3: Replace the Card Component

Replace the scrolling column approach with a simple grid of LinkedIn iframes:

```tsx
function LinkedInEmbed({ post }: { post: LinkedInPost }) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden transition-all hover:shadow-lg hover:border-teal/30 hover:-translate-y-0.5">
      <iframe
        src={post.postUrl}
        width="100%"
        height="500"
        frameBorder="0"
        allowFullScreen
        title={`LinkedIn post by ${post.name}`}
        className="w-full"
        loading="lazy"
      />
    </div>
  );
}
```

### Step 4: Update the Layout

Replace the 3-column scrolling layout with a static grid:

```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {linkedinPosts.map((post, i) => (
    <AnimatedSection key={i} delay={0.05 + i * 0.08}>
      <LinkedInEmbed post={post} />
    </AnimatedSection>
  ))}
</div>
```

---

## Section Header (Already Updated)

```
──── From the Community ────

Stories from our researchers

Milestones, acceptances, and moments shared by
Vizuara students and alumni on LinkedIn.
```

---

## Finding the LinkedIn URN

The embed URL format is:
```
https://www.linkedin.com/embed/feed/update/urn:li:share:{POST_ID}
```

To find `{POST_ID}`:
- From the post URL like `https://www.linkedin.com/posts/username_activity-7270442708649877504-xxxx`, the ID is `7270442708649877504`
- Or use LinkedIn's "Embed this post" button which gives you the full URL

---

## Notes
- LinkedIn embeds are iframes — they load LinkedIn's own styling and interactivity
- `loading="lazy"` ensures they don't all load at once
- Each iframe is ~500px tall; adjust as needed
- The embeds respect LinkedIn's light/dark mode based on the user's LinkedIn settings, not your site theme
- No LinkedIn API key or authentication is needed for public post embeds
