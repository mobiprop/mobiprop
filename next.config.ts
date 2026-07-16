import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Proxy buffers request bodies (10MB default); listing uploads send up to
    // 10 images × 10MB in one multipart request, which would otherwise be
    // truncated and fail formData() parsing with "Invalid form data".
    proxyClientMaxBodySize: "110mb",
    serverActions: {
      // Default is 1MB, which rejects most real photo uploads — the
      // updateProfile server action accepts avatars up to MAX_AVATAR_SIZE (5MB).
      bodySizeLimit: "8mb",
    },
  },
  images: {
    // Listing/profile images served from Supabase Storage public buckets.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
