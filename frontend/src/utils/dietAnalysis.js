import { callLLM } from './llm'
import { getScoreGradeConfig } from './storage'

function scoreToGrade(score, cfg) {
  const s = Number(score)
  const c = cfg || {}
  if (!Number.isFinite(s)) return 'D'
  if (s >= c.S) return 'S'
  if (s >= c.A) return 'A'
  if (s >= c.B) return 'B'
  if (s >= c.C) return 'C'
  return 'D'
}

function extractJson(text) {
  const t = (text || '').trim()
  if (!t) return ''

  // 去掉常见代码块包裹
  const cleaned = t
    .replace(/^```(json)?/i, '')
    .replace(/```$/, '')
    .trim()

  // 优先抓取第一个 JSON 对象
  const match = cleaned.match(/\{[\s\S]*\}/)
  return match ? match[0] : cleaned
}

function normalizeTotals(totals) {
  const out = {
    caloriesKcal: Number(totals?.caloriesKcal),
    proteinG: Number(totals?.proteinG),
    carbsG: Number(totals?.carbsG),
    fatG: Number(totals?.fatG),
    fiberG: totals?.fiberG == null ? undefined : Number(totals?.fiberG)
  }
  return out
}

export async function analyzeDailyDiet({ date, meals }) {
  const safeMeals = Array.isArray(meals) ? meals : []
  const cfg = getScoreGradeConfig()

  const mealLines = safeMeals
    .map(m => {
      const mealType = m?.mealType || ''
      const time = m?.time ? ` ${m.time}` : ''
      const foodText = m?.foodText || ''
      const cost = m?.cost != null && m?.cost !== '' ? `（花费: ${m.cost} 元）` : ''
      return `- ${mealType}${time}: ${foodText}${cost}`.trim()
    })
    .join('\n')

  const prompt = `你是一位营养分析助手。用户将提供某一天的“每日饮食条目（按餐/按食物）”。请你估算这一天的总体营养与热量，并从热量合理性与营养均衡性两方面给出一个 0-100 的评分。

评估说明（不需要用户配置个人目标）：\n
1) 热量合理性：如果总热量明显偏低或偏高，则扣分。\n
2) 营养均衡性：关注宏量营养素（蛋白/碳水/脂肪）的相对比例，以及纤维摄入（如可推断）。\n
3) 你需要输出“关键短板”与“可执行建议”，每个建议尽量可落实到下一天怎么吃。\n

要求：\n
- 只输出严格 JSON（禁止 markdown / 禁止额外文字），JSON 字段如下：\n
  {\n
    "score": number(0-100),\n
    "grade": string('S'|'A'|'B'|'C'|'D'),\n
    "totals": {\n
      "caloriesKcal": number,\n
      "proteinG": number,\n
      "carbsG": number,\n
      "fatG": number,\n
      "fiberG": number|null\n
    },\n
    "shortcomings": string[](3-6 条),\n
    "tips": string[](3-6 条)\n
  }\n
- 如果某项营养无法可靠估算，用合理的默认值并在 shortcomings 里提及“可能估算偏差”。\n
- grade 规则：score>=${cfg.S} 为 S，>=${cfg.A} 为 A，>=${cfg.B} 为 B，>=${cfg.C} 为 C，其余为 D。\n

日期：${date || '未提供日期'}\n
饮食条目：\n
${mealLines || '- （无条目）'}`

  const content = await callLLM([{ role: 'user', content: prompt }])
  const jsonText = extractJson(content)
  if (!jsonText) {
    throw new Error('LLM 返回为空或未找到 JSON')
  }

  let parsed
  try {
    parsed = JSON.parse(jsonText)
  } catch (e) {
    throw new Error(`LLM JSON 解析失败：${e.message}\n原始输出：${content}`)
  }

  const score = Number(parsed?.score)
  const grade = scoreToGrade(score, cfg)
  const totals = normalizeTotals(parsed?.totals || {})

  return {
    updatedAt: new Date().toISOString(),
    score: Number.isFinite(score) ? score : 0,
    grade,
    totals,
    shortcomings: Array.isArray(parsed?.shortcomings) ? parsed.shortcomings : [],
    tips: Array.isArray(parsed?.tips) ? parsed.tips : [],
    raw: content
  }
}

