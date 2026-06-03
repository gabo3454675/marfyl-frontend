const withPWA = require('next-pwa')({
  dest: 'public',
  disable:
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_PWA_DEV !== 'true',
  register: true,
  skipWaiting: true,
  sw: 'sw.js',
  publicExcludes: ['!robots.txt', '!sitemap.xml'],
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
};

module.exports = withPWA(nextConfig);
