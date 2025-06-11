"use client"

import { useState } from "react"
import { compressImage } from "@/lib/image-utils"
import type { FoodEntry, ExerciseEntry, DailyLog, AIConfig } from "@/lib/types"

interface ImagePreview {
  file: File
  url: string
  compressedFile?: File
}

interface UseFormHandlersProps {
  uploadedImages: ImagePreview[]
  setUploadedImages: (images: ImagePreview[] | ((prev: ImagePreview[]) => ImagePreview[])) => void
  setIsCompressing: (loading: boolean) => void
  setIsProcessing: (processing: boolean) => void
  setInputText: (text: string) => void
  dailyLog: DailyLog
  setDailyLog: (log: DailyLog) => void
  userProfile: any
  aiConfig: AIConfig
  activeTab: string
  inputText: string
  checkAIConfig: () => boolean
  recalculateSummary: (log: DailyLog) => void
  saveDailyLog: (date: string, log: DailyLog) => void
  setChartRefreshTrigger: (trigger: number | ((prev: number) => number)) => void
  refreshRecords: () => void
  toast: any
}

export function useFormHandlers({
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
  checkAIConfig,
  recalculateSummary,
  saveDailyLog,
  setChartRefreshTrigger,
  refreshRecords,
  toast,
}: UseFormHandlersProps) {

  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (uploadedImages.length + files.length > 5) {
      toast({
        title: "图片数量超限",
        description: "最多只能上传5张图片",
        variant: "destructive",
      })
      return
    }

    setIsCompressing(true)

    try {
      const newImages: ImagePreview[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!file.type.startsWith("image/")) {
          toast({
            title: "文件类型错误",
            description: `${file.name} 不是图片文件`,
            variant: "destructive",
          })
          continue
        }

        const previewUrl = URL.createObjectURL(file)
        const compressedFile = await compressImage(file, 500 * 1024) // 500KB

        newImages.push({
          file,
          url: previewUrl,
          compressedFile,
        })
      }

      setUploadedImages((prev) => [...prev, ...newImages])
    } catch (error) {
      console.error("Error processing images:", error)
      toast({
        title: "图片处理失败",
        description: "无法处理上传的图片，请重试",
        variant: "destructive",
      })
    } finally {
      setIsCompressing(false)
    }
  }

  // 删除已上传的图片
  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].url)
      newImages.splice(index, 1)
      return newImages
    })
  }

  // 处理提交（文本+可能的图片）
  const handleSubmit = async () => {
    if (!inputText.trim() && uploadedImages.length === 0) {
      toast({
        title: "输入为空",
        description: "请输入文本或上传图片",
        variant: "destructive",
      })
      return
    }

    if (!checkAIConfig()) return

    setIsProcessing(true)
    try {
      let result
      const effectiveWeight = dailyLog.weight || userProfile.weight

      if (uploadedImages.length > 0) {
        const formData = new FormData()
        formData.append("text", inputText)
        formData.append("type", activeTab)
        formData.append("userWeight", effectiveWeight.toString())
        formData.append("aiConfig", JSON.stringify(aiConfig))
        uploadedImages.forEach((img, index) => {
          formData.append(`image${index}`, img.compressedFile || img.file)
        })

        const response = await fetch("/api/openai/parse-with-images", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "解析失败" }))
          throw new Error(errorData.message || "解析失败")
        }
        result = await response.json()
      } else {
        const response = await fetch("/api/openai/parse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-ai-config": JSON.stringify(aiConfig),
          },
          body: JSON.stringify({
            text: inputText,
            type: activeTab,
            userWeight: effectiveWeight,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "解析失败" }))
          throw new Error(errorData.message || "解析失败")
        }
        result = await response.json()
      }

      const updatedLog = { ...dailyLog }

      if (activeTab === "food" && result.food) {
        updatedLog.foodEntries = [...updatedLog.foodEntries, ...result.food]
        recalculateSummary(updatedLog)
      } else if (activeTab === "exercise" && result.exercise) {
        updatedLog.exerciseEntries = [...updatedLog.exerciseEntries, ...result.exercise]
        recalculateSummary(updatedLog)
      }

      setDailyLog(updatedLog)
      saveDailyLog(updatedLog.date, updatedLog)
      // 触发图表刷新
      setChartRefreshTrigger(prev => prev + 1)
      // 刷新日期记录状态
      refreshRecords()

      setInputText("")
      setUploadedImages([])

      toast({
        title: "记录添加成功",
        description: activeTab === "food" ? "饮食记录已添加" : "运动记录已添加",
      })
    } catch (error: any) {
      console.error("Error:", error)
      toast({
        title: "处理失败",
        description: error.message || "无法解析您的输入，请重试。",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 删除条目
  const handleDeleteEntry = (id: string, type: "food" | "exercise") => {
    const updatedLog = { ...dailyLog }

    if (type === "food") {
      updatedLog.foodEntries = updatedLog.foodEntries.filter((entry) => entry.log_id !== id)
    } else {
      updatedLog.exerciseEntries = updatedLog.exerciseEntries.filter((entry) => entry.log_id !== id)
    }

    recalculateSummary(updatedLog)
    setDailyLog(updatedLog)
    saveDailyLog(updatedLog.date, updatedLog)
    // 触发图表刷新
    setChartRefreshTrigger(prev => prev + 1)
    // 刷新日期记录状态
    refreshRecords()

    toast({
      title: "记录已删除",
      description: type === "food" ? "饮食记录已删除" : "运动记录已删除",
    })
  }

  // 更新条目
  const handleUpdateEntry = (updatedEntry: FoodEntry | ExerciseEntry, type: "food" | "exercise") => {
    const updatedLog = { ...dailyLog }

    if (type === "food") {
      updatedLog.foodEntries = updatedLog.foodEntries.map((entry) =>
        entry.log_id === (updatedEntry as FoodEntry).log_id ? (updatedEntry as FoodEntry) : entry,
      )
    } else {
      updatedLog.exerciseEntries = updatedLog.exerciseEntries.map((entry) =>
        entry.log_id === (updatedEntry as ExerciseEntry).log_id ? (updatedEntry as ExerciseEntry) : entry,
      )
    }

    recalculateSummary(updatedLog)
    setDailyLog(updatedLog)
    saveDailyLog(updatedLog.date, updatedLog)
    // 触发图表刷新
    setChartRefreshTrigger(prev => prev + 1)
    // 刷新日期记录状态
    refreshRecords()

    toast({
      title: "记录已更新",
      description: type === "food" ? "饮食记录已更新" : "运动记录已更新",
    })
  }

  return {
    handleImageUpload,
    handleRemoveImage,
    handleSubmit,
    handleDeleteEntry,
    handleUpdateEntry,
  }
}
