/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'imgur.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // Proxy /api/v1/* → backend API (avoids CORS for SSR calls)
  ...(API_URL && {
    async rewrites() {
      return [
        {
          source: '/api/v1/:path*',
          destination: `${API_URL}/:path*`,
        },
      ]
    },
  }),
}

export default nextConfig
