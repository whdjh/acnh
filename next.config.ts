import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/brand/timsldogam',
        destination: '/brand/tamsldogam',
        permanent: true, // 301
      },
    ];
  },
};

export default nextConfig;
