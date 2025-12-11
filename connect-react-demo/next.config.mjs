/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/connect/demo',
  assetPrefix: '/connect/demo',
  // Note: eslint config removed in Next.js 16 - use ESLint CLI directly if needed
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
