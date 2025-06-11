"use client"

import type React from "react"
import { DailySummary } from "@/components/daily-summary"
import { SmartSuggestions } from "@/components/smart-suggestions"
import type { DailySummaryType, TEFAnalysis, SmartSuggestionsResponse } from "@/lib/types"

interface HealthSummarySectionProps {
  summary: DailySummaryType
  calculatedBMR: number | undefined
  calculatedTDEE: number | undefined
  tefAnalysis: TEFAnalysis | undefined
  tefAnalysisCountdown: number
  selectedDate: Date
  smartSuggestions: SmartSuggestionsResponse | undefined
  smartSuggestionsLoading: boolean
  onRefreshSuggestions: () => void
  currentDate: string
}

export default function HealthSummarySection({
  summary,
  calculatedBMR,
  calculatedTDEE,
  tefAnalysis,
  tefAnalysisCountdown,
  selectedDate,
  smartSuggestions,
  smartSuggestionsLoading,
  onRefreshSuggestions,
  currentDate
}: HealthSummarySectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="scale-in">
        <DailySummary
          summary={summary}
          calculatedBMR={calculatedBMR}
          calculatedTDEE={calculatedTDEE}
          tefAnalysis={tefAnalysis}
          tefAnalysisCountdown={tefAnalysisCountdown}
          selectedDate={selectedDate}
        />
      </div>
      <div className="scale-in">
        <SmartSuggestions
          suggestions={smartSuggestions}
          isLoading={smartSuggestionsLoading}
          onRefresh={onRefreshSuggestions}
          currentDate={currentDate}
        />
      </div>
    </div>
  )
}
