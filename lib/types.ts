// 食物记录类型
export interface FoodEntry {
  log_id: string
  food_name: string
  consumed_grams: number
  meal_type: string // breakfast, lunch, dinner, snack
  time_period?: string // 时间段：morning, noon, afternoon, evening
  nutritional_info_per_100g: {
    calories: number
    carbohydrates: number
    protein: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
    [key: string]: number | undefined
  }
  total_nutritional_info_consumed: {
    calories: number
    carbohydrates: number
    protein: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
    [key: string]: number | undefined
  }
  is_estimated: boolean
  timestamp?: string
}

// 运动记录类型
export interface ExerciseEntry {
  log_id: string
  exercise_name: string
  exercise_type: "cardio" | "strength" | "flexibility" | "other"
  duration_minutes: number
  distance_km?: number // 适用于有氧运动
  sets?: number // 适用于力量训练
  reps?: number // 适用于力量训练
  weight_kg?: number // 适用于力量训练
  estimated_mets: number // 代谢当量
  user_weight: number // 用户体重，用于计算卡路里消耗
  calories_burned_estimated: number
  muscle_groups?: string[] // 锻炼的肌肉群
  is_estimated: boolean
  timestamp?: string
}

// 日常摘要类型
export interface DailySummaryType {
  totalCaloriesConsumed: number
  totalCaloriesBurned: number
  macros: {
    carbs: number
    protein: number
    fat: number
  }
  micronutrients: Record<string, number>
}

// TEF 分析结果类型
export interface TEFAnalysis {
  baseTEF: number // 基础TEF (kcal)
  baseTEFPercentage: number // 基础TEF百分比
  enhancementMultiplier: number // AI分析的增强乘数
  enhancedTEF: number // 增强后的TEF (kcal)
  enhancementFactors: string[] // 影响因素列表
  analysisTimestamp: string // 分析时间戳
}

// 智能建议类型
export interface SmartSuggestion {
  title: string
  description: string
  actionable: boolean
  icon: string
}

export interface SmartSuggestionCategory {
  key: string
  category: string
  priority: 'high' | 'medium' | 'low'
  suggestions: SmartSuggestion[]
  summary: string
}

export interface SmartSuggestionsResponse {
  suggestions: SmartSuggestionCategory[]
  generatedAt: string
  dataDate: string
}

// 日志类型
export interface DailyLog {
  date: string
  foodEntries: FoodEntry[]
  exerciseEntries: ExerciseEntry[]
  summary: DailySummaryType
  weight?: number // 新增：记录当日体重
  activityLevel?: string // 新增：记录当日的活动水平，用于TDEE计算
  calculatedBMR?: number // 新增：当日计算的BMR
  calculatedTDEE?: number // 新增：当日计算的TDEE
  tefAnalysis?: TEFAnalysis // 新增：TEF分析结果
}

// 用户配置类型
export interface UserProfile {
  weight: number
  height: number
  age: number
  gender: string
  activityLevel: string
  goal: string
  targetWeight?: number
  targetCalories?: number
  notes?: string
  bmrFormula?: 'mifflin-st-jeor' | 'harris-benedict' // 新增：BMR计算公式选择
  bmrCalculationBasis?: 'totalWeight' | 'leanBodyMass' // 新增：BMR计算依据
  bodyFatPercentage?: number // 新增：体脂率，用于去脂体重计算
}

// 模型配置类型
export interface ModelConfig {
  name: string
  baseUrl: string
  apiKey: string
}

// AI 配置类型
export interface AIConfig {
  agentModel: ModelConfig // 工作模型/Agents模型
  chatModel: ModelConfig // 对话模型
  visionModel: ModelConfig // 视觉模型
}
