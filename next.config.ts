/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: any) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
