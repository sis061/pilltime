import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    formats: ["image/avif", "image/webp"],
    //  원격(최적화 이미지) 캐시 TTL — 브라우저/중간 캐시들이 길게 잡을 수 있게 힌트
    minimumCacheTTL: 31536000, // 1 year (초 단위)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cxkefmygfdtcwidshaoa.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "antd"],
  },
  allowedDevOrigins: ["http://localhost:3000", "http://192.168.35.41:3000"],

  //  정적 폴백 이미지에 강한 캐시 헤더 부여
  async headers() {
    return [
      {
        source: "/fallback-medicine.webp",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

// export default withBundleAnalyzer({
//   enabled: process.env.ANALYZE === "true",
// })(nextConfig);
