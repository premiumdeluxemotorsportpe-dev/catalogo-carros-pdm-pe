import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'r2.fivemanage.com' },
      { protocol: 'https', hostname: 'static.wikia.nocookie.net' },
      { protocol: 'https', hostname: 'img.gta5-mods.com' },

      // acrescenta outros hosts que usares
      // { protocol: 'https', hostname: '*.cloudfront.net' }, // wildcard de subdomínio
    ],
  },
  /* config options here */
};

export default nextConfig;
