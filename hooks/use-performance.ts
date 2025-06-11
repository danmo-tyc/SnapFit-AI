"use client"

import { useEffect, useRef, useState } from "react"

interface PerformanceMetrics {
  renderTime: number
  componentMountTime: number
  memoryUsage?: number
  isSlowRender: boolean
}

interface UsePerformanceOptions {
  threshold?: number // 慢渲染阈值（毫秒）
  enableMemoryTracking?: boolean
  logToConsole?: boolean
}

export function usePerformance(
  componentName: string,
  options: UsePerformanceOptions = {}
) {
  const {
    threshold = 16, // 60fps = 16.67ms per frame
    enableMemoryTracking = false,
    logToConsole = process.env.NODE_ENV === 'development'
  } = options

  const mountTimeRef = useRef<number>(Date.now())
  const renderStartRef = useRef<number>(Date.now())
  const renderCountRef = useRef<number>(0)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentMountTime: 0,
    isSlowRender: false
  })

  // 记录组件挂载时间
  useEffect(() => {
    const mountTime = Date.now() - mountTimeRef.current
    setMetrics(prev => ({
      ...prev,
      componentMountTime: mountTime
    }))

    if (logToConsole) {
      console.log(`[Performance] ${componentName} mounted in ${mountTime}ms`)
    }
  }, [componentName, logToConsole])

  // 记录每次渲染性能
  useEffect(() => {
    const renderStart = renderStartRef.current
    const renderEnd = Date.now()
    const renderTime = renderEnd - renderStart
    const isSlowRender = renderTime > threshold

    renderCountRef.current += 1

    setMetrics(prev => ({
      ...prev,
      renderTime,
      isSlowRender,
      memoryUsage: enableMemoryTracking ? getMemoryUsage() : undefined
    }))

    if (logToConsole) {
      const logLevel = isSlowRender ? 'warn' : 'log'
      console[logLevel](
        `[Performance] ${componentName} render #${renderCountRef.current}: ${renderTime}ms${
          isSlowRender ? ' (SLOW)' : ''
        }`
      )

      if (enableMemoryTracking) {
        const memory = getMemoryUsage()
        if (memory) {
          console.log(`[Performance] ${componentName} memory usage: ${memory.toFixed(2)}MB`)
        }
      }
    }

    // 更新下次渲染的开始时间
    renderStartRef.current = Date.now()
  })

  return metrics
}

// 获取内存使用情况（仅在支持的浏览器中）
function getMemoryUsage(): number | undefined {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
    const memory = (window.performance as any).memory
    return memory.usedJSHeapSize / 1024 / 1024 // 转换为MB
  }
  return undefined
}

// 性能监控装饰器
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  options?: UsePerformanceOptions
) {
  const WrappedComponent = (props: P) => {
    const componentName = Component.displayName || Component.name || 'Unknown'
    const metrics = usePerformance(componentName, options)

    // 在开发模式下，将性能指标添加到组件的 data 属性中
    if (process.env.NODE_ENV === 'development') {
      return (
        <div
          data-component={componentName}
          data-render-time={metrics.renderTime}
          data-is-slow={metrics.isSlowRender}
          data-memory-usage={metrics.memoryUsage}
        >
          <Component {...props} />
        </div>
      )
    }

    return <Component {...props} />
  }

  WrappedComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name})`
  return WrappedComponent
}

// 性能报告Hook
export function usePerformanceReport() {
  const [reports, setReports] = useState<Array<{
    component: string
    timestamp: number
    metrics: PerformanceMetrics
  }>>([])

  const addReport = (component: string, metrics: PerformanceMetrics) => {
    setReports(prev => [
      ...prev.slice(-99), // 保留最近100条记录
      {
        component,
        timestamp: Date.now(),
        metrics
      }
    ])
  }

  const getSlowComponents = (threshold = 16) => {
    return reports.filter(report => report.metrics.renderTime > threshold)
  }

  const getAverageRenderTime = (component?: string) => {
    const filteredReports = component 
      ? reports.filter(r => r.component === component)
      : reports

    if (filteredReports.length === 0) return 0

    const totalTime = filteredReports.reduce((sum, report) => sum + report.metrics.renderTime, 0)
    return totalTime / filteredReports.length
  }

  const clearReports = () => setReports([])

  return {
    reports,
    addReport,
    getSlowComponents,
    getAverageRenderTime,
    clearReports
  }
}

// Web Vitals 监控
export function useWebVitals() {
  const [vitals, setVitals] = useState<{
    CLS?: number
    FID?: number
    FCP?: number
    LCP?: number
    TTFB?: number
  }>({})

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 动态导入 web-vitals 库
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => setVitals(prev => ({ ...prev, CLS: metric.value })))
      getFID((metric) => setVitals(prev => ({ ...prev, FID: metric.value })))
      getFCP((metric) => setVitals(prev => ({ ...prev, FCP: metric.value })))
      getLCP((metric) => setVitals(prev => ({ ...prev, LCP: metric.value })))
      getTTFB((metric) => setVitals(prev => ({ ...prev, TTFB: metric.value })))
    }).catch(error => {
      console.warn('Failed to load web-vitals:', error)
    })
  }, [])

  return vitals
}
