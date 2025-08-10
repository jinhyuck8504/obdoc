/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  typescript: {
    // TypeScript 빌드 오류가 있어도 빌드를 계속 진행
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint 오류가 있어도 빌드를 계속 진행
    ignoreDuringBuilds: false,
  },
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  // Netlify 배포를 위한 설정
  trailingSlash: false,
  output: 'standalone'
}

module.exports = nextConfig