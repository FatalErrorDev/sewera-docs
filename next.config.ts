import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/sewera-docs",
  assetPrefix: "/sewera-docs/",
  images: { unoptimized: true },
};

export default nextConfig;
