import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose the backend URL to the browser via an env variable.
  // In production, set NEXT_PUBLIC_API_URL in your Vercel dashboard.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  },
};

export default nextConfig;
