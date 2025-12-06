/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Add empty turbopack config to acknowledge Turbopack
  turbopack: {},
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [],
})(nextConfig);
