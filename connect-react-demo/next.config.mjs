/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/connect/demo',
  assetPrefix: '/connect/demo',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig