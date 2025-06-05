import { OpenAICompatibleClient } from "@/lib/openai-client"
import type { DailyLog, UserProfile } from "@/lib/types"

export async function POST(req: Request) {
  try {
    const { dailyLog, userProfile, recentLogs } = await req.json()

    if (!dailyLog || !userProfile) {
      return Response.json({ error: "Missing required data" }, { status: 400 })
    }

    // 获取AI配置
    const aiConfigStr = req.headers.get("x-ai-config")
    if (!aiConfigStr) {
      return Response.json({ error: "AI configuration not found" }, { status: 400 })
    }

    const aiConfig = JSON.parse(aiConfigStr)
    const modelConfig = aiConfig.agentModel

    // 创建客户端
    const client = new OpenAICompatibleClient(modelConfig.baseUrl, modelConfig.apiKey)

    // 准备数据摘要
    const dataSummary = {
      today: {
        date: dailyLog.date,
        calories: dailyLog.summary.totalCalories,
        protein: dailyLog.summary.totalProtein,
        carbs: dailyLog.summary.totalCarbohydrates,
        fat: dailyLog.summary.totalFat,
        exercise: dailyLog.summary.totalExerciseCalories,
        weight: dailyLog.weight,
        bmr: dailyLog.calculatedBMR,
        tdee: dailyLog.calculatedTDEE,
        tefAnalysis: dailyLog.tefAnalysis,
        foodEntries: dailyLog.foodEntries.map(entry => ({
          name: entry.food_name,
          mealType: entry.meal_type,
          calories: entry.total_nutritional_info_consumed?.calories || 0,
          protein: entry.total_nutritional_info_consumed?.protein || 0,
          timestamp: entry.timestamp
        })),
        exerciseEntries: dailyLog.exerciseEntries.map(entry => ({
          name: entry.exercise_name,
          calories: entry.calories_burned,
          duration: entry.duration_minutes
        }))
      },
      profile: {
        age: userProfile.age,
        gender: userProfile.gender,
        height: userProfile.height,
        weight: userProfile.weight,
        activityLevel: userProfile.activityLevel,
        goal: userProfile.goal,
        targetWeight: userProfile.targetWeight
      },
      recent: recentLogs ? recentLogs.slice(0, 7).map(log => ({
        date: log.date,
        calories: log.summary.totalCalories,
        exercise: log.summary.totalExerciseCalories,
        weight: log.weight,
        foodNames: log.foodEntries.map(entry => entry.food_name).slice(0, 5), // 只取前5个食物名称
        exerciseNames: log.exerciseEntries.map(entry => entry.exercise_name).slice(0, 3) // 只取前3个运动名称
      })) : []
    }

    // 定义不同类型的建议提示词
    const suggestionPrompts = {
      nutrition: `
        你是一位注册营养师(RD)，专精宏量营养素配比和膳食结构优化。

        数据：${JSON.stringify(dataSummary, null, 2)}

        专业分析要点：
        1. 宏量营养素配比评估（蛋白质15-25%，脂肪20-35%，碳水45-65%）
        2. 热量平衡与目标匹配度
        3. 食物选择的营养密度分析
        4. 微量营养素潜在缺口识别

        请提供3-4个具体的营养优化建议，每个建议需包含：
        - 明确的营养学依据
        - 具体的食物替换或添加方案
        - 量化的改进目标

        JSON格式：
        {
          "category": "营养配比优化",
          "priority": "high|medium|low",
          "suggestions": [
            {
              "title": "具体建议标题",
              "description": "基于营养学原理的详细说明和执行方案",
              "actionable": true,
              "icon": "🥗"
            }
          ],
          "summary": "营养状况专业评价"
        }
      `,
      
      exercise: `
        你是一位认证的运动生理学家，专精运动处方设计和能量代谢优化。

        数据：${JSON.stringify(dataSummary, null, 2)}

        专业分析要点：
        1. 运动量与TDEE目标的匹配度评估
        2. 有氧vs无氧运动配比优化（基于用户目标）
        3. 运动时机与代谢窗口利用
        4. 运动强度区间建议（基于心率储备）

        请提供2-3个基于运动科学的训练优化建议：
        - 具体的运动类型、强度、时长
        - 运动时机与营养配合策略
        - 渐进式训练计划

        JSON格式：
        {
          "category": "运动处方优化",
          "priority": "high|medium|low",
          "suggestions": [
            {
              "title": "具体运动方案",
              "description": "基于运动生理学的详细训练计划",
              "actionable": true,
              "icon": "🏃‍♂️"
            }
          ],
          "summary": "运动效能专业评价"
        }
      `,
      
      metabolism: `
        你是一位内分泌代谢专家，专精能量代谢调节和体重管理的生理机制。

        数据：${JSON.stringify(dataSummary, null, 2)}

        专业分析要点：
        1. 基础代谢率与实际消耗的匹配度
        2. TEF优化策略（基于食物热效应数据）
        3. 代谢适应性评估（基于体重变化趋势）
        4. 胰岛素敏感性和代谢灵活性指标

        请提供2-3个基于代谢生理学的优化建议：
        - 进餐时机与代谢节律同步
        - 宏量营养素时序分配
        - 代谢率提升的具体策略

        JSON格式：
        {
          "category": "代谢调节优化",
          "priority": "high|medium|low",
          "suggestions": [
            {
              "title": "代谢优化方案",
              "description": "基于内分泌生理学的详细调节策略",
              "actionable": true,
              "icon": "🔥"
            }
          ],
          "summary": "代谢效率专业评价"
        }
      `,
      
      behavior: `
        你是一位行为心理学专家，专精健康行为改变和习惯养成的科学方法。

        数据：${JSON.stringify(dataSummary, null, 2)}

        专业分析要点：
        1. 饮食行为模式识别（基于进餐时间和频率）
        2. 行为一致性评估（基于7天数据趋势）
        3. 习惯形成的关键触发点分析
        4. 行为改变的阻力因素识别

        请提供2-3个基于行为科学的习惯优化建议：
        - 具体的行为改变策略（基于行为链分析）
        - 环境设计和提示系统
        - 渐进式习惯建立计划

        JSON格式：
        {
          "category": "行为习惯优化",
          "priority": "high|medium|low",
          "suggestions": [
            {
              "title": "行为改变方案",
              "description": "基于行为心理学的详细习惯养成策略",
              "actionable": true,
              "icon": "🧠"
            }
          ],
          "summary": "行为模式专业评价"
        }
      `,

      timing: `
        你是一位时间营养学专家，专精生物节律与营养时机的优化策略。

        数据：${JSON.stringify(dataSummary, null, 2)}

        专业分析要点：
        1. 进餐时机与昼夜节律的同步性
        2. 运动时机与代谢窗口的匹配
        3. 营养素时序分配的优化空间
        4. 睡眠-代谢-营养的协调性

        请提供2-3个基于时间生物学的时机优化建议：
        - 最佳进餐和运动时间窗口
        - 营养素的时序化摄入策略
        - 生物节律同步的具体方法

        JSON格式：
        {
          "category": "时机优化策略",
          "priority": "high|medium|low",
          "suggestions": [
            {
              "title": "时机优化方案",
              "description": "基于时间营养学的详细时序安排",
              "actionable": true,
              "icon": "⏰"
            }
          ],
          "summary": "时机协调专业评价"
        }
      `
    }

    // 并发获取所有建议
    const suggestionPromises = Object.entries(suggestionPrompts).map(async ([key, prompt]) => {
      try {
        const { text } = await client.generateText({
          model: modelConfig.name,
          prompt,
          response_format: { type: "json_object" },
        })
        
        const result = JSON.parse(text)
        return { key, ...result }
      } catch (error) {
        console.warn(`Failed to get ${key} suggestions:`, error)
        return {
          key,
          category: key,
          priority: "low",
          suggestions: [],
          summary: "分析暂时不可用"
        }
      }
    })

    // 等待所有建议完成
    const allSuggestions = await Promise.all(suggestionPromises)

    // 按优先级排序
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    allSuggestions.sort((a, b) => 
      (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
    )

    return Response.json({
      suggestions: allSuggestions,
      generatedAt: new Date().toISOString(),
      dataDate: dailyLog.date
    })

  } catch (error) {
    console.error("Smart Suggestions Error:", error)
    return Response.json({ 
      error: "Failed to generate suggestions",
      suggestions: []
    }, { status: 500 })
  }
}
