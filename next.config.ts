import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // site photos are stored in Vercel Blob (see src/data/images.ts)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "5ogkncz8mgraqdcd.public.blob.vercel-storage.com",
        pathname: "/images/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
