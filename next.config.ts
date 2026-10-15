import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** Rewrite workspace — Architecture v2.0.0. No legacy route redirects. */
const nextConfig: NextConfig = {
  // Next dev logging includes Server Function arguments, which can contain credentials.
  logging: {
    serverFunctions: false,
  },
};

export default withNextIntl(nextConfig);
