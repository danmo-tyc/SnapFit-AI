import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出配置（用于移动应用打包）
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // 性能优化配置
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'date-fns'
    ],
  },

  // 编译器优化
  compiler: {
    // 移除 console.log（仅在生产环境）
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // 图片优化
  images: {
    unoptimized: true, // 保持现有设置
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 压缩配置
  compress: true,

  // 性能预算
  onDemandEntries: {
    // 页面在内存中保持的时间（毫秒）
    maxInactiveAge: 25 * 1000,
    // 同时保持的页面数
    pagesBufferLength: 2,
  },

  // Webpack 优化
  webpack: (config, { dev, isServer, webpack }) => {
    // 处理浏览器特定的模块
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }

      // 添加全局变量polyfill
      config.plugins.push(
        new webpack.DefinePlugin({
          'self': 'globalThis',
          'window': 'globalThis',
          'document': 'undefined',
          'navigator': 'undefined',
        })
      )
    }

    // 简化的生产环境优化（避免与 output: 'export' 冲突）
    if (!dev) {
      // 基本优化，避免复杂的分包策略
      config.optimization = {
        ...config.optimization,
        minimize: true,
      }
    }

    return config
  },

  // 注意：headers 在 output: 'export' 模式下不工作，所以移除了
}

export default withNextIntl(nextConfig);
