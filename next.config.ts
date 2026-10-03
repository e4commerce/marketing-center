import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  experimental: { serverActions: { bodySizeLimit: "200mb" } },
};

export default nextConfig;
