import { useState, useCallback } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: Date
}

export interface UseChatOptions {
  initialMessages?: Message[]
  headers?: Record<string, string>
  body?: any
  onResponse?: (response: Response) => void
  onError?: (error: Error) => void
  onFinish?: (message: Message) => void
}

export interface UseChatReturn {
  messages: Message[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  error: Error | null
  setMessages: (messages: Message[]) => void
}

export function useCustomChat(options: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>(options.initialMessages || [])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      // 获取AI配置
      const aiConfigStr = options.headers?.['x-ai-config']
      const expertRole = options.headers?.['x-expert-role']
      
      if (!aiConfigStr) {
        throw new Error('AI配置未找到')
      }

      const aiConfig = JSON.parse(aiConfigStr)
      const modelConfig = aiConfig.chatModel

      if (!modelConfig?.name || !modelConfig?.baseUrl || !modelConfig?.apiKey) {
        throw new Error('AI模型配置不完整')
      }

      // 动态导入客户端
      const { OpenAICompatibleClient } = await import('@/lib/openai-client')
      const client = new OpenAICompatibleClient(modelConfig.baseUrl, modelConfig.apiKey)

      // 构建消息历史
      const chatMessages = messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // 构建系统提示词
      let systemPrompt = '你是一个专业的健康助手，请提供准确、有用的健康建议。'
      
      if (options.body?.systemPrompt) {
        systemPrompt = options.body.systemPrompt
      }

      // 添加健康数据到系统提示词
      if (options.body?.userProfile || options.body?.healthData) {
        systemPrompt += '\n\n用户信息：'
        if (options.body.userProfile) {
          systemPrompt += `\n用户资料：${JSON.stringify(options.body.userProfile, null, 2)}`
        }
        if (options.body.healthData) {
          systemPrompt += `\n今日健康数据：${JSON.stringify(options.body.healthData, null, 2)}`
        }
        if (options.body.recentHealthData) {
          systemPrompt += `\n近期健康数据：${JSON.stringify(options.body.recentHealthData, null, 2)}`
        }
      }

      // 添加AI记忆
      if (options.body?.aiMemory && expertRole) {
        const expertMemory = options.body.aiMemory[expertRole]
        if (expertMemory) {
          systemPrompt += `\n\n专家记忆：${JSON.stringify(expertMemory, null, 2)}`
        }
      }

      // 发送请求
      const response = await client.streamText({
        model: modelConfig.name,
        messages: chatMessages,
        system: systemPrompt
      })

      if (options.onResponse) {
        options.onResponse(response)
      }

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status} ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('响应体为空')
      }

      // 创建助手消息
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        createdAt: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // 处理流式响应
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
                break
              }
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  setMessages(prev => {
                    const newMessages = [...prev]
                    const lastMessage = newMessages[newMessages.length - 1]
                    if (lastMessage && lastMessage.role === 'assistant') {
                      lastMessage.content += content
                    }
                    return newMessages
                  })
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      // 获取最终的助手消息
      const finalMessages = messages.concat(userMessage)
      const finalAssistantMessage = finalMessages[finalMessages.length - 1]
      
      if (options.onFinish && finalAssistantMessage) {
        options.onFinish(finalAssistantMessage)
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('未知错误')
      setError(error)
      
      if (options.onError) {
        options.onError(error)
      }
      
      // 移除失败的消息
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, options])

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages
  }
}
