import { useState, useEffect } from "react"
import type { SmartSuggestionsResponse } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTranslation } from "@/hooks/use-i18n"
import { 
  Brain, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react"

interface SmartSuggestionsProps {
  suggestions?: SmartSuggestionsResponse
  isLoading?: boolean
  onRefresh?: () => void
  currentDate?: string
}

export function SmartSuggestions({ suggestions, isLoading, onRefresh, currentDate }: SmartSuggestionsProps) {
  const t = useTranslation('dashboard.suggestions')
  const tChatSuggestions = useTranslation('chat.suggestions')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isClient, setIsClient] = useState(false)

  // 类别名称映射：中文 -> 英文键
  const categoryKeyMap: Record<string, string> = {
    "营养配比优化": "nutritionOptimization",
    "运动处方优化": "exerciseOptimization",
    "代谢效率提升": "metabolismEnhancement",
    "代谢调节优化": "metabolismEnhancement", // 别名映射
    "行为习惯优化": "behaviorOptimization",
    "时机优化策略": "timingOptimization"
  }

  // 获取翻译后的类别名称
  const getCategoryDisplayName = (categoryName: string) => {
    // 首先尝试映射到英文键
    const keyName = categoryKeyMap[categoryName]

    if (keyName) {
      try {
        const translated = tChatSuggestions(`categories.${keyName}`)
        if (translated && translated !== `categories.${keyName}`) {
          return translated
        }
      } catch (error) {
        // 翻译失败，继续尝试其他方法
      }
    }

    // 如果映射失败，尝试直接使用原始名称作为键
    try {
      const directTranslated = tChatSuggestions(`categories.${categoryName}`)
      if (directTranslated && directTranslated !== `categories.${categoryName}`) {
        return directTranslated
      }
    } catch (error) {
      // 直接翻译也失败
    }

    // 最后返回原始名称
    return categoryName
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  const toggleCategory = (key: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedCategories(newExpanded)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-3 w-3" />
      case 'medium': return <Clock className="h-3 w-3" />
      case 'low': return <CheckCircle2 className="h-3 w-3" />
      default: return null
    }
  }

  // 在客户端渲染之前显示简化版本
  if (!isClient) {
    return (
      <Card className="health-card h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5 text-primary" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t('loading')}</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="health-card h-full flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5 text-primary" />
            {t('title')}
            <div className="ml-auto">
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex-1">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-4 w-4 bg-gray-200 rounded dark:bg-gray-700"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded dark:bg-gray-700"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded dark:bg-gray-700"></div>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded dark:bg-gray-700 mb-1"></div>
                <div className="h-3 w-3/4 bg-gray-200 rounded dark:bg-gray-700"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!suggestions || !suggestions.suggestions.length) {
    return (
      <Card className="health-card h-full flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5 text-primary" />
            {t('title')}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex-1 flex flex-col items-center justify-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('noSuggestions')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('addMoreData')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="health-card h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-primary" />
          {t('title')}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="ml-auto"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('description')}
          {currentDate && (
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {new Date(currentDate).toLocaleDateString('zh-CN')}
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col">
        <div className="space-y-2 flex-1 overflow-y-auto">
          {suggestions.suggestions.map((category) => (
            <Collapsible
              key={category.key}
              open={expandedCategories.has(category.key)}
              onOpenChange={() => toggleCategory(category.key)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-2 h-auto hover:bg-muted/50 text-left"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="text-base flex-shrink-0">
                      {category.suggestions[0]?.icon || '💡'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">
                        {getCategoryDisplayName(category.category)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {category.summary}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <Badge className={`${getPriorityColor(category.priority)} text-xs px-1 py-0`}>
                      {getPriorityIcon(category.priority)}
                      <span className="ml-1 capitalize">{category.priority}</span>
                    </Badge>
                    {expandedCategories.has(category.key) ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-2 pb-2">
                <div className="space-y-1 mt-1">
                  {category.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-primary/20 pl-2 py-1 bg-muted/30 rounded-r text-sm"
                    >
                      <div className="flex items-start space-x-1">
                        <span className="text-xs flex-shrink-0">{suggestion.icon}</span>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-xs">{suggestion.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {suggestion.description}
                          </p>
                          {suggestion.actionable && (
                            <Badge variant="outline" className="mt-1 text-xs px-1 py-0">
                              {tChatSuggestions('actionable')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {suggestions.generatedAt && (
          <div className="mt-3 pt-2 border-t text-xs text-muted-foreground text-center">
            生成时间: {new Date(suggestions.generatedAt).toLocaleString('zh-CN')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
