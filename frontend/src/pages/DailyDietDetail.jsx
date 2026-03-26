import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { analyzeDailyDiet } from '../utils/dietAnalysis'
import { getDailyEntryById, saveDailyEntry } from '../utils/storage'

export default function DailyDietDetail() {
  const { id } = useParams()
  const [aiLoading, setAiLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const entry = getDailyEntryById(id)

  const dayCost = useMemo(() => {
    const meals = Array.isArray(entry?.meals) ? entry.meals : []
    return meals.reduce((sum, m) => {
      const n = parseFloat(m?.cost)
      if (!Number.isNaN(n)) return sum + n
      return sum
    }, 0)
  }, [id])

  const mealsForAi = useMemo(() => {
    const meals = Array.isArray(entry?.meals) ? entry.meals : []
    return meals.filter(m => (m?.foodText || '').trim().length > 0)
  }, [entry])

  return (
    <div style={styles.page}>
      <div style={styles.actions}>
        <Link to="/days" style={styles.back}>← 返回</Link>
        {entry?.id && <Link to={`/day/${entry.id}/edit`} style={styles.edit}>编辑</Link>}
      </div>

      <h1 style={styles.title}>每日饮食详情</h1>

      {!entry ? (
        <div style={styles.card}>
          <div style={styles.label}>记录不存在</div>
          <div style={styles.text}>请返回列表重新选择。</div>
        </div>
      ) : (
        <>
          <div style={styles.metaRow}>
            <div style={styles.metaItem}>
              <div style={styles.metaLabel}>日期</div>
              <div style={styles.metaValue}>{entry.date}</div>
            </div>
            <div style={styles.metaItem}>
              <div style={styles.metaLabel}>花销合计</div>
              <div style={styles.metaValue}>¥{(dayCost || 0).toLocaleString()}</div>
            </div>
            <div style={styles.metaItem}>
              <div style={styles.metaLabel}>分级</div>
              <div style={styles.metaValue}>
                {entry.analysis?.grade ? `${entry.analysis.grade}（${entry.analysis.score} 分）` : '未分析'}
              </div>
            </div>
          </div>

          {(entry.analysis || null) && (
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>营养概览</h2>
              <div style={styles.totalsGrid}>
                <div style={styles.totalItem}><div style={styles.totalLabel}>热量</div><div style={styles.totalValue}>{entry.analysis.totals?.caloriesKcal ?? '-'} kcal</div></div>
                <div style={styles.totalItem}><div style={styles.totalLabel}>蛋白</div><div style={styles.totalValue}>{entry.analysis.totals?.proteinG ?? '-'} g</div></div>
                <div style={styles.totalItem}><div style={styles.totalLabel}>碳水</div><div style={styles.totalValue}>{entry.analysis.totals?.carbsG ?? '-'} g</div></div>
                <div style={styles.totalItem}><div style={styles.totalLabel}>脂肪</div><div style={styles.totalValue}>{entry.analysis.totals?.fatG ?? '-'} g</div></div>
                <div style={styles.totalItem}><div style={styles.totalLabel}>纤维</div><div style={styles.totalValue}>{entry.analysis.totals?.fiberG ?? '-'} g</div></div>
              </div>

              {(entry.analysis.shortcomings || []).length > 0 && (
                <div style={styles.section}>
                  <h3 style={styles.smallTitle}>关键短板</h3>
                  <ul style={styles.ul}>
                    {(entry.analysis.shortcomings || []).map((s, i) => <li key={i} style={styles.li}>{s}</li>)}
                  </ul>
                </div>
              )}

              {(entry.analysis.tips || []).length > 0 && (
                <div style={styles.section}>
                  <h3 style={styles.smallTitle}>建议</h3>
                  <ul style={styles.ul}>
                    {(entry.analysis.tips || []).map((t, i) => <li key={i} style={styles.li}>{t}</li>)}
                  </ul>
                </div>
              )}

              {entry.analysis.updatedAt && (
                <div style={styles.updatedAt}>分析时间：{String(entry.analysis.updatedAt).slice(0, 19).replace('T', ' ')}</div>
              )}
            </div>
          )}

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>餐/食物明细</h2>
            {(entry.meals || []).length === 0 ? (
              <div style={styles.text}>暂无条目。</div>
            ) : (
              <div style={styles.mealList}>
                {(entry.meals || []).map((m, idx) => {
                  const costText = m?.cost != null && m?.cost !== '' ? ` · ¥${m.cost}` : ''
                  const timeText = m?.time ? ` ${m.time}` : ''
                  return (
                    <div key={m.id || idx} style={styles.mealItem}>
                      <div style={styles.mealHead}>
                        <span style={styles.mealType}>{m.mealType || '未设置'}</span>
                        <span style={styles.mealTime}>{timeText}</span>
                        <span style={styles.mealCost}>{costText}</span>
                      </div>
                      <div style={styles.mealFood}>{m.foodText || ''}</div>
                      {m.note && <div style={styles.mealNote}>备注：{m.note}</div>}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={styles.aiActions}>
              <button
                type="button"
                disabled={aiLoading || mealsForAi.length === 0}
                onClick={async () => {
                  setMsg(null)
                  if (mealsForAi.length === 0) {
                    setMsg({ type: 'error', text: '没有可用于分析的食物描述（foodText）' })
                    return
                  }
                  setAiLoading(true)
                  try {
                    const analysis = await analyzeDailyDiet({ date: entry.date, meals: mealsForAi })
                    saveDailyEntry({ ...entry, analysis })
                    setMsg({ type: 'ok', text: '重新分析完成' })
                    // 直接刷新页面状态：通过简单重新获取（下一次渲染会读到 localStorage）
                    window.location.reload()
                  } catch (err) {
                    setMsg({ type: 'error', text: `分析失败：${err.message}` })
                  } finally {
                    setAiLoading(false)
                  }
                }}
                style={styles.aiBtn}
              >
                {aiLoading ? '分析中…' : '重新分析'}
              </button>
            </div>
          </div>

          {msg && (
            <div style={msg.type === 'ok' ? styles.msgOk : styles.msgErr}>{msg.text}</div>
          )}
        </>
      )}
    </div>
  )
}

const styles = {
  page: { padding: 16, paddingBottom: 80 },
  actions: { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  back: { fontSize: 14, color: '#0d7377', textDecoration: 'underline' },
  edit: { fontSize: 14, color: '#0d7377', textDecoration: 'underline' },
  title: { fontSize: 22, marginBottom: 16, fontWeight: 600 },
  metaRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 },
  metaItem: { background: '#fff', padding: 12, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flex: '1 1 180px' },
  metaLabel: { fontSize: 13, color: '#666', marginBottom: 6 },
  metaValue: { fontSize: 16, fontWeight: 700, color: '#111' },
  card: { background: '#fff', padding: 16, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 12 },
  label: { fontSize: 13, color: '#666', marginBottom: 8 },
  text: { fontSize: 14, color: '#444', lineHeight: 1.6, wordBreak: 'break-all' },
  sectionTitle: { fontSize: 16, marginBottom: 10, fontWeight: 600 },
  totalsGrid: { display: 'flex', flexWrap: 'wrap', gap: 12 },
  totalItem: { background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, minWidth: 160, flex: '1 1 160px' },
  totalLabel: { fontSize: 13, color: '#666', marginBottom: 6 },
  totalValue: { fontSize: 16, fontWeight: 800, color: '#111' },
  section: { marginTop: 14 },
  smallTitle: { fontSize: 14, fontWeight: 700, color: '#0d7377', marginBottom: 8 },
  ul: { margin: 0, paddingLeft: 18 },
  li: { marginBottom: 6, fontSize: 14, color: '#444', lineHeight: 1.5 },
  updatedAt: { marginTop: 12, fontSize: 12, color: '#888' },
  mealList: { display: 'flex', flexDirection: 'column', gap: 12 },
  mealItem: { padding: 14, background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 12 },
  mealHead: { display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 8 },
  mealType: { fontSize: 15, fontWeight: 800, color: '#0d7377' },
  mealTime: { fontSize: 13, color: '#666', fontWeight: 600 },
  mealCost: { marginLeft: 'auto', fontSize: 14, fontWeight: 800, color: '#0d7377' },
  mealFood: { fontSize: 14, color: '#111', fontWeight: 600, marginBottom: 4, whiteSpace: 'pre-wrap' },
  mealNote: { fontSize: 13, color: '#666', lineHeight: 1.5 },
  aiActions: { marginTop: 14 },
  aiBtn: { width: '100%', padding: '12px 16px', fontSize: 15, borderRadius: 10, background: '#0d7377', color: '#fff', border: '1px solid #0d7377', cursor: 'pointer' },
  msgOk: { marginTop: 12, color: '#0a0', fontSize: 14 },
  msgErr: { marginTop: 12, color: '#c00', fontSize: 14 }
}

