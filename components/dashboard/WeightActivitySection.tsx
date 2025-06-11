"use client"

import type React from "react"
import { Weight, UserCheck, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/hooks/use-i18n"

interface WeightActivitySectionProps {
  currentDayWeight: string
  onWeightChange: (weight: string) => void
  onSaveWeight: () => void
  currentDayActivityLevel: string
  onActivityLevelChange: (level: string) => void
  isProcessing: boolean
}

export default function WeightActivitySection({
  currentDayWeight,
  onWeightChange,
  onSaveWeight,
  currentDayActivityLevel,
  onActivityLevelChange,
  isProcessing
}: WeightActivitySectionProps) {
  const t = useTranslation('dashboard')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* 体重记录卡片 */}
      <div className="health-card p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white">
            <Weight className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t('ui.todayWeight')}</h3>
            <p className="text-sm text-muted-foreground">{t('ui.recordWeightChanges')}</p>
          </div>
        </div>
        <div className="space-y-3">
          <Input
            id="daily-weight"
            type="number"
            placeholder={t('placeholders.weightExample')}
            value={currentDayWeight}
            onChange={(e) => onWeightChange(e.target.value)}
            className="w-full h-11 text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSaveWeight()
                // 聚焦到活动水平选择器
                const activitySelect = document.getElementById('daily-activity-level')
                if (activitySelect) {
                  activitySelect.click()
                }
              }
            }}
          />
          <Button
            onClick={onSaveWeight}
            disabled={isProcessing}
            className="btn-gradient-primary w-full h-11"
          >
            <Save className="mr-2 h-4 w-4" />
            {t('ui.saveWeight')}
          </Button>
        </div>
      </div>

      {/* 活动水平卡片 */}
      <div className="health-card p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t('ui.activityLevel')}</h3>
            <p className="text-sm text-muted-foreground">{t('ui.setTodayActivity')}</p>
          </div>
        </div>
        <Select
          value={currentDayActivityLevel}
          onValueChange={(value) => {
            onActivityLevelChange(value)
            // 选择完活动水平后，聚焦到输入区域
            setTimeout(() => {
              const textarea = document.querySelector('textarea')
              if (textarea) {
                textarea.focus()
              }
            }, 100)
          }}
        >
          <SelectTrigger className="w-full h-11 text-base" id="daily-activity-level">
            <SelectValue placeholder={t('ui.selectActivityLevel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sedentary">{t('activityLevels.sedentary')}</SelectItem>
            <SelectItem value="light">{t('activityLevels.light')}</SelectItem>
            <SelectItem value="moderate">{t('activityLevels.moderate')}</SelectItem>
            <SelectItem value="active">{t('activityLevels.active')}</SelectItem>
            <SelectItem value="very_active">{t('activityLevels.very_active')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
