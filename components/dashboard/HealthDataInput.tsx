"use client"

import type React from "react"
import { ClipboardPenLine, Utensils, Dumbbell, Activity, ImageIcon, UploadCloud, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DailyStatusCard } from "@/components/DailyStatusCard"
import type { DailyStatus } from "@/lib/types"
import { useTranslation } from "@/hooks/use-i18n"

interface ImagePreview {
  file: File
  url: string
  compressedFile?: File
}

interface HealthDataInputProps {
  activeTab: string
  onTabChange: (tab: string) => void
  inputText: string
  onInputChange: (text: string) => void
  uploadedImages: ImagePreview[]
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
  onSubmit: () => void
  onSaveDailyStatus: (status: DailyStatus) => void
  selectedDate: Date
  dailyStatus: DailyStatus | undefined
  isProcessing: boolean
  isCompressing: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  isMobile: boolean
  dailyLog: {
    foodEntries: any[]
    exerciseEntries: any[]
    dailyStatus?: DailyStatus
  }
}

export default function HealthDataInput({
  activeTab,
  onTabChange,
  inputText,
  onInputChange,
  uploadedImages,
  onImageUpload,
  onRemoveImage,
  onSubmit,
  onSaveDailyStatus,
  selectedDate,
  dailyStatus,
  isProcessing,
  isCompressing,
  fileInputRef,
  isMobile,
  dailyLog
}: HealthDataInputProps) {
  const t = useTranslation('dashboard')

  return (
    <div className="health-card mb-12 slide-up">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white">
              <ClipboardPenLine className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{t('ui.recordHealthData')}</h2>
              <p className="text-muted-foreground text-sm">{t('ui.recordHealthDataDesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isMobile && <span className="text-xs text-muted-foreground">今日记录</span>}
            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
              {(() => {
                let count = 0
                if (dailyLog.foodEntries.length > 0) count++
                if (dailyLog.exerciseEntries.length > 0) count++
                if (dailyLog.dailyStatus) count++
                return `${count}/3`
              })()}
            </span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="food" className="text-sm py-3 px-4">
              <Utensils className="mr-2 h-4 w-4" />{t('ui.dietRecord')}
            </TabsTrigger>
            <TabsTrigger value="exercise" className="text-sm py-3 px-4">
              <Dumbbell className="mr-2 h-4 w-4" />{t('ui.exerciseRecord')}
            </TabsTrigger>
            <TabsTrigger value="status" className="text-sm py-3 px-4">
              <Activity className="mr-2 h-4 w-4" />{t('ui.dailyStatus')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {activeTab === "status" ? (
            <DailyStatusCard
              date={selectedDate.toISOString().split('T')[0]}
              initialStatus={dailyStatus}
              onSave={onSaveDailyStatus}
            />
          ) : (
            <Textarea
              placeholder={
                activeTab === "food"
                  ? t('placeholders.foodExample')
                  : t('placeholders.exerciseExample')
              }
              value={inputText}
              onChange={(e) => onInputChange(e.target.value)}
              className="min-h-[120px] text-base p-4 rounded-xl"
            />
          )}

          {activeTab !== "status" && uploadedImages.length > 0 && (
            <div className="p-6 rounded-xl bg-muted/30 border">
              <p className="text-muted-foreground mb-4 flex items-center font-medium">
                <ImageIcon className="mr-2 h-5 w-5" /> {t('images.uploaded', { count: uploadedImages.length })}
              </p>
              <div className="flex flex-wrap gap-3">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-white dark:border-slate-700 shadow-md hover:shadow-lg transition-all group">
                    <img
                      src={img.url || "/placeholder.svg"}
                      alt={`预览 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                      aria-label="删除图片"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab !== "status" && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onImageUpload}
                  disabled={isProcessing || isCompressing || uploadedImages.length >= 5}
                  ref={fileInputRef}
                />
                <Button
                  variant="outline"
                  type="button"
                  size="default"
                  disabled={isProcessing || isCompressing || uploadedImages.length >= 5}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 px-4"
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {isCompressing ? t('buttons.imageProcessing') : `${t('buttons.uploadImages')} (${uploadedImages.length}/5)`}
                </Button>
                {uploadedImages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="default"
                    onClick={() => uploadedImages.forEach((_, index) => onRemoveImage(index))}
                    className="text-destructive hover:text-destructive h-10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> {t('buttons.clearImages')}
                  </Button>
                )}
              </div>

              <Button
                onClick={onSubmit}
                size="default"
                className="btn-gradient-primary w-full sm:w-auto px-8 h-10 text-sm"
                disabled={isProcessing || isCompressing || (!inputText.trim() && uploadedImages.length === 0)}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('buttons.processing')}
                  </>
                ) : (
                  <>
                    {activeTab === "food" ? <Utensils className="mr-2 h-4 w-4" /> : <Dumbbell className="mr-2 h-4 w-4" />}
                    {t('buttons.submitRecord')}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
