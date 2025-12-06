import withPWAInit from 'next-pwa';

// PWA configuration initialize kar rahe hain
const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, 
  // reactCompiler aur turbopack hata diya kyunki wo Next.js 14 me invalid hain
};

export default withPWA(nextConfig);
