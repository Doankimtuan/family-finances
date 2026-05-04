import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/money",
        destination: "/accounts",
        permanent: true,
      },
      {
        source: "/money/:path*",
        destination: "/accounts/:path*",
        permanent: true,
      },
      {
        source: "/debts",
        destination: "/accounts",
        permanent: true,
      },
      {
        source: "/debts/:id",
        destination: "/accounts/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
