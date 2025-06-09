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
  experimental: {
    serverActions: {
      allowedOrigins: [
        'pipedream.com',
        'https://pipedream.com',
        'pipedream-connect-demo.vercel.app',
        'https://pipedream-connect-demo.vercel.app'
      ]
    }
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
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/_vercel/:path*',
          destination: 'https://pipedream-connect-demo.vercel.app/_vercel/:path*',
          basePath: false
        }
      ]
    }
  },
}

export default nextConfig