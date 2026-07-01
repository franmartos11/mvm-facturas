import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: '10mb',
  },
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
