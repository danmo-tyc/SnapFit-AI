"use client"

import type React from "react"
import { Suspense, lazy } from "react"
import { useState, useEffect, useRef, use } from "react"
import { format } from "date-fns"


import { useToast } from "@/hooks/use-toast"
import type { DailyStatus } from "@/lib/types"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useIndexedDB } from "@/hooks/use-indexed-db"
import { useExportReminder } from "@/hooks/use-export-reminder"
import { useDateRecords } from "@/hooks/use-date-records"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslation } from "@/hooks/use-i18n"
import { useDashboardLogic } from "@/hooks/use-dashboard-logic"
import { useFormHandlers } from "@/hooks/use-form-handlers"



// 直接导入关键组件
import WeightActivitySection from "@/components/dashboard/WeightActivitySection"

// 懒加载组件以提升性能
const DashboardHeader = lazy(() => import("@/components/dashboard/DashboardHeader"))
const HealthDataInput = lazy(() => import("@/components/dashboard/HealthDataInput"))
const HealthDataDisplay = lazy(() => import("@/components/dashboard/HealthDataDisplay"))
const HealthSummarySection = lazy(() => import("@/components/dashboard/HealthSummarySection"))

// 加载状态组件
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="relative">
      <div className="w-8 h-8 rounded-full border-4 border-emerald-200 dark:border-emerald-800"></div>
      <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
    </div>
  </div>
)



export default function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
  const t = useTranslation('dashboard')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // 解包params Promise
  const resolvedParams = use(params)

  // 用户配置
  const [userProfile] = useLocalStorage("userProfile", {
    weight: 70,
    height: 170,
    age: 30,
    gender: "male",
    activityLevel: "moderate",
    goal: "maintain",
    bmrFormula: "mifflin-st-jeor" as "mifflin-st-jeor",
  })

  // 使用自定义Hook管理复杂逻辑
  const {
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
    uploadedImages,
    setUploadedImages,
    isCompressing,
    setIsCompressing,
    smartSuggestions,
    smartSuggestionsLoading,
    aiConfig,
    checkAIConfig,
    generateSmartSuggestions,
    recalculateSummary,
    getDailyLog,
    saveDailyLog,
  } = useDashboardLogic(selectedDate, userProfile)

  // 其他Hooks
  const { toast } = useToast()
  const { isLoading } = useIndexedDB("healthLogs")
  const exportReminder = useExportReminder()
  const { refreshRecords } = useDateRecords()
  const isMobile = useIsMobile()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 使用表单处理Hook
  const {
    handleImageUpload,
    handleRemoveImage,
    handleSubmit,
    handleDeleteEntry,
    handleUpdateEntry,
  } = useFormHandlers({
    uploadedImages,
    setUploadedImages,
    setIsCompressing,
    setIsProcessing,
    setInputText,
    dailyLog,
    setDailyLog,
    userProfile,
    aiConfig,
    activeTab,
    inputText,
    checkAIConfig: () => checkAIConfig(toast),
    recalculateSummary,
    saveDailyLog,
    setChartRefreshTrigger,
    refreshRecords,
    toast,
  })

  // 当选择的日期变化时，加载对应日期的数据
  useEffect(() => {
    const dateKey = format(selectedDate, "yyyy-MM-dd")
    getDailyLog(dateKey).then((data) => {
      console.log("从IndexedDB读取到的数据：", data)
      const defaultActivity = userProfile.activityLevel || "moderate"
      if (data) {
        setDailyLog(data)
        setCurrentDayWeight(data.weight ? data.weight.toString() : "")
        setCurrentDayActivityLevelForSelect(data.activityLevel || defaultActivity)
      } else {
        setDailyLog({
          date: dateKey,
          foodEntries: [],
          exerciseEntries: [],
          summary: {
            totalCaloriesConsumed: 0,
            totalCaloriesBurned: 0,
            macros: { carbs: 0, protein: 0, fat: 0 },
            micronutrients: {},
          },
          activityLevel: defaultActivity,
        })
        setCurrentDayWeight("")
        setCurrentDayActivityLevelForSelect(defaultActivity)
      }
    })
  }, [selectedDate, getDailyLog, userProfile.activityLevel, setDailyLog, setCurrentDayWeight, setCurrentDayActivityLevelForSelect])

  // 辅助 useEffect 来监控 dailyLog 状态的变化
  // useEffect(() => {
  //   console.log("[State Monitor] dailyLog state has changed to:", JSON.parse(JSON.stringify(dailyLog)));
  // }, [dailyLog]);

  // TEF分析逻辑已移至useDashboardLogic Hook中

  // 智能建议和BMR/TDEE计算逻辑已移至useDashboardLogic Hook中

  // 处理每日活动水平变化
  const handleDailyActivityLevelChange = (newValue: string) => {
    setCurrentDayActivityLevelForSelect(newValue);
    setDailyLog(prevLog => ({
      ...prevLog,
      activityLevel: newValue,
    }));
    // 触发图表刷新（因为活动水平影响TDEE计算）
    setChartRefreshTrigger(prev => prev + 1);
  };

  // 图片上传和表单处理逻辑已移至useFormHandlers Hook中

  // 表单处理逻辑已移至useFormHandlers Hook中

  const handleSaveDailyWeight = () => {
    const dateKey = format(selectedDate, "yyyy-MM-dd")
    if (!currentDayWeight.trim()) {
      const updatedLog = { ...dailyLog }
      delete updatedLog.weight
      setDailyLog(updatedLog)
      saveDailyLog(dateKey, updatedLog)
      // 刷新日期记录状态
      refreshRecords()
      toast({
        title: "体重已清除",
        description: `已清除 ${dateKey} 的体重记录`
      })
      return
    }

    const weightValue = parseFloat(currentDayWeight)
    if (isNaN(weightValue) || weightValue <= 0) {
      toast({
        title: "体重输入无效",
        description: "请输入有效的体重数值",
        variant: "destructive"
      })
      return
    }

    const updatedLog = { ...dailyLog, weight: weightValue }
    setDailyLog(updatedLog)
    saveDailyLog(dateKey, updatedLog)
    // 触发图表刷新
    setChartRefreshTrigger(prev => prev + 1)
    // 刷新日期记录状态
    refreshRecords()
    toast({
      title: "体重已保存",
      description: `已保存 ${dateKey} 的体重记录: ${weightValue}kg`
    })
  }

  // 处理每日状态保存
  const handleSaveDailyStatus = (status: DailyStatus) => {
    const dateKey = format(selectedDate, "yyyy-MM-dd")
    const updatedLog = { ...dailyLog, dailyStatus: status }
    setDailyLog(updatedLog)
    saveDailyLog(dateKey, updatedLog)
    // 刷新日期记录状态
    refreshRecords()
    toast({
      title: "每日状态已保存",
      description: `已保存 ${dateKey} 的状态记录`
    })
  }

  return (
    <div className="min-h-screen relative bg-white dark:bg-slate-900">
      {/* 弥散绿色背景效果 - 带动画 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 top-20 w-96 h-96 bg-emerald-300/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -right-40 top-40 w-80 h-80 bg-emerald-400/35 rounded-full blur-3xl animate-bounce-slow"></div>
        <div className="absolute left-20 bottom-20 w-72 h-72 bg-emerald-200/45 rounded-full blur-3xl animate-breathing"></div>
        <div className="absolute right-32 bottom-40 w-64 h-64 bg-emerald-300/40 rounded-full blur-3xl animate-float"></div>
        <div className="absolute left-1/2 top-1/3 w-56 h-56 bg-emerald-200/30 rounded-full blur-3xl transform -translate-x-1/2 animate-glow"></div>
      </div>

      <style jsx>{`
        @keyframes breathing {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.45;
          }
          50% {
            transform: scale(1.1) rotate(2deg);
            opacity: 0.25;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
          }
          33% {
            transform: translateY(-10px) translateX(5px) scale(1.05);
          }
          66% {
            transform: translateY(5px) translateX(-3px) scale(0.98);
          }
        }

        @keyframes glow {
          0%, 100% {
            transform: translateX(-50%) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateX(-50%) scale(1.2);
            opacity: 0.15;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.35;
          }
          50% {
            transform: translateY(-15px) scale(1.08);
            opacity: 0.50;
          }
        }

        .animate-breathing {
          animation: breathing 6s ease-in-out infinite;
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 5s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 7s ease-in-out infinite;
        }
      `}</style>

      <div className="relative z-10 container mx-auto py-12 px-6 sm:px-8 lg:px-12 max-w-6xl">
        {/* 懒加载的组件 */}
        <Suspense fallback={<LoadingSpinner />}>
          <DashboardHeader
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            locale={resolvedParams.locale}
            exportReminder={exportReminder}
            chartRefreshTrigger={chartRefreshTrigger}
          />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
            {/* 图表区域已在DashboardHeader中 */}
          </div>
          <WeightActivitySection
            currentDayWeight={currentDayWeight}
            onWeightChange={setCurrentDayWeight}
            onSaveWeight={handleSaveDailyWeight}
            currentDayActivityLevel={currentDayActivityLevelForSelect}
            onActivityLevelChange={handleDailyActivityLevelChange}
            isProcessing={isProcessing}
          />
        </div>

        <Suspense fallback={<LoadingSpinner />}>
          <HealthDataInput
            activeTab={activeTab}
            onTabChange={setActiveTab}
            inputText={inputText}
            onInputChange={setInputText}
            uploadedImages={uploadedImages}
            onImageUpload={handleImageUpload}
            onRemoveImage={handleRemoveImage}
            onSubmit={handleSubmit}
            onSaveDailyStatus={handleSaveDailyStatus}
            selectedDate={selectedDate}
            dailyStatus={dailyLog.dailyStatus}
            isProcessing={isProcessing}
            isCompressing={isCompressing}
            fileInputRef={fileInputRef}
            isMobile={isMobile}
            dailyLog={dailyLog}
          />
        </Suspense>

        {isLoading && (
          <div className="text-center py-12 fade-in">
            <LoadingSpinner />
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium mt-4">{t('loading.dataLoading')}</p>
          </div>
        )}

        <div className="space-y-8">
          <Suspense fallback={<LoadingSpinner />}>
            <HealthDataDisplay
              foodEntries={dailyLog.foodEntries}
              exerciseEntries={dailyLog.exerciseEntries}
              onDeleteEntry={handleDeleteEntry}
              onUpdateEntry={handleUpdateEntry}
            />
          </Suspense>

          <Suspense fallback={<LoadingSpinner />}>
            <HealthSummarySection
              summary={dailyLog.summary}
              calculatedBMR={dailyLog.calculatedBMR}
              calculatedTDEE={dailyLog.calculatedTDEE}
              tefAnalysis={dailyLog.tefAnalysis}
              tefAnalysisCountdown={tefAnalysisCountdown}
              selectedDate={selectedDate}
              smartSuggestions={smartSuggestions[dailyLog.date]}
              smartSuggestionsLoading={smartSuggestionsLoading}
              onRefreshSuggestions={() => generateSmartSuggestions(dailyLog.date)}
              currentDate={dailyLog.date}
            />
          </Suspense>
        </div>

        {/* 免责声明 */}
        <div className="mt-8 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-4xl mx-auto">
              本应用基于AI技术，仅为您提供健康管理参考。请注意：AI分析可能存在偏差，特别是营养数据方面。您的健康很重要，在做出重要的饮食或运动决策前，建议咨询专业的医生、营养师或健身教练。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
