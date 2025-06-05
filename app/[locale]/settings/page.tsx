"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useIndexedDB } from "@/hooks/use-indexed-db"
import type { AIConfig, ModelConfig } from "@/lib/types"
import type { OpenAIModel } from "@/lib/openai-client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, RefreshCw, UploadCloud } from "lucide-react"
import { useTranslation } from "@/hooks/use-i18n"

const defaultUserProfile = {
  weight: 70,
  height: 170,
  age: 30,
  gender: "male",
  activityLevel: "moderate",
  goal: "maintain",
  targetWeight: undefined as number | undefined,
  targetCalories: undefined as number | undefined,
  notes: undefined as string | undefined,
  bmrFormula: "mifflin-st-jeor" as "mifflin-st-jeor" | "harris-benedict",
  bmrCalculationBasis: "totalWeight" as "totalWeight" | "leanBodyMass",
  bodyFatPercentage: undefined as number | undefined,
}

const defaultAIConfig: AIConfig = {
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
}

function SettingsContent() {
  const { toast } = useToast()
  const t = useTranslation('settings')
  const searchParams = useSearchParams()
  const [userProfile, setUserProfile] = useLocalStorage("userProfile", defaultUserProfile)
  const [aiConfig, setAIConfig] = useLocalStorage<AIConfig>("aiConfig", defaultAIConfig)

  // 获取URL参数中的tab值，默认为profile
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab')
    return ['profile', 'goals', 'ai', 'data'].includes(tabParam || '') ? tabParam : 'profile'
  })

  const { clearAllData } = useIndexedDB("healthLogs")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 使用独立的表单状态，避免与 localStorage 状态冲突
  const [formData, setFormData] = useState(defaultUserProfile)
  const [aiFormData, setAIFormData] = useState(defaultAIConfig)

  // 模型列表状态
  const [agentModels, setAgentModels] = useState<OpenAIModel[]>([])
  const [chatModels, setChatModels] = useState<OpenAIModel[]>([])
  const [visionModels, setVisionModels] = useState<OpenAIModel[]>([])

  // 加载状态
  const [loadingAgentModels, setLoadingAgentModels] = useState(false)
  const [loadingChatModels, setLoadingChatModels] = useState(false)
  const [loadingVisionModels, setLoadingVisionModels] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    setFormData(userProfile)
  }, [userProfile])

  useEffect(() => {
    setAIFormData(aiConfig)
  }, [aiConfig])

  // 处理表单输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      let processedValue;
      // Handle primary numeric fields that should default to 0 if empty/invalid
      if (name === "weight" || name === "height" || name === "age") {
        processedValue = Number.parseFloat(value) || 0;
      }
      // Handle optional numeric fields that should be undefined if empty/invalid
      else if (name === "targetWeight" || name === "targetCalories" || name === "bodyFatPercentage") {
        if (value === "") {
          processedValue = undefined;
        } else {
          const parsed = Number.parseFloat(value);
          processedValue = Number.isNaN(parsed) ? undefined : parsed; // Store undefined if not a valid number
        }
      }
      // Handle string fields
      else {
        processedValue = value;
      }
      return {
        ...prev,
        [name]: processedValue,
      };
    });
  }, [])

  // 处理选择框变化
  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  // 处理AI配置变化
  const handleAIConfigChange = useCallback((modelType: keyof AIConfig, field: keyof ModelConfig, value: string) => {
    setAIFormData((prev) => ({
      ...prev,
      [modelType]: {
        ...prev[modelType],
        [field]: value,
      },
    }))

    // 如果修改了 baseUrl 或 apiKey，清空对应的模型列表
    if (field === "baseUrl" || field === "apiKey") {
      setTimeout(() => {
        switch (modelType) {
          case "agentModel":
            setAgentModels([])
            break
          case "chatModel":
            setChatModels([])
            break
          case "visionModel":
            setVisionModels([])
            break
        }
      }, 100)
    }
  }, [])

  // 获取模型列表
  const fetchModels = useCallback(
    async (modelType: keyof AIConfig) => {
      const modelConfig = aiFormData[modelType]

      if (!modelConfig.baseUrl || !modelConfig.apiKey) {
        toast({
          title: t('ai.configIncomplete'),
          description: t('ai.fillBaseUrlAndKey'),
          variant: "destructive",
        })
        return
      }

      // 设置加载状态
      switch (modelType) {
        case "agentModel":
          setLoadingAgentModels(true)
          break
        case "chatModel":
          setLoadingChatModels(true)
          break
        case "visionModel":
          setLoadingVisionModels(true)
          break
      }

      try {
        const response = await fetch("/api/models", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            baseUrl: modelConfig.baseUrl,
            apiKey: modelConfig.apiKey,
          }),
        })

        if (!response.ok) {
          throw new Error(t('ai.fetchModelsFailed'))
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        // 更新对应的模型列表
        switch (modelType) {
          case "agentModel":
            setAgentModels(data.data || [])
            break
          case "chatModel":
            setChatModels(data.data || [])
            break
          case "visionModel":
            setVisionModels(data.data || [])
            break
        }

        toast({
          title: t('ai.fetchSuccess'),
          description: t('ai.fetchSuccessDesc', { count: data.data?.length || 0 }),
        })
      } catch (error) {
        console.error("Error fetching models:", error)
        toast({
          title: t('ai.fetchFailed'),
          description: error instanceof Error ? error.message : t('ai.fetchFailedDesc'),
          variant: "destructive",
        })
      } finally {
        // 清除加载状态
        switch (modelType) {
          case "agentModel":
            setLoadingAgentModels(false)
            break
          case "chatModel":
            setLoadingChatModels(false)
            break
          case "visionModel":
            setLoadingVisionModels(false)
            break
        }
      }
    },
    [aiFormData, toast],
  )

  // 保存用户配置
  const handleSaveProfile = useCallback(() => {
    setUserProfile(formData)
    toast({
      title: t('profile.saveSuccess'),
      description: t('profile.saveSuccessDesc'),
    })
  }, [formData, setUserProfile, toast])

  // 保存AI配置
  const handleSaveAIConfig = useCallback(() => {
    // 验证配置
    const models = [aiFormData.agentModel, aiFormData.chatModel, aiFormData.visionModel]
    for (const model of models) {
      if (!model.name || !model.baseUrl || !model.apiKey) {
        toast({
          title: t('ai.configIncomplete'),
          description: t('ai.fillAllFields'),
          variant: "destructive",
        })
        return
      }
    }

    setAIConfig(aiFormData)
    toast({
      title: t('ai.saveSuccess'),
      description: t('ai.saveSuccessDesc'),
    })
  }, [aiFormData, setAIConfig, toast])

  // 测试AI配置
  const handleTestAIConfig = useCallback(
    async (modelType: keyof AIConfig) => {
      const model = aiFormData[modelType]
      if (!model.name || !model.baseUrl || !model.apiKey) {
        toast({
          title: "配置不完整",
          description: "请先填写完整的模型配置",
          variant: "destructive",
        })
        return
      }

      try {
        const response = await fetch("/api/test-model", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            modelConfig: model,
            modelType,
          }),
        })

        if (response.ok) {
          toast({
            title: "测试成功",
            description: `${modelType} 模型连接正常`,
          })
        } else {
          throw new Error("测试失败")
        }
      } catch (error) {
        toast({
          title: "测试失败",
          description: `${modelType} 模型连接失败，请检查配置`,
          variant: "destructive",
        })
      }
    },
    [aiFormData, toast],
  )

  // 导出所有数据
  const handleExportData = useCallback(async () => {
    try {
      // 获取所有健康日志
      const db = await window.indexedDB.open("healthApp", 1)
      const request = new Promise((resolve, reject) => {
        db.onsuccess = (event) => {
          const database = (event.target as IDBOpenDBRequest).result
          const transaction = database.transaction(["healthLogs"], "readonly")
          const objectStore = transaction.objectStore("healthLogs")
          const allData: Record<string, any> = {}

          objectStore.openCursor().onsuccess = (cursorEvent) => {
            const cursor = (cursorEvent.target as IDBRequest).result
            if (cursor) {
              allData[cursor.key as string] = cursor.value
              cursor.continue()
            } else {
              resolve(allData)
            }
          }

          transaction.onerror = () => reject(new Error("无法读取数据"))
        }
        db.onerror = () => reject(new Error("无法打开数据库"))
      })

      const healthLogs = await request

      // 创建导出对象
      const exportData = {
        userProfile,
        aiConfig,
        healthLogs,
      }

      // 创建并下载 JSON 文件
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

      const exportFileDefaultName = `health-data-${new Date().toISOString().slice(0, 10)}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()

      // 记录导出时间
      localStorage.setItem('lastExportTime', new Date().toISOString())

      toast({
        title: t('data.exportSuccessTitle'),
        description: t('data.exportSuccessDescription'),
      })
    } catch (error) {
      console.error("导出数据失败:", error)
      toast({
        title: t('data.exportErrorTitle'),
        description: t('data.exportErrorDescription'),
        variant: "destructive",
      })
    }
  }, [userProfile, aiConfig, toast])

  // 导入数据
  const handleImportData = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          const importedData = JSON.parse(content)

          // 验证导入的数据格式
          if (!importedData.userProfile || !importedData.healthLogs) {
            throw new Error("无效的数据格式")
          }

          // 更新用户配置
          setUserProfile(importedData.userProfile)

          // 更新AI配置（如果存在）
          if (importedData.aiConfig) {
            setAIConfig(importedData.aiConfig)
          }

          // 更新健康日志
          const db = await window.indexedDB.open("healthApp", 1)
          db.onsuccess = (event) => {
            const database = (event.target as IDBOpenDBRequest).result
            const transaction = database.transaction(["healthLogs"], "readwrite")
            const objectStore = transaction.objectStore("healthLogs")

            // 清除现有数据
            objectStore.clear()

            // 添加导入的数据
            Object.entries(importedData.healthLogs).forEach(([key, value]) => {
              objectStore.add(value, key)
            })

            transaction.oncomplete = () => {
              toast({
                title: "导入成功",
                description: "您的健康数据已成功导入",
              })
              // 重置文件输入
              if (event.target) {
                (event.target as HTMLInputElement).value = ""
              }
            }

            transaction.onerror = () => {
              throw new Error("导入数据到数据库失败")
            }
          }
        } catch (error) {
          console.error("导入数据失败:", error)
          toast({
            title: t('data.importErrorTitle'),
            description: t('data.importErrorDescription'),
            variant: "destructive",
          })
        }
      }

      reader.readAsText(file)
    },
    [setUserProfile, setAIConfig, toast],
  )

  // 清空所有数据
  const handleClearAllData = useCallback(async () => {
    try {
      await clearAllData()
      toast({
        title: "清除成功",
        description: "所有健康日志数据已清除",
      })
    } catch (error) {
      console.error("清除数据失败:", error)
      toast({
        title: "清除失败",
        description: "无法清除您的健康数据",
        variant: "destructive",
      })
    }
  }, [clearAllData, toast])

  // 渲染模型选择器
  const renderModelSelector = useCallback(
    (modelType: keyof AIConfig, models: OpenAIModel[], isLoading: boolean) => {
      const modelConfig = aiFormData[modelType]

      return (
        <div className="flex space-x-2 items-end">
          {models.length > 0 ? (
            <div className="flex-1">
              <Select
                value={modelConfig.name}
                onValueChange={(value) => handleAIConfigChange(modelType, "name", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('ai.selectModel')} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Input
              className="flex-1"
              value={modelConfig.name}
              onChange={(e) => handleAIConfigChange(modelType, "name", e.target.value)}
              placeholder={t('ai.modelNamePlaceholder')}
            />
          )}
          <Button
            variant="outline"
            onClick={() => fetchModels(modelType)}
            disabled={isLoading || !modelConfig.baseUrl || !modelConfig.apiKey}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">{t('ai.fetchModels')}</span>
          </Button>
        </div>
      )
    },
    [aiFormData, handleAIConfigChange, fetchModels],
  )

  return (
    <div className="container mx-auto py-6 max-w-8xl">
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
          <TabsTrigger value="goals">{t('tabs.goals')}</TabsTrigger>
          <TabsTrigger value="ai">{t('tabs.ai')}</TabsTrigger>
          <TabsTrigger value="data">{t('tabs.data')}</TabsTrigger>
        </TabsList>

        {/* 个人信息 */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.title')}</CardTitle>
              <CardDescription>{t('profile.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">{t('profile.weight')}</Label>
                  <Input id="weight" name="weight" type="number" value={formData.weight} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">{t('profile.height')}</Label>
                  <Input id="height" name="height" type="number" value={formData.height} onChange={handleInputChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">{t('profile.age')}</Label>
                  <Input id="age" name="age" type="number" value={formData.age} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">{t('profile.gender')}</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('profile.gender')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t('profile.male')}</SelectItem>
                      <SelectItem value="female">{t('profile.female')}</SelectItem>
                      <SelectItem value="other">{t('profile.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityLevel">{t('profile.activityLevel')}</Label>
                <Select
                  value={formData.activityLevel}
                  onValueChange={(value) => handleSelectChange("activityLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('profile.activityLevel')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">{t('profile.activityLevels.sedentary')}</SelectItem>
                    <SelectItem value="light">{t('profile.activityLevels.light')}</SelectItem>
                    <SelectItem value="moderate">{t('profile.activityLevels.moderate')}</SelectItem>
                    <SelectItem value="active">{t('profile.activityLevels.active')}</SelectItem>
                    <SelectItem value="very_active">{t('profile.activityLevels.very_active')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('profile.activityLevelDescription')}
                </p>
              </div>

              {/* BMR Formula Selection */}
              <div className="space-y-2">
                <Label htmlFor="bmrFormula">{t('profile.bmrFormula')}</Label>
                <Select
                  value={formData.bmrFormula || 'mifflin-st-jeor'}
                  onValueChange={(value) => handleSelectChange("bmrFormula", value)}
                >
                  <SelectTrigger id="bmrFormula">
                    <SelectValue placeholder={t('profile.selectBmrFormula')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mifflin-st-jeor">{t('profile.mifflinStJeor')}</SelectItem>
                    <SelectItem value="harris-benedict">{t('profile.harrisBenedict')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('profile.bmrFormulaDescription')}
                </p>
              </div>

              {/* BMR Calculation Basis Selection */}
              <div className="space-y-2">
                <Label htmlFor="bmrCalculationBasis">{t('profile.bmrCalculationBasis')}</Label>
                <Select
                  value={formData.bmrCalculationBasis || 'totalWeight'}
                  onValueChange={(value) => handleSelectChange("bmrCalculationBasis", value)}
                >
                  <SelectTrigger id="bmrCalculationBasis">
                    <SelectValue placeholder={t('profile.selectBmrBasis')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="totalWeight">{t('profile.totalWeight')}</SelectItem>
                    <SelectItem value="leanBodyMass">{t('profile.leanBodyMass')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('profile.bmrBasisDescription')}
                </p>
              </div>

              {/* Body Fat Percentage Input (conditional) */}
              {formData.bmrCalculationBasis === 'leanBodyMass' && (
                <div className="space-y-2">
                  <Label htmlFor="bodyFatPercentage">{t('profile.bodyFatPercentage')}</Label>
                  <Input
                    id="bodyFatPercentage"
                    name="bodyFatPercentage"
                    type="number"
                    value={formData.bodyFatPercentage === undefined ? "" : String(formData.bodyFatPercentage)} // Display empty string for undefined
                    onChange={handleInputChange}
                    placeholder={t('profile.bodyFatPlaceholder')}
                    min="0"
                    max="99"
                    step="0.1"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('profile.bodyFatDescription')}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile}>{t('profile.saveProfile')}</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 健康目标 */}
        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>{t('goals.title')}</CardTitle>
              <CardDescription>{t('goals.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal">{t('goals.goalType')}</Label>
                <Select value={formData.goal} onValueChange={(value) => handleSelectChange("goal", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('goals.selectGoal')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose_weight">{t('goals.loseWeight')}</SelectItem>
                    <SelectItem value="maintain">{t('goals.maintain')}</SelectItem>
                    <SelectItem value="gain_weight">{t('goals.gainWeight')}</SelectItem>
                    <SelectItem value="build_muscle">{t('goals.buildMuscle')}</SelectItem>
                    <SelectItem value="improve_health">{t('goals.improveHealth')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetWeight">{t('goals.targetWeight')}</Label>
                  <Input
                    id="targetWeight"
                    name="targetWeight"
                    type="number"
                    value={formData.targetWeight || ""}
                    onChange={handleInputChange}
                    placeholder={t('goals.optional')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetCalories">{t('goals.targetCalories')}</Label>
                  <Input
                    id="targetCalories"
                    name="targetCalories"
                    type="number"
                    value={formData.targetCalories || ""}
                    onChange={handleInputChange}
                    placeholder={t('goals.optional')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('goals.notes')}</Label>
                <Input
                  id="notes"
                  name="notes"
                  value={formData.notes || ""}
                  onChange={handleInputChange}
                  placeholder={t('goals.notesPlaceholder')}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile}>{t('goals.saveGoals')}</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* AI 配置 */}
        <TabsContent value="ai">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 工作模型/Agents模型 */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('ai.agentModel')}</CardTitle>
                  <CardDescription>{t('ai.agentModelDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agent-base-url">{t('ai.baseUrl')}</Label>
                      <Input
                        id="agent-base-url"
                        value={aiFormData.agentModel.baseUrl}
                        onChange={(e) => handleAIConfigChange("agentModel", "baseUrl", e.target.value)}
                        placeholder={t('ai.baseUrlPlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agent-api-key">{t('ai.apiKey')}</Label>
                      <Input
                        id="agent-api-key"
                        type="password"
                        value={aiFormData.agentModel.apiKey}
                        onChange={(e) => handleAIConfigChange("agentModel", "apiKey", e.target.value)}
                        placeholder={t('ai.apiKeyPlaceholder')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent-model-name">{t('ai.modelName')}</Label>
                    {renderModelSelector("agentModel", agentModels, loadingAgentModels)}
                    {agentModels.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{t('ai.modelsFound', { count: agentModels.length })}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={() => handleTestAIConfig("agentModel")}>
                    {t('ai.testConnection')}
                  </Button>
                </CardFooter>
              </Card>

              {/* 对话模型 */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('ai.chatModel')}</CardTitle>
                  <CardDescription>{t('ai.chatModelDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="chat-base-url">{t('ai.baseUrl')}</Label>
                      <Input
                        id="chat-base-url"
                        value={aiFormData.chatModel.baseUrl}
                        onChange={(e) => handleAIConfigChange("chatModel", "baseUrl", e.target.value)}
                        placeholder={t('ai.baseUrlPlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chat-api-key">{t('ai.apiKey')}</Label>
                      <Input
                        id="chat-api-key"
                        type="password"
                        value={aiFormData.chatModel.apiKey}
                        onChange={(e) => handleAIConfigChange("chatModel", "apiKey", e.target.value)}
                        placeholder={t('ai.apiKeyPlaceholder')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chat-model-name">{t('ai.modelName')}</Label>
                    {renderModelSelector("chatModel", chatModels, loadingChatModels)}
                    {chatModels.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{t('ai.modelsFound', { count: chatModels.length })}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={() => handleTestAIConfig("chatModel")}>
                    {t('ai.testConnection')}
                  </Button>
                </CardFooter>
              </Card>

              {/* 视觉模型 */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('ai.visionModel')}</CardTitle>
                  <CardDescription>{t('ai.visionModelDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vision-base-url">{t('ai.baseUrl')}</Label>
                      <Input
                        id="vision-base-url"
                        value={aiFormData.visionModel.baseUrl}
                        onChange={(e) => handleAIConfigChange("visionModel", "baseUrl", e.target.value)}
                        placeholder={t('ai.baseUrlPlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vision-api-key">{t('ai.apiKey')}</Label>
                      <Input
                        id="vision-api-key"
                        type="password"
                        value={aiFormData.visionModel.apiKey}
                        onChange={(e) => handleAIConfigChange("visionModel", "apiKey", e.target.value)}
                        placeholder={t('ai.apiKeyPlaceholder')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vision-model-name">{t('ai.modelName')}</Label>
                    {renderModelSelector("visionModel", visionModels, loadingVisionModels)}
                    {visionModels.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{t('ai.modelsFound', { count: visionModels.length })}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={() => handleTestAIConfig("visionModel")}>
                    {t('ai.testConnection')}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <Button onClick={handleSaveAIConfig}>{t('ai.saveConfig')}</Button>

          </div>
        </TabsContent>

        {/* 数据管理 */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>{t('data.title')}</CardTitle>
              <CardDescription>{t('data.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t('data.exportData')}</h3>
                <p className="text-sm text-muted-foreground">{t('data.exportDescription')}</p>
                <Button onClick={handleExportData}>{t('data.exportAllData')}</Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t('data.importData')}</h3>
                <p className="text-sm text-muted-foreground">{t('data.importDescription')}</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {t('data.selectFile')}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t('data.clearData')}</h3>
                <p className="text-sm text-muted-foreground">{t('data.clearDescription')}</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">{t('data.clearAllData')}</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('data.confirmClearTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('data.confirmClearDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('data.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearAllData}>{t('data.confirmClear')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 关于与帮助 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('about.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{t('about.privacyTitle')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('about.privacyDescription')}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium">{t('about.usageTitle')}</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>{t('about.usage1')}</li>
              <li>{t('about.usage2')}</li>
              <li>{t('about.usage3')}</li>
              <li>{t('about.usage4')}</li>
              <li>{t('about.usage5')}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium">{t('about.versionTitle')}</h3>
            <p className="text-sm text-muted-foreground">{t('about.versionInfo')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-6 max-w-8xl">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载设置...</p>
        </div>
      </div>
    </div>}>
      <SettingsContent />
    </Suspense>
  )
}
