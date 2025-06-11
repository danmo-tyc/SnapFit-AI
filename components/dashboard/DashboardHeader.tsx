"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { zhCN, enUS } from "date-fns/locale"
import Link from "next/link"
import { CalendarDays, Settings2, AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ManagementCharts } from "@/components/management-charts"
import { useTranslation } from "@/hooks/use-i18n"

interface DashboardHeaderProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  locale: string
  exportReminder: {
    shouldRemind: boolean
    hasEnoughData: boolean
    lastExportDate: Date | string | null
    daysSinceLastExport: number
  }
  chartRefreshTrigger: number
}

export default function DashboardHeader({
  selectedDate,
  onDateChange,
  locale,
  exportReminder,
  chartRefreshTrigger
}: DashboardHeaderProps) {
  const t = useTranslation('dashboard')
  const currentLocale = locale === 'en' ? enUS : zhCN
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <header className="mb-16 fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
        <div className="flex items-center space-x-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
            <img
              src="/placeholder.svg"
              alt="SnapFit AI Logo"
              className="w-10 h-10 object-contain filter invert"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              SnapFit AI
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('ui.subtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex flex-col gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-[280px] justify-start text-left font-normal text-base h-12"
                >
                  <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                  {isClient ? format(selectedDate, "PPP (eeee)", { locale: currentLocale }) : format(selectedDate, "yyyy-MM-dd")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && onDateChange(date)}
                  initialFocus
                  locale={currentLocale}
                />
              </PopoverContent>
            </Popover>
            
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <Settings2 className="h-3 w-3" />
                <Link
                  href={`/${locale}/settings?tab=ai`}
                  className="hover:text-primary transition-colors underline-offset-2 hover:underline"
                >
                  {t('ui.quickConfig')}
                </Link>
                <span>/</span>
                <Link
                  href={`/${locale}/settings?tab=data`}
                  className="hover:text-primary transition-colors underline-offset-2 hover:underline"
                >
                  {t('ui.dataExport')}
                </Link>
              </div>

              {/* 导出提醒 - 只在客户端渲染 */}
              {isClient && exportReminder.shouldRemind && exportReminder.hasEnoughData && (
                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-3 w-3" />
                  <span>
                    {exportReminder.lastExportDate === null
                      ? t('ui.neverExported')
                      : t('ui.exportReminder', { days: exportReminder.daysSinceLastExport })
                    }
                  </span>
                  <Clock className="h-3 w-3 ml-1" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 管理图表区域 */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ManagementCharts selectedDate={selectedDate} refreshTrigger={chartRefreshTrigger} />
        </div>
      </div>
    </header>
  )
}
