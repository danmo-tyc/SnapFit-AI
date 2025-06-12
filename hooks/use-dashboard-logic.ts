"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useIndexedDB } from "@/hooks/use-indexed-db"
import { calculateMetabolicRates } from "@/lib/health-utils"
import { generateTEFAnalysis } from "@/lib/tef-utils"
import { tefCacheManager } from "@/lib/tef-cache"
import { compressImage } from "@/lib/image-utils"
import type { 
  DailyLog, 
  AIConfig, 
  FoodEntry, 
  ExerciseEntry, 
  DailyStatus,
  SmartSuggestionsResponse 
} from "@/lib/types"

interface ImagePreview {
  file: File
  url: string
  compressedFile?: File
}

export function useDashboardLogic(selectedDate: Date, userProfile: any) {
  const { getData: getDailyLog, saveData: saveDailyLog } = useIndexedDB("healthLogs")

  // 状态管理
  const [dailyLog, setDailyLog] = useState<DailyLog>(() => ({
    date: format(selectedDate, "yyyy-MM-dd"),
    foodEntries: [],
    exerciseEntries: [],
    summary: {
      totalCaloriesConsumed: 0,
      totalCaloriesBurned: 0,
      macros: { carbs: 0, protein: 0, fat: 0 },
      micronutrients: {},
    },
    weight: undefined,
    activityLevel: userProfile.activityLevel || "moderate",
    calculatedBMR: undefined,
    calculatedTDEE: undefined,
  }))

  const [inputText, setInputText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("food")
  const [currentDayWeight, setCurrentDayWeight] = useState<string>("")
  const [currentDayActivityLevelForSelect, setCurrentDayActivityLevelForSelect] = useState<string>("")
  const [chartRefreshTrigger, setChartRefreshTrigger] = useState<number>(0)
  const [tefAnalysisCountdown, setTEFAnalysisCountdown] = useState(0)
  const [smartSuggestionsLoading, setSmartSuggestionsLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<ImagePreview[]>([])
  const [isCompressing, setIsCompressing] = useState(false)

  // AI配置
  const [aiConfig] = useLocalStorage<AIConfig>("aiConfig", {
    agentModel: {
      name: "gpt-4o",
      baseUrl: "https://api.openai.com",
      apiKey: "",
    },
    chatModel: {
      name: "gpt-4o",
      baseUrl: "https://api.openai.com",
      apiKey: "",
    },
    visionModel: {
      name: "gpt-4o",
      baseUrl: "https://api.openai.com",
      apiKey: "",
    },
  })

  // 智能建议存储
  const [smartSuggestions, setSmartSuggestions] = useLocalStorage<Record<string, SmartSuggestionsResponse>>('smartSuggestions', {})

  // TEF 分析相关
  const tefAnalysisTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousFoodEntriesHashRef = useRef<string>('')

  // 检查AI配置
  const checkAIConfig = (toastFn?: any) => {
    const modelType = uploadedImages.length > 0 ? "visionModel" : "agentModel"
    const modelConfig = aiConfig[modelType]

    if (!modelConfig.name || !modelConfig.baseUrl || !modelConfig.apiKey) {
      if (toastFn) {
        toastFn({
          title: "AI配置不完整",
          description: "请先配置AI模型",
          variant: "destructive",
        })
      }
      return false
    }
    return true
  }

  // TEF分析功能
  const performTEFAnalysis = async (foodEntries: FoodEntry[]) => {
    if (!foodEntries.length || !checkAIConfig()) return null

    try {
      // 直接使用客户端调用
      const { OpenAICompatibleClient } = await import("@/lib/openai-client")
      const modelConfig = aiConfig.agentModel
      const client = new OpenAICompatibleClient(modelConfig.baseUrl, modelConfig.apiKey)

      const prompt = `分析以下食物的热效应(TEF)增强因子。

食物列表：
${JSON.stringify(foodEntries, null, 2)}

请分析这些食物的TEF增强因子，考虑以下因素：
1. 蛋白质含量（高蛋白食物TEF更高）
2. 食物加工程度（未加工食物TEF更高）
3. 辛辣程度（辛辣食物可能增加TEF）
4. 咖啡因含量（含咖啡因食物可能增加TEF）

请返回一个1.0-1.3之间的增强乘数，以及增强因素列表。

请以JSON格式返回：
{
  "enhancementMultiplier": 1.1,
  "enhancementFactors": ["高蛋白食物", "未加工食物"],
  "analysisTimestamp": "${new Date().toISOString()}"
}`

      const response = await client.generateText({
        model: modelConfig.name,
        prompt,
        response_format: { type: "json_object" },
      })

      return JSON.parse(response.text)
    } catch (error) {
      console.warn("TEF analysis error:", error)
      // 返回默认值
      return {
        enhancementMultiplier: 1.0,
        enhancementFactors: [],
        analysisTimestamp: new Date().toISOString()
      }
    }
  }

  // 智能建议生成
  const generateSmartSuggestions = async (targetDate?: string) => {
    if (!checkAIConfig()) return

    const analysisDate = targetDate || dailyLog.date
    const targetLog = targetDate ? await getDailyLog(targetDate) : dailyLog

    if (!targetLog || targetLog.foodEntries.length === 0) {
      console.warn("No data available for smart suggestions on", analysisDate)
      return
    }

    setSmartSuggestionsLoading(true)
    try {
      // 获取目标日期前7天的数据
      const recentLogs = []
      const targetDateObj = new Date(analysisDate)
      for (let i = 0; i < 7; i++) {
        const date = new Date(targetDateObj)
        date.setDate(date.getDate() - i)
        const dateKey = date.toISOString().split('T')[0]
        const log = await getDailyLog(dateKey)
        if (log && log.foodEntries.length > 0) {
          recentLogs.push(log)
        }
      }

      // 直接使用客户端调用
      const { OpenAICompatibleClient } = await import("@/lib/openai-client")
      const modelConfig = aiConfig.agentModel
      const client = new OpenAICompatibleClient(modelConfig.baseUrl, modelConfig.apiKey)

      // 构建智能建议的提示词
      const prompt = `基于用户的健康数据，提供个性化的营养和健康建议。

用户资料：
${JSON.stringify(userProfile, null, 2)}

今日数据：
${JSON.stringify(targetLog, null, 2)}

近期数据（最近7天）：
${JSON.stringify(recentLogs, null, 2)}

请提供以下方面的建议：
1. 营养摄入建议
2. 运动建议
3. 生活方式建议
4. 健康风险提醒

请以简洁、实用的方式回答，每个建议不超过100字。`

      const response = await client.generateText({
        model: modelConfig.name,
        prompt,
      })

      if (!response.text) {
        console.warn("Smart suggestions failed: empty response")
        return
      }

      // 构建建议响应格式
      const suggestions = {
        nutritionAdvice: response.text.substring(0, 500), // 截取前500字符作为营养建议
        exerciseAdvice: "基于您的数据，建议适量运动以保持健康。",
        lifestyleAdvice: "保持规律作息，充足睡眠对健康很重要。",
        healthRisks: "请注意均衡饮食，避免营养不良。"
      }

      // 保存到localStorage
      const newSuggestions = { ...smartSuggestions }
      newSuggestions[analysisDate] = suggestions as SmartSuggestionsResponse
      setSmartSuggestions(newSuggestions)

    } catch (error) {
      console.warn("Smart suggestions error:", error)
    } finally {
      setSmartSuggestionsLoading(false)
    }
  }

  // 重新计算摘要
  const recalculateSummary = (log: DailyLog) => {
    let totalCaloriesConsumed = 0
    let totalCarbs = 0
    let totalProtein = 0
    let totalFat = 0
    let totalCaloriesBurned = 0
    const micronutrients: Record<string, number> = {}

    log.foodEntries.forEach((entry) => {
      if (entry.total_nutritional_info_consumed) {
        totalCaloriesConsumed += entry.total_nutritional_info_consumed.calories || 0
        totalCarbs += entry.total_nutritional_info_consumed.carbohydrates || 0
        totalProtein += entry.total_nutritional_info_consumed.protein || 0
        totalFat += entry.total_nutritional_info_consumed.fat || 0
        Object.entries(entry.total_nutritional_info_consumed).forEach(([key, value]) => {
          if (!["calories", "carbohydrates", "protein", "fat"].includes(key) && typeof value === "number") {
            micronutrients[key] = (micronutrients[key] || 0) + value
          }
        })
      }
    })

    log.exerciseEntries.forEach((entry) => {
      totalCaloriesBurned += entry.calories_burned_estimated || 0
    })

    log.summary = {
      totalCaloriesConsumed,
      totalCaloriesBurned,
      macros: { carbs: totalCarbs, protein: totalProtein, fat: totalFat },
      micronutrients,
    }
  }

  // TEF分析逻辑
  useEffect(() => {
    const currentHash = tefCacheManager.generateFoodEntriesHash(dailyLog.foodEntries);

    // 检查是否已有缓存的分析结果
    const cachedAnalysis = tefCacheManager.getCachedAnalysis(dailyLog.foodEntries);
    if (cachedAnalysis && dailyLog.foodEntries.length > 0) {
      // 使用缓存的分析结果
      if (!dailyLog.tefAnalysis || JSON.stringify(dailyLog.tefAnalysis) !== JSON.stringify(cachedAnalysis)) {
        console.log('Applying cached TEF analysis');
        setDailyLog(currentLog => {
          const updatedLog = {
            ...currentLog,
            tefAnalysis: cachedAnalysis
          };
          saveDailyLog(updatedLog.date, updatedLog);
          return updatedLog;
        });
      }
      previousFoodEntriesHashRef.current = currentHash;
      return;
    }

    // 检查是否需要重新分析
    if (!tefCacheManager.shouldAnalyzeTEF(dailyLog.foodEntries, previousFoodEntriesHashRef.current)) {
      return;
    }

    // 更新哈希引用
    previousFoodEntriesHashRef.current = currentHash;

    console.log('Food entries changed significantly, starting TEF analysis countdown...');

    // 清除之前的定时器
    if (tefAnalysisTimeoutRef.current) {
      clearTimeout(tefAnalysisTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // 只有当有食物条目时才设置分析
    if (dailyLog.foodEntries.length > 0) {
      // 开始倒计时
      setTEFAnalysisCountdown(15);

      // 每秒更新倒计时
      countdownIntervalRef.current = setInterval(() => {
        setTEFAnalysisCountdown(prev => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 设置15秒的防抖延迟
      tefAnalysisTimeoutRef.current = setTimeout(() => {
        console.log('Starting TEF analysis after 15 seconds delay...');
        setTEFAnalysisCountdown(0);
        performTEFAnalysis(dailyLog.foodEntries).then(tefResult => {
          if (tefResult) {
            // 使用本地工具计算基础TEF，并结合AI分析的乘数和因素
            const localTEFAnalysis = generateTEFAnalysis(
              dailyLog.foodEntries,
              tefResult.enhancementMultiplier
            );

            const finalAnalysis = {
              ...localTEFAnalysis,
              // 使用AI分析的因素，如果AI没有提供则使用本地识别的
              enhancementFactors: tefResult.enhancementFactors && tefResult.enhancementFactors.length > 0
                ? tefResult.enhancementFactors
                : localTEFAnalysis.enhancementFactors,
              analysisTimestamp: tefResult.analysisTimestamp || localTEFAnalysis.analysisTimestamp,
            };

            // 缓存分析结果
            tefCacheManager.setCachedAnalysis(dailyLog.foodEntries, finalAnalysis);

            console.log('AI enhancementFactors:', tefResult.enhancementFactors);
            console.log('Local enhancementFactors:', localTEFAnalysis.enhancementFactors);

            setDailyLog(currentLog => {
              const updatedLog = {
                ...currentLog,
                tefAnalysis: finalAnalysis
              };
              saveDailyLog(updatedLog.date, updatedLog);
              return updatedLog;
            });
          }
        }).catch(error => {
          console.warn('TEF analysis failed:', error);
        });
      }, 15000); // 15秒
    } else {
      // 如果没有食物条目，清除TEF分析和倒计时
      setTEFAnalysisCountdown(0);
      if (dailyLog.tefAnalysis) {
        setDailyLog(currentLog => {
          const updatedLog = { ...currentLog, tefAnalysis: undefined };
          saveDailyLog(updatedLog.date, updatedLog);
          return updatedLog;
        });
      }
    }

    // 清理函数
    return () => {
      if (tefAnalysisTimeoutRef.current) {
        clearTimeout(tefAnalysisTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [dailyLog.foodEntries, aiConfig, saveDailyLog]);

  // BMR/TDEE计算逻辑
  useEffect(() => {
    if (userProfile && dailyLog.date) {
      // 计算额外的TEF增强
      const additionalTEF = dailyLog.tefAnalysis
        ? dailyLog.tefAnalysis.enhancedTEF - dailyLog.tefAnalysis.baseTEF
        : undefined;

      const rates = calculateMetabolicRates(userProfile, {
        weight: dailyLog.weight,
        activityLevel: dailyLog.activityLevel,
        additionalTEF
      })

      const newBmr = rates?.bmr;
      const newTdee = rates?.tdee;

      if (
        dailyLog.calculatedBMR !== newBmr ||
        dailyLog.calculatedTDEE !== newTdee ||
        (rates && !dailyLog.calculatedBMR && !dailyLog.calculatedTDEE)
      ) {
        setDailyLog(currentLogState => {
          const updatedLogWithNewRates = {
            ...currentLogState,
            calculatedBMR: newBmr,
            calculatedTDEE: newTdee,
          };
          // 只有在实际值发生变化时才保存，避免不必要的写入
          if (currentLogState.calculatedBMR !== newBmr || currentLogState.calculatedTDEE !== newTdee || (rates && (!currentLogState.calculatedBMR || !currentLogState.calculatedTDEE))){
            saveDailyLog(updatedLogWithNewRates.date, updatedLogWithNewRates);
          }
          return updatedLogWithNewRates;
        });
      }
    }
  }, [userProfile, dailyLog.date, dailyLog.weight, dailyLog.activityLevel, dailyLog.tefAnalysis, saveDailyLog, dailyLog.calculatedBMR, dailyLog.calculatedTDEE]);

  return {
    // 状态
    dailyLog,
    setDailyLog,
    inputText,
    setInputText,
    isProcessing,
    setIsProcessing,
    activeTab,
    setActiveTab,
    currentDayWeight,
    setCurrentDayWeight,
    currentDayActivityLevelForSelect,
    setCurrentDayActivityLevelForSelect,
    chartRefreshTrigger,
    setChartRefreshTrigger,
    tefAnalysisCountdown,
    setTEFAnalysisCountdown,
    smartSuggestionsLoading,
    setSmartSuggestionsLoading,
    uploadedImages,
    setUploadedImages,
    isCompressing,
    setIsCompressing,
    smartSuggestions,
    setSmartSuggestions,
    aiConfig,

    // 方法
    checkAIConfig,
    performTEFAnalysis,
    generateSmartSuggestions,
    recalculateSummary,
    getDailyLog,
    saveDailyLog,

    // Refs
    tefAnalysisTimeoutRef,
    countdownIntervalRef,
    previousFoodEntriesHashRef,
  }
}
