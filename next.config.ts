import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cxkefmygfdtcwidshaoa.supabase.co", // ✅ 본인 Supabase 프로젝트 도메인
        pathname: "/storage/v1/object/public/medicine-images/**",
      },
    ],
  },
};

export default nextConfig;
