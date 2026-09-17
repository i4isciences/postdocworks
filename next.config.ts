import type { NextConfig } from "next";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), "app", "doc2postdoc", ".env"), override: false });

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "euusmimokvzlfjorwwau.supabase.co" }],
  },
};

export default nextConfig;
