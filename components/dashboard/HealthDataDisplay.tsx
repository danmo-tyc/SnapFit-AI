"use client"

import type React from "react"
import { Utensils, Dumbbell } from "lucide-react"
import { FoodEntryCard } from "@/components/food-entry-card"
import { ExerciseEntryCard } from "@/components/exercise-entry-card"
import type { FoodEntry, ExerciseEntry } from "@/lib/types"
import { useTranslation } from "@/hooks/use-i18n"

interface HealthDataDisplayProps {
  foodEntries: FoodEntry[]
  exerciseEntries: ExerciseEntry[]
  onDeleteEntry: (id: string, type: "food" | "exercise") => void
  onUpdateEntry: (entry: FoodEntry | ExerciseEntry, type: "food" | "exercise") => void
}

export default function HealthDataDisplay({
  foodEntries,
  exerciseEntries,
  onDeleteEntry,
  onUpdateEntry
}: HealthDataDisplayProps) {
  const t = useTranslation('dashboard')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
      {/* 饮食记录区域 */}
      <div className="health-card scale-in">
        <div className="p-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white">
              <Utensils className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">{t('ui.myMeals')}</h3>
              <p className="text-muted-foreground text-lg">{t('ui.todayFoodCount', { count: foodEntries.length })}</p>
            </div>
          </div>

          {foodEntries.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50">
                <Utensils className="h-10 w-10" />
              </div>
              <p className="text-xl font-medium mb-3">{t('ui.noFoodRecords')}</p>
              <p className="text-lg opacity-75">{t('ui.addFoodAbove')}</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {foodEntries.map((entry) => (
                <FoodEntryCard
                  key={entry.log_id}
                  entry={entry}
                  onDelete={() => onDeleteEntry(entry.log_id, "food")}
                  onUpdate={(updated) => onUpdateEntry(updated, "food")}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 运动记录区域 */}
      <div className="health-card scale-in">
        <div className="p-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white">
              <Dumbbell className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">{t('ui.myExercise')}</h3>
              <p className="text-muted-foreground text-lg">{t('ui.todayExerciseCount', { count: exerciseEntries.length })}</p>
            </div>
          </div>

          {exerciseEntries.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50">
                <Dumbbell className="h-10 w-10" />
              </div>
              <p className="text-xl font-medium mb-3">{t('ui.noExerciseRecords')}</p>
              <p className="text-lg opacity-75">{t('ui.addExerciseAbove')}</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {exerciseEntries.map((entry) => (
                <ExerciseEntryCard
                  key={entry.log_id}
                  entry={entry}
                  onDelete={() => onDeleteEntry(entry.log_id, "exercise")}
                  onUpdate={(updated) => onUpdateEntry(updated, "exercise")}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
