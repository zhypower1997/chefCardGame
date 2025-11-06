import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker runtime
  output: "export",
};

export default nextConfig;
