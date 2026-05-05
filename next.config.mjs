/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    parallelServerBuildTraces: false,
    parallelServerCompiles: false,
    webpackBuildWorker: false
  }
};

export default nextConfig;
