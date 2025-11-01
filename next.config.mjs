/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sazaklab.ir",
        port: "",
      },
    ],
  },
};

export default nextConfig;
