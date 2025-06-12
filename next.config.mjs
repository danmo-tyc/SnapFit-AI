import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出配置（用于移动应用打包）
  output: 'export',
  trailingSlash: true,

  // 基本配置
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // 图片配置
  images: {
    unoptimized: true
  },

  // 编译器配置
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // 简化的webpack配置
  webpack: (config, { dev, isServer }) => {
    // 基本的服务端配置
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }

    return config
  },
}

export default withNextIntl(nextConfig);
