/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  eslint: {
    // Pas de config ESLint dans ce repo — ne doit pas bloquer le build.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
