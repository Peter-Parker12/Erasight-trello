const prod = process.env.NODE_ENV === "production";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  disable: !prod,
  workboxOptions: {
    skipWaiting: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  turbopack: {},
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3001", "localhost:9090", "work.erasight.net"],
      bodySizeLimit: "6mb",
    },
  },
};

module.exports = withPWA(nextConfig);
