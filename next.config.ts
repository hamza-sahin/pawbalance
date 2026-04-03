import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: process.env.BUILD_MODE === "server" ? "standalone" : "export",
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    "@mariozechner/pi-coding-agent",
    "@mariozechner/pi-agent-core",
    "@mariozechner/pi-ai",
  ],
};

export default withNextIntl(nextConfig);
