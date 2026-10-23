import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // The repo root has its own yarn.lock, which Next would otherwise pick as the tracing root
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
