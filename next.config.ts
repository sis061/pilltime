import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cxkefmygfdtcwidshaoa.supabase.co",
        pathname: "/storage/v1/object/public/medicine-images/**",
      },
    ],
  },
  allowedDevOrigins: [
    "http://localhost:3000", // 로컬호스트
    "http://192.168.35.73:3000", // 같은 네트워크의 다른 기기 IP
    // "local-origin.dev", // 커스텀 도메인
    // "*.local-origin.dev", // 와일드카드 도메인
  ],
};

// export default nextConfig;

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  // openAnalyzer: true // default!
})(nextConfig);
