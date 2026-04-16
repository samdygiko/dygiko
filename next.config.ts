import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      // Redirect bare domain to www for canonical consistency
      {
        source: "/:path*",
        has: [{ type: "host", value: "dygiko.com" }],
        destination: "https://www.dygiko.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
