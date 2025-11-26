// app/lib/scholar.ts
// Note: for figure extraction, install cheerio: `npm i cheerio`

export type Publication = {
  title: string;
  authors?: string;
  venue?: string;
  paperLink?: string;
  year?: number;
  imageUrl?: string;
  sources?: string[];
  tags?: string[];
};

const BASE = 'https://serpapi.com/search.json';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36';

function normTitle(t: string) {
  return t.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

type AuthorFetchOpts = { maxPages?: number };

async function fetchAuthorPage(authorId: string, start = 0) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error('Missing SERPAPI_KEY');
  const url = `${BASE}?engine=google_scholar_author&author_id=${authorId}&hl=en&num=100&start=${start}&sort=pubdate&api_key=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 21600 } });
  if (!res.ok) throw new Error(`Scholar fetch failed: ${res.status}`);
  return res.json();
}

async function getPublicationsForAuthor(authorId: string, opts: AuthorFetchOpts = {}): Promise<Publication[]> {
  const all: Publication[] = [];
  const maxPages = Math.max(1, opts.maxPages ?? 2);
  let start = 0;
  for (let page = 0; page < maxPages; page++) {
    const data = await fetchAuthorPage(authorId, start);
    const items = (data.articles ?? []).map((a: any): Publication => ({
      title: a.title,
      authors: a.authors,
      venue: a.publication,
      paperLink: a.link,
      year: a.year ? Number(a.year) : undefined,
      sources: [authorId],
    }));
    all.push(...items);
    const hasNext = !!data.serpapi_pagination?.next || (Array.isArray(data.articles) && data.articles.length === 100);
    if (!hasNext) break;
    start += 100;
  }
  return all;
}

export async function getPublicationsForAuthors(authorIds: string[], opts: AuthorFetchOpts = {}): Promise<Publication[]> {
  const lists = await Promise.all(authorIds.map((id) => getPublicationsForAuthor(id, opts)));
  const merged = lists.flat();
  const byTitle = new Map<string, Publication>();
  for (const pub of merged) {
    const key = normTitle(pub.title || '');
    if (!key) continue;
    const existing = byTitle.get(key);
    if (!existing) {
      byTitle.set(key, pub);
    } else {
      existing.sources = Array.from(new Set([...(existing.sources ?? []), ...(pub.sources ?? [])]));
      if (!existing.year && pub.year) existing.year = pub.year;
      if (!existing.venue && pub.venue) existing.venue = pub.venue;
      if (!existing.paperLink && pub.paperLink) existing.paperLink = pub.paperLink;
    }
  }
  return Array.from(byTitle.values()).sort((a, b) => {
    const ya = a.year ?? 0;
    const yb = b.year ?? 0;
    if (yb !== ya) return yb - ya;
    return a.title.localeCompare(b.title);
  });
}

function normalizePaperUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('arxiv.org') && u.pathname.startsWith('/pdf/')) {
      u.pathname = u.pathname.replace('/pdf/', '/abs/').replace(/\.pdf$/i, '');
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

const ogMemoryCache = new Map<string, string | null>();

export async function getOpenGraphImage(paperUrl: string): Promise<string | null> {
  if (!paperUrl) return null;
  const url = normalizePaperUrl(paperUrl);
  if (ogMemoryCache.has(url)) return ogMemoryCache.get(url) ?? null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(url, {
      headers: { 'user-agent': USER_AGENT },
      next: { revalidate: 86400 },
      signal: controller.signal,
    });
    if (!res.ok) {
      ogMemoryCache.set(url, null);
      return null;
    }
    const html = await res.text();
    const meta = (name: string, attr = 'property') => {
      const re = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
      const m = html.match(re);
      return m?.[1] || null;
    };
    const candidates = [
      meta('twitter:image:src', 'name'),
      meta('twitter:image', 'name'),
      meta('og:image', 'property'),
      meta('og:image:secure_url', 'property'),
    ].filter(Boolean) as string[];

    if (candidates.length > 0) {
      const src = candidates[0].replace(/&amp;/g, '&');
      let absolute = src;
      try {
        absolute = new URL(src, url).toString();
      } catch {}
      ogMemoryCache.set(url, absolute);
      return absolute;
    }
    ogMemoryCache.set(url, null);
    return null;
  } catch {
    ogMemoryCache.set(url, null);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function extractArxivIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('arxiv.org')) return null;
    const mAbs = u.pathname.match(/\/abs\/([\w.\-\/]+)$/i);
    if (mAbs?.[1]) return mAbs[1];
    const mPdf = u.pathname.match(/\/pdf\/([\w.\-\/]+)\.pdf$/i);
    if (mPdf?.[1]) return mPdf[1];
    return null;
  } catch {
    return null;
  }
}

function absolutize(baseUrl: string, src: string): string {
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return src;
  }
}

export async function getBestFigureFromHtml(html: string, baseUrl: string): Promise<string | null> {
  const { load } = await import('cheerio');
  const $ = load(html);
  const candidates: Array<{ src: string; score: number; area: number }> = [];

  $('figure img, .figure img, img').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (!src) return;
    const alt = ($(el).attr('alt') || '').toLowerCase();
    const cls = ($(el).attr('class') || '').toLowerCase();
    const inFigure = $(el).closest('figure').length > 0 || cls.includes('figure') || cls.includes('fig');
    const w = parseInt($(el).attr('width') || '') || 0;
    const h = parseInt($(el).attr('height') || '') || 0;
    const area = w * h;
    const s = src.toLowerCase();

    let score = 0;
    if (inFigure) score += 5;
    if (alt.match(/figure|fig|diagram|chart|graph/)) score += 3;
    if (cls.match(/figure|fig|diagram/)) score += 2;
    if (s.match(/figure|fig/)) score += 2;
    if (area >= 200 * 200) score += 1;

    candidates.push({ src, score, area });
  });

  candidates.sort((a, b) => b.score - a.score || b.area - a.area);
  const best = candidates.find((c) => c.src);
  return best ? absolutize(baseUrl, best.src) : null;
}

export async function getBestFigureFromUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const html = await res.text();
    return getBestFigureFromHtml(html, url);
  } catch {
    return null;
  }
}

export async function getFirstImageFromHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const html = await res.text();
    const getMeta = (name: string, attr = 'property') => {
      const re = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
      const m = html.match(re);
      return m?.[1] || null;
    };
    const linkImageSrc = (() => {
      const re = /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i;
      const m = html.match(re);
      return m?.[1] || null;
    })();
    const candidates = [
      getMeta('twitter:image:src', 'name'),
      getMeta('twitter:image', 'name'),
      getMeta('og:image', 'property'),
      getMeta('og:image:secure_url', 'property'),
      linkImageSrc,
    ].filter(Boolean) as string[];
    if (candidates.length) return absolutize(url, candidates[0]);
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (imgMatch?.[1]) return absolutize(url, imgMatch[1]);
    return null;
  } catch {
    return null;
  }
}

export async function getArxivFigureFromAr5iv(arxivId: string): Promise<string | null> {
  const page = `https://ar5iv.org/html/${arxivId}`;
  return getBestFigureFromUrl(page);
}

export async function getBestThumbnailForUrl(url: string): Promise<string | null> {
  const arxivId = extractArxivIdFromUrl(url);
  if (arxivId) {
    const fig = await getArxivFigureFromAr5iv(arxivId);
    if (fig) return fig;
  }
  const bestFig = await getBestFigureFromUrl(url);
  if (bestFig) return bestFig;
  const og = await getOpenGraphImage(url);
  if (og) return og;
  const firstImg = await getFirstImageFromHtml(url);
  if (firstImg) return firstImg;
  return null;
}

export async function augmentWithThumbnails(
  publications: Publication[],
  limit = publications.length,
  concurrency = 6
): Promise<Publication[]> {
  const size = Math.min(limit, publications.length);
  const head = publications.slice(0, size);
  const tail = publications.slice(size);
  const out: Publication[] = new Array(head.length);
  let nextIndex = 0;

  async function worker() {
    for (;;) {
      const i = nextIndex++;
      if (i >= head.length) break;
      const p = head[i];
      if (p.imageUrl) {
        out[i] = p;
        continue;
      }
      try {
        const best = p.paperLink ? await getBestThumbnailForUrl(p.paperLink) : null;
        out[i] = best ? { ...p, imageUrl: best } : p;
      } catch {
        out[i] = p;
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, head.length) }, () => worker());
  await Promise.allSettled(workers);
  return [...out, ...tail];
}

export function filterByAuthors(publications: Publication[], names: string[]) {
  const needles = names.map((n) => n.toLowerCase().trim()).filter(Boolean);
  return publications.filter((p) => {
    const hay = (p.authors || '').toLowerCase();
    return needles.some((n) => hay.includes(n));
  });
}

// --- Overrides & topic tagging ---

export function normalizeTitleKey(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

export function extractDoi(url: string): string | null {
  if (!url) return null;
  const m = url.match(/doi\.org\/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)$/i);
  return m ? m[1].toLowerCase() : null;
}

export function makePubKey(pub: Publication): string {
  if (pub.paperLink) {
    const arxivId = extractArxivIdFromUrl(pub.paperLink);
    if (arxivId) return `arxiv:${arxivId}`;
    const doi = extractDoi(pub.paperLink);
    if (doi) return `doi:${doi}`;
  }
  return normalizeTitleKey(pub.title || '');
}

export function applyImageOverrides(
  publications: Publication[],
  overrides: Record<string, { src: string }>
): Publication[] {
  return publications.map((p) => {
    const key = makePubKey(p);
    const byKey = overrides[key];
    const byTitle = overrides[normalizeTitleKey(p.title || '')];
    const o = byKey || byTitle;
    return o ? { ...p, imageUrl: o.src } : p;
  });
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

const TAG_RULES: Array<{ tag: string; patterns: RegExp[] }> = [
  { tag: 'AI', patterns: [/ai/i] },
  { tag: 'ML', patterns: [/\bml\b/i, /machine learning/i] },
  { tag: 'Neural Networks', patterns: [/neural network/i, /\bnn\b/i] },
  { tag: 'LLM', patterns: [/\bllm(s)?\b/i, /large language model/i, /transformer/i, /\bgpt\b/i] },
  { tag: 'SLM', patterns: [/\bslm(s)?\b/i, /small language model/i, /tiny stories/i] },
  { tag: 'Attention', patterns: [/attention head/i, /multi-?head attention/i, /\battention\b/i] },
  { tag: 'VLM', patterns: [/\bvlm(s)?\b/i, /vision[- ]language/i, /nanovlm/i] },
  { tag: 'ViT', patterns: [/\bvit\b/i, /vision transformer/i] },
  { tag: 'CNN', patterns: [/\bcnn(s)?\b/i, /convolutional/i] },
  { tag: 'Computer Vision', patterns: [/computer vision/i, /image classification|segmentation|detection/i] },
  { tag: 'NLP', patterns: [/\bnlp\b/i, /language processing/i, /tokenizer/i] },
  { tag: 'Reinforcement Learning', patterns: [/reinforcement learning/i, /\brl\b/i, /\brlhf\b/i, /\bppo\b/i, /actor-critic/i] },
  { tag: 'RLHF', patterns: [/\brlhf\b/i] },
  { tag: 'SciML', patterns: [/scientific machine learning/i, /\bsciml\b/i, /physics-?informed/i, /\bode\b/i] },
  { tag: 'PINN', patterns: [/\bpinns?\b/i, /physics-?informed/i] },
  { tag: 'Neural ODE', patterns: [/neural\s+ode/i, /neural (ordinary )?differential equation/i, /\bnode\b(?!\.js)/i] },
  { tag: 'UDE', patterns: [/\bude\b/i, /universal differential equation/i] },
  { tag: 'Symbolic Regression', patterns: [/symbolic regression/i] },
  { tag: 'Optimization', patterns: [/optimization/i, /optimizer/i] },
  { tag: 'MOE', patterns: [/\bmoe\b/i, /mixture of experts/i] },
  { tag: 'GenAI', patterns: [/generative ai/i, /\bgenai\b/i, /diffusion/i, /\bgan(s)?\b/i] },
  { tag: 'Cognition', patterns: [/cognition|cognitive/i] },
  { tag: 'Bias', patterns: [/bias(es)?|fairness/i] },
  { tag: 'Reasoning', patterns: [/reasoning|chain[- ]of[- ]thought/i] },
  { tag: 'XAI', patterns: [/\bxai\b/i, /explainable/i] },
  { tag: 'Inference', patterns: [/inference/i] },
];

function inferTagsForPublication(p: Publication): string[] {
  const base = `${p.title || ''} ${p.venue || ''}`.toLowerCase();
  const tags = new Set<string>(['AI', 'ML']);
  for (const rule of TAG_RULES) {
    if (rule.patterns.some((rx) => rx.test(base))) tags.add(rule.tag);
  }
  if (/neural/.test(base)) tags.add('Neural Networks');
  return Array.from(tags);
}

export type TopicOverrides = Record<string, string[]>;

export function applyTags(publications: Publication[], overrides: TopicOverrides = {}) {
  return publications.map((p) => {
    const key = makePubKey(p);
    const manual = overrides[key] || overrides[normalizeTitleKey(p.title || '')] || [];
    const auto = inferTagsForPublication(p);
    const tags = uniq([...(p.tags ?? []), ...manual, ...auto]);
    return { ...p, tags };
  });
}