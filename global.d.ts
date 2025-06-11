// 全局类型定义

declare global {
  // 性能监控相关
  interface Performance {
    memory?: {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
  }

  // 环境变量类型
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      NEXT_PUBLIC_APP_URL?: string
      NEXT_PUBLIC_ANALYTICS_ID?: string
    }
  }

  // 扩展 Window 接口
  interface Window {
    // 性能监控
    __PERFORMANCE_OBSERVER__?: PerformanceObserver
    
    // 错误监控
    __ERROR_BOUNDARY_COUNT__?: number
    
    // 开发工具
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any
  }

  // 自定义事件类型
  interface CustomEventMap {
    'performance-warning': CustomEvent<{
      component: string
      renderTime: number
      threshold: number
    }>
    
    'error-boundary-triggered': CustomEvent<{
      component: string
      error: Error
      errorInfo: React.ErrorInfo
    }>
  }

  // 扩展 Document 接口
  interface Document {
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions
    ): void
    
    removeEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => void,
      options?: boolean | EventListenerOptions
    ): void
  }
}

// 模块声明
declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

declare module '*.gif' {
  const content: string
  export default content
}

declare module '*.webp' {
  const content: string
  export default content
}

declare module '*.avif' {
  const content: string
  export default content
}

// CSS 模块
declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string }
  export default classes
}

// Web Vitals 类型扩展
declare module 'web-vitals' {
  export interface Metric {
    name: string
    value: number
    delta: number
    id: string
    entries: PerformanceEntry[]
  }

  export function getCLS(onPerfEntry?: (metric: Metric) => void): void
  export function getFID(onPerfEntry?: (metric: Metric) => void): void
  export function getFCP(onPerfEntry?: (metric: Metric) => void): void
  export function getLCP(onPerfEntry?: (metric: Metric) => void): void
  export function getTTFB(onPerfEntry?: (metric: Metric) => void): void
}

// 工具类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type NonNullable<T> = T extends null | undefined ? never : T

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T

// 组件类型
export type ComponentWithChildren<P = {}> = React.FunctionComponent<
  P & { children?: React.ReactNode }
>

export type ComponentWithOptionalChildren<P = {}> = React.FunctionComponent<
  P & { children?: React.ReactNode }
>

// 事件处理器类型
export type EventHandler<T = Element> = (event: React.SyntheticEvent<T>) => void

export type ChangeHandler<T = HTMLInputElement> = (
  event: React.ChangeEvent<T>
) => void

export type ClickHandler<T = HTMLButtonElement> = (
  event: React.MouseEvent<T>
) => void

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 错误类型
export interface AppError extends Error {
  code?: string
  statusCode?: number
  details?: any
}

// 性能指标类型
export interface PerformanceMetrics {
  renderTime: number
  componentMountTime: number
  memoryUsage?: number
  isSlowRender: boolean
}

export interface WebVitalsMetrics {
  CLS?: number
  FID?: number
  FCP?: number
  LCP?: number
  TTFB?: number
}

export {}
