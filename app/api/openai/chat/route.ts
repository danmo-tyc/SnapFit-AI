import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

export async function POST(req: Request) {
  console.log("=== Chat API Request Started ===")

  try {
    const body = await req.json()
    console.log("Request body:", JSON.stringify(body, null, 2))

    const { messages, userProfile, healthData, recentHealthData, systemPrompt: customSystemPrompt, expertRole } = body

    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages format:", messages)
      return Response.json({ error: "Invalid messages format" }, { status: 400 })
    }

    // 获取AI配置和专家角色
    const aiConfigStr = req.headers.get("x-ai-config")
    const expertRoleId = req.headers.get("x-expert-role")
    console.log("AI Config header present:", !!aiConfigStr)
    console.log("Expert role:", expertRoleId)

    if (!aiConfigStr) {
      console.error("AI configuration not found in headers")
      return Response.json({ error: "AI configuration not found" }, { status: 400 })
    }

    let aiConfig
    try {
      aiConfig = JSON.parse(aiConfigStr)
      console.log("AI Config parsed successfully:", {
        hasAgentModel: !!aiConfig.agentModel,
        hasChatModel: !!aiConfig.chatModel,
        hasVisionModel: !!aiConfig.visionModel,
      })
    } catch (e) {
      console.error("Failed to parse AI config:", e)
      return Response.json({ error: "Invalid AI configuration format" }, { status: 400 })
    }

    const modelConfig = aiConfig.chatModel
    console.log("Chat model config:", {
      name: modelConfig?.name,
      baseUrl: modelConfig?.baseUrl,
      hasApiKey: !!modelConfig?.apiKey,
    })

    // 验证配置
    if (!modelConfig?.name || !modelConfig?.baseUrl || !modelConfig?.apiKey) {
      console.error("Incomplete model configuration:", {
        hasName: !!modelConfig?.name,
        hasBaseUrl: !!modelConfig?.baseUrl,
        hasApiKey: !!modelConfig?.apiKey,
      })
      return Response.json({ error: "Incomplete AI configuration" }, { status: 400 })
    }

    // 构建系统提示词
    let systemPrompt = customSystemPrompt ||
      "你是SnapFit AI健康助手，一个专业的健康管理AI。你可以基于用户的健康数据提供个性化的建议，包括营养、运动、生活方式等各个方面。请用专业但易懂的语言回答用户问题。"

    console.log("Using expert role:", expertRole?.name || "通用助手")
    console.log("System prompt length:", systemPrompt.length)

    // 使用传递过来的近期健康数据
    console.log("Recent health data received:", recentHealthData?.length || 0, "days")

    // 如果有用户资料和健康数据，添加到系统提示词中
    if (userProfile || healthData || (recentHealthData && recentHealthData.length > 0)) {
      console.log("Adding user profile and health data to system prompt", {
        userProfile: userProfile ? {
          weight: userProfile.weight,
          height: userProfile.height,
          age: userProfile.age,
          gender: userProfile.gender,
          activityLevel: userProfile.activityLevel,
          goal: userProfile.goal,
        } : null,
        healthData: healthData ? {
          date: healthData.date,
          foodEntriesCount: healthData.foodEntries?.length || 0,
          exerciseEntriesCount: healthData.exerciseEntries?.length || 0,
          summary: healthData.summary,
          weight: healthData.weight,
          calculatedBMR: healthData.calculatedBMR,
          calculatedTDEE: healthData.calculatedTDEE,
          tefAnalysis: healthData.tefAnalysis,
        } : null,
        recentHealthDataCount: recentHealthData?.length || 0,
      })

      if (userProfile) {
        systemPrompt += `

        用户资料:
        - 体重: ${userProfile.weight || "未知"} kg
        - 身高: ${userProfile.height || "未知"} cm
        - 年龄: ${userProfile.age || "未知"} 岁
        - 性别: ${
          userProfile.gender === "male" ? "男" : userProfile.gender === "female" ? "女" : userProfile.gender || "未知"
        }
        - 活动水平: ${
          {
            sedentary: "久坐不动",
            light: "轻度活跃",
            moderate: "中度活跃",
            active: "高度活跃",
            very_active: "非常活跃",
          }[userProfile.activityLevel] ||
          userProfile.activityLevel ||
          "未知"
        }
        - 健康目标: ${
          {
            lose_weight: "减重",
            maintain: "保持体重",
            gain_weight: "增重",
            build_muscle: "增肌",
            improve_health: "改善健康",
          }[userProfile.goal] ||
          userProfile.goal ||
          "未知"
        }
        ${userProfile.targetWeight ? `- 目标体重: ${userProfile.targetWeight} kg` : ""}
        `
      }

      if (healthData) {
        systemPrompt += `

        今日健康数据 (${healthData.date || "今日"}):
        - 当日体重: ${healthData.weight ? `${healthData.weight} kg` : "未记录"}
        - 基础代谢率(BMR): ${healthData.calculatedBMR?.toFixed(0) || "未计算"} kcal
        - 总能量消耗(TDEE): ${healthData.calculatedTDEE?.toFixed(0) || "未计算"} kcal
        - 总卡路里摄入: ${healthData.summary?.totalCaloriesConsumed?.toFixed(0) || "0"} kcal
        - 总卡路里消耗: ${healthData.summary?.totalCaloriesBurned?.toFixed(0) || "0"} kcal
        - 净卡路里: ${
          healthData.summary
            ? (healthData.summary.totalCaloriesConsumed - healthData.summary.totalCaloriesBurned).toFixed(0)
            : "0"
        } kcal
        - 热量缺口/盈余: ${
          healthData.summary && healthData.calculatedTDEE
            ? (healthData.calculatedTDEE - (healthData.summary.totalCaloriesConsumed - healthData.summary.totalCaloriesBurned)).toFixed(0)
            : "无法计算"
        } kcal (正数为缺口，负数为盈余)
        - 宏量营养素摄入:
          * 蛋白质: ${healthData.summary?.macros?.protein?.toFixed(1) || "0"} g (${healthData.summary?.macros?.protein && healthData.summary?.totalCaloriesConsumed ? ((healthData.summary.macros.protein * 4 / healthData.summary.totalCaloriesConsumed) * 100).toFixed(1) : "0"}%)
          * 碳水化合物: ${healthData.summary?.macros?.carbs?.toFixed(1) || "0"} g (${healthData.summary?.macros?.carbs && healthData.summary?.totalCaloriesConsumed ? ((healthData.summary.macros.carbs * 4 / healthData.summary.totalCaloriesConsumed) * 100).toFixed(1) : "0"}%)
          * 脂肪: ${healthData.summary?.macros?.fat?.toFixed(1) || "0"} g (${healthData.summary?.macros?.fat && healthData.summary?.totalCaloriesConsumed ? ((healthData.summary.macros.fat * 9 / healthData.summary.totalCaloriesConsumed) * 100).toFixed(1) : "0"}%)
        - 食物记录数: ${healthData.foodEntries?.length || 0} 条
        - 运动记录数: ${healthData.exerciseEntries?.length || 0} 条
        ${healthData.tefAnalysis ? `
        - 食物热效应(TEF):
          * 基础TEF: ${healthData.tefAnalysis.baseTEF.toFixed(1)} kcal (${healthData.tefAnalysis.baseTEFPercentage.toFixed(1)}%)
          * 增强乘数: ×${healthData.tefAnalysis.enhancementMultiplier.toFixed(2)}
          * 增强后TEF: ${healthData.tefAnalysis.enhancedTEF.toFixed(1)} kcal
          * 增强因素: ${healthData.tefAnalysis.enhancementFactors.join(", ") || "无"}
        ` : ""}
        `
      }

      if (healthData?.foodEntries?.length > 0) {
        systemPrompt += `
        今日食物记录:
        ${healthData.foodEntries.map(entry => {
          const nutrition = entry.total_nutritional_info_consumed;
          return `- ${entry.food_name} (${entry.consumed_grams}g): ${nutrition?.calories?.toFixed(0) || 0} kcal
          蛋白质: ${nutrition?.protein?.toFixed(1) || 0}g, 碳水: ${nutrition?.carbohydrates?.toFixed(1) || 0}g, 脂肪: ${nutrition?.fat?.toFixed(1) || 0}g
          ${entry.meal_type ? `餐次: ${entry.meal_type}` : ""}${entry.time_period ? `, 时间: ${entry.time_period}` : ""}${entry.timestamp ? `, 记录时间: ${new Date(entry.timestamp).toLocaleTimeString('zh-CN')}` : ""}`
        }).join('\n')}
        `
      }

      if (healthData?.exerciseEntries?.length > 0) {
        systemPrompt += `
        今日运动记录:
        ${healthData.exerciseEntries.map(entry =>
          `- ${entry.exercise_name} (${entry.duration_minutes}分钟): ${entry.calories_burned_estimated?.toFixed(0) || entry.calories_burned || 0} kcal
          ${entry.notes ? `备注: ${entry.notes}` : ""}`
        ).join('\n')}
        `
      }

      // 添加历史数据趋势（排除今天）
      if (recentHealthData && recentHealthData.length > 0) {
        // 过滤掉今天的数据，只显示历史数据
        const historicalData = recentHealthData.filter((dayLog, index) => index > 0)

        if (historicalData.length > 0) {
          systemPrompt += `

        历史健康数据趋势 (最近${historicalData.length}天):
        ${historicalData.map((dayLog, index) => {
          const dayLabel = index === 0 ? "昨天" : `${index + 1}天前`
          return `
        ${dayLabel} (${dayLog.date}):
        - 体重: ${dayLog.weight ? `${dayLog.weight} kg` : "未记录"}
        - BMR: ${dayLog.calculatedBMR?.toFixed(0) || "未计算"} kcal
        - TDEE: ${dayLog.calculatedTDEE?.toFixed(0) || "未计算"} kcal
        - 摄入: ${dayLog.summary?.totalCaloriesConsumed?.toFixed(0) || "0"} kcal
        - 消耗: ${dayLog.summary?.totalCaloriesBurned?.toFixed(0) || "0"} kcal
        - 净卡路里: ${dayLog.summary ? (dayLog.summary.totalCaloriesConsumed - dayLog.summary.totalCaloriesBurned).toFixed(0) : "0"} kcal
        - 热量缺口: ${dayLog.summary && dayLog.calculatedTDEE ? (dayLog.calculatedTDEE - (dayLog.summary.totalCaloriesConsumed - dayLog.summary.totalCaloriesBurned)).toFixed(0) : "无法计算"} kcal
        - 宏量营养素: 蛋白质 ${dayLog.summary?.macros?.protein?.toFixed(1) || "0"}g (${dayLog.summary?.macros?.protein && dayLog.summary?.totalCaloriesConsumed ? ((dayLog.summary.macros.protein * 4 / dayLog.summary.totalCaloriesConsumed) * 100).toFixed(1) : "0"}%), 碳水 ${dayLog.summary?.macros?.carbs?.toFixed(1) || "0"}g (${dayLog.summary?.macros?.carbs && dayLog.summary?.totalCaloriesConsumed ? ((dayLog.summary.macros.carbs * 4 / dayLog.summary.totalCaloriesConsumed) * 100).toFixed(1) : "0"}%), 脂肪 ${dayLog.summary?.macros?.fat?.toFixed(1) || "0"}g (${dayLog.summary?.macros?.fat && dayLog.summary?.totalCaloriesConsumed ? ((dayLog.summary.macros.fat * 9 / dayLog.summary.totalCaloriesConsumed) * 100).toFixed(1) : "0"}%)
        - 食物记录: ${dayLog.foodEntries?.length || 0}条, 运动记录: ${dayLog.exerciseEntries?.length || 0}条
        ${dayLog.tefAnalysis ? `- TEF增强: ×${dayLog.tefAnalysis.enhancementMultiplier.toFixed(2)} (${dayLog.tefAnalysis.enhancementFactors.join(", ") || "无"})` : ""}
        ${dayLog.foodEntries?.length > 0 ? `
        主要食物: ${dayLog.foodEntries.slice(0, 3).map(entry => `${entry.food_name}(${entry.consumed_grams}g)`).join(", ")}${dayLog.foodEntries.length > 3 ? "..." : ""}` : ""}
        ${dayLog.exerciseEntries?.length > 0 ? `
        主要运动: ${dayLog.exerciseEntries.slice(0, 2).map(entry => `${entry.exercise_name}(${entry.duration_minutes}分钟)`).join(", ")}${dayLog.exerciseEntries.length > 2 ? "..." : ""}` : ""}
          `
        }).join('\n')}
        `
        }
      }

      systemPrompt += `

        请根据以上详细信息，以${expertRole?.name || "专业健康助手"}的身份提供个性化的回答和建议。
        ${expertRole?.description ? `专业领域: ${expertRole.description}` : ""}
        `
    } else {
      console.log("No user profile or health data provided", {
        hasUserProfile: !!userProfile,
        hasHealthData: !!healthData,
      })
    }

    // 创建自定义OpenAI实例
    console.log("Creating custom OpenAI instance...")
    const openai = createOpenAI({
      baseURL: modelConfig.baseUrl.endsWith("/v1") ? modelConfig.baseUrl : `${modelConfig.baseUrl}/v1`,
      apiKey: modelConfig.apiKey,
    })

    // 清理消息格式，移除AI SDK添加的额外字段
    const cleanMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }))

    console.log("Clean messages prepared, count:", cleanMessages.length)

    // 使用AI SDK的streamText
    console.log("Creating stream with AI SDK...")
    const result = await streamText({
      model: openai(modelConfig.name),
      system: systemPrompt,
      messages: cleanMessages,
    })

    console.log("Stream created successfully")

    // 返回AI SDK标准的流式响应
    return result.toDataStreamResponse()
  } catch (error) {
    console.error("=== Chat API Error ===")
    console.error("Error details:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return Response.json(
      {
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
