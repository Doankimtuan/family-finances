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
      {
        source: "/transactions",
        destination: "/activity",
        permanent: true,
      },
      {
        source: "/transactions/:path*",
        destination: "/activity/:path*",
        permanent: true,
      },
      {
        source: "/jars",
        destination: "/goals?tab=jars",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
