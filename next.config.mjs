/** @type {import('next').NextConfig} */
const nextConfig = {
  // Surface side-effect bugs early during local dev.
  reactStrictMode: true,

  // Security hygiene — removes the "X-Powered-By: Next.js" response header.
  poweredByHeader: false,

  eslint: {
    // During the visual prototype phase, lint warnings must NOT block Vercel deploys.
    // We'll tighten this back up once the OS is feature-complete.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
