import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
images: {
remotePatterns: [
{ protocol: 'https', hostname: 'images.unsplash.com' },
{ protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
{ protocol: 'https', hostname: 'i0.wp.com' },
{ protocol: 'https', hostname: 'research.vizuara.ai' },
{ protocol: 'https', hostname: 'arxiv.org' },
{ protocol: 'https', hostname: 'openreview.net' },
{ protocol: 'https', hostname: 'dl.acm.org' },
{ protocol: 'https', hostname: 'ieeexplore.ieee.org' },
{ protocol: 'https', hostname: 'link.springer.com' }
]
},
async headers() {
  return [
    {
      source: '/hero/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ];
}
};

export default nextConfig;