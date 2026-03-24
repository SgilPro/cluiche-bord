import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  publicRuntimeConfig: {
    apiOrigin: process.env.API_ORIGIN ?? "https://cluiche-bord.zeabur.app",
  },
};

export default nextConfig;
