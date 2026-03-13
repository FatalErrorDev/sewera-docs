import type { NextConfig } from "next";

// Site name used in metadata and components
// To deploy as static export (Vercel/Netlify), change output to 'export'
// and add: images: { unoptimized: true }
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
