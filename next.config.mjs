/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/2024',
        destination: '/2024.html',
      },
      {
        source: '/2025',
        destination: '/2025.html',
      },
      {
        source: '/2026',
        destination: '/2026.html',
      },
      {
        source: '/events',
        destination: '/events.html',
      },
      {
        source: '/ranking',
        destination: '/ranking.html',
      },
      {
        source: '/dashboard',
        destination: '/dashboard.html',
      },
      {
        source: '/more/api',
        destination: 'https://github.com/lukasus55/kkol/blob/main/API.md',
      }
    ];
  },
};

export default nextConfig;
