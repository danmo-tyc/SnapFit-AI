"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { cn } from "@/lib/utils"
import type { DailyLog, AIConfig } from "@/lib/types"

interface AgentAdviceProps {
  dailyLog: DailyLog
  userProfile: any
  aiConfig: AIConfig
}

const defaultAIConfigFromParent: AIConfig = {
  agentModel: { name: "gpt-4o", baseUrl: "https://api.openai.com", apiKey: "" },
  chatModel: { name: "gpt-4o", baseUrl: "https://api.openai.com", apiKey: "" },
  visionModel: { name: "gpt-4o", baseUrl: "https://api.openai.com", apiKey: "" },
};

export function AgentAdvice({ dailyLog, userProfile, aiConfig }: AgentAdviceProps) {
  const [advice, setAdvice] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const { toast } = useToast()
  const abortControllerRef = useRef<AbortController | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const isAiReady = useMemo(() => {
    const configToUse = isClient ? aiConfig : defaultAIConfigFromParent
    const model = configToUse.agentModel
    return !!(model && model.name && model.baseUrl && model.apiKey)
  }, [isClient, aiConfig])

  const fetchAdvice = useCallback(async () => {
    if (!isAiReady) {
      setAdvice("请先在设置页面配置 AI 模型以获取个性化建议。")
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setIsStreaming(true)
    setAdvice("")

    try {
      // 直接使用客户端调用
      const { OpenAICompatibleClient } = await import("@/lib/openai-client")
      const modelConfig = aiConfig.agentModel
      const client = new OpenAICompatibleClient(modelConfig.baseUrl, modelConfig.apiKey)

      // 构建建议提示词
      const prompt = `作为专业的健康顾问，基于用户的健康数据提供个性化建议。

用户资料：
${JSON.stringify(userProfile, null, 2)}

今日健康数据：
${JSON.stringify(dailyLog, null, 2)}

请提供以下方面的专业建议：
1. 营养摄入分析和建议
2. 运动计划建议
3. 生活方式改善建议
4. 健康风险评估和预防

请用温和、专业的语气，提供具体可行的建议。每个建议都要有科学依据。`

      // 使用流式响应
      const response = await client.streamText({
        model: modelConfig.name,
        messages: [{ role: "user", content: prompt }],
      })

      if (!response.ok) {
        throw new Error(`获取建议失败: ${response.statusText || response.status}`)
      }
      if (!response.body) {
        throw new Error("响应体为空")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })

          // 解析SSE格式的数据
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                setIsStreaming(false)
                return
              }
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  setAdvice((prev) => prev + content)
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
        setIsStreaming(false)
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return
      }
      
      toast({
        title: "获取建议失败",
        description: error instanceof Error ? error.message : "无法获取个性化建议，请稍后重试",
        variant: "destructive",
      })
      setAdvice("基于您的健康数据，建议均衡饮食并保持适当运动。请记录更多数据以获取更精准的建议。")
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }, [isAiReady, aiConfig, dailyLog, userProfile, toast])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return (
    <div className="health-card h-full flex flex-col">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">智能建议</h3>
              <p className="text-muted-foreground text-lg">基于您的健康数据生成的个性化建议</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={fetchAdvice}
            disabled={!isAiReady || isLoading}
            className={cn("h-12 px-6", isLoading && "animate-spin")}
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            {isLoading ? "生成中..." : "获取建议"}
          </Button>
        </div>
        <div className="flex-grow">
          {isLoading && !advice ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">正在生成个性化建议...</p>
            </div>
          ) : advice ? (
            <div className="space-y-4">
              <MarkdownRenderer content={advice} className="text-base" />
              {isStreaming && (
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">AI正在思考...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">
                {isAiReady
                  ? "点击获取建议按钮，AI 将为您提供个性化的健康建议"
                  : "请先在设置页面配置 AI 模型以获取个性化建议"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
