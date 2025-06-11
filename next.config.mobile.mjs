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

  // 实验性功能
  experimental: {
    // 启用应用目录
    appDir: true,
    // 优化字体加载
    optimizeFonts: true,
    // 启用SWC压缩
    swcMinify: true,
  },

  // 编译器选项
  compiler: {
    // 移除console.log（生产环境）
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 环境变量
  env: {
    CUSTOM_KEY: 'my-value',
  },

  // 重定向配置
  async redirects() {
    return [
      {
        source: '/',
        destination: '/zh',
        permanent: false,
      },
    ]
  },

  // 国际化配置
  i18n: {
    locales: ['zh', 'en'],
    defaultLocale: 'zh',
    localeDetection: false,
  },

  // Webpack 优化
  webpack: (config, { dev, isServer }) => {
    // 处理浏览器特定的模块
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }

    // 生产环境优化
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        // 启用模块连接
        concatenateModules: true,
        // 优化重复模块
        mergeDuplicateChunks: true,
        // 移除空的 chunks
        removeEmptyChunks: true,
      }

      // 代码分割优化
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      }
    }

    return config
  },

  // 性能优化
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
}

export default nextConfig
