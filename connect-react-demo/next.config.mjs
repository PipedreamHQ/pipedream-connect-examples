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
  async redirects() {
    return [
      {
        source: '/',
        destination: '/connect/demo',
        permanent: false,
        basePath: false
      }
    ]
  }
}

export default nextConfig