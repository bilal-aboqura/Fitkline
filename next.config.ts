import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yefvzsdnexduqtfengcp.supabase.co",
        pathname: "/storage/v1/object/public/fitkline-assets/**",
      },
    ],
  },
};

export default nextConfig;
