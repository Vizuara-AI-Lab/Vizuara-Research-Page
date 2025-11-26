// app/data/publication-images.ts
export type ImageOverride = { src: string; note?: string };

/*
Keys can be:
- arxiv:<id>     e.g., 'arxiv:2410.14347'
- doi:<doi>      e.g., 'doi:10.48550/arXiv.2410.14347'
- normalized title (lowercase, no punctuation) e.g., 'nanovlms how small can we go ...'
*/
export const PUB_IMAGE_OVERRIDES: Record<string, ImageOverride> = {
  // By arXiv id
  'arxiv:2410.14347': { src: '/papers/neural-network.png' },

  // By normalized title
  'nanovlms how small can we go and still make coherent vision language models': {
    src: '/papers/neural-network.png',
  },
  'latent multi head attention for small language models': {
    src: '/papers/neural-network.png',
  },

  // You can also use absolute URLs (Cloudinary, etc.)
  // 'doi:10.1234/abc-xyz': { src: 'https://res.cloudinary.com/YOUR_CLOUD/image/upload/v123/paper.png' },
};