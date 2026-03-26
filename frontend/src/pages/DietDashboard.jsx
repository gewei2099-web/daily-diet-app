import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getDailyEntries } from '../utils/storage'

export default function DietDashboard() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const entry = useMemo(() => {
    const list = getDailyEntries()
    return list.find(e => e?.date === today) || null
  }, [today])

  const meals = Array.isArray(entry?.meals) ? entry.meals : []
  const dayCost = useMemo(() => {
    return meals.reduce((sum, m) => {
      const n = parseFloat(m?.cost)
      return Number.isNaN(n) ? sum : sum + n
    }, 0)
  }, [meals])

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>今日概览</h1>

      <div style={styles.card}>
        <div style={styles.label}>日期</div>
        <div style={styles.text}>{today}</div>
      </div>

      {!entry ? (
        <div style={styles.card}>
          <div style={styles.label}>状态</div>
          <div style={styles.text}>今天还没有录入。请先新建每日饮食并填写至少一条 foodText。</div>
          <div style={styles.row}>
            <Link to="/day/new" style={styles.btn}>新建每日饮食</Link>
          </div>
        </div>
      ) : (
        <div style={styles.card}>
          <div style={styles.label}>花销 & 分级</div>
          <div style={styles.summaryRow}>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>花销合计</div>
              <div style={styles.summaryValue}>¥{(dayCost || 0).toLocaleString()}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>营养分级</div>
              <div style={styles.summaryValue}>
                {entry.analysis?.grade ? `${entry.analysis.grade}（${entry.analysis.score} 分）` : '未分析'}
              </div>
            </div>
          </div>

          <div style={styles.row}>
            <Link to={`/day/${entry.id}`} style={styles.btnSecondary}>去详情分析</Link>
            <Link to={`/day/${entry.id}/edit`} style={styles.btn}>继续录入</Link>
          </div>
        </div>
      )}

      {entry?.analysis?.totals && (
        <div style={styles.card}>
          <div style={styles.label}>热量与宏量营养</div>
          <div style={styles.totalsGrid}>
            <div style={styles.totalItem}><div style={styles.totalLabel}>热量</div><div style={styles.totalValue}>{entry.analysis.totals.caloriesKcal ?? '-'} kcal</div></div>
            <div style={styles.totalItem}><div style={styles.totalLabel}>蛋白</div><div style={styles.totalValue}>{entry.analysis.totals.proteinG ?? '-'} g</div></div>
            <div style={styles.totalItem}><div style={styles.totalLabel}>碳水</div><div style={styles.totalValue}>{entry.analysis.totals.carbsG ?? '-'} g</div></div>
            <div style={styles.totalItem}><div style={styles.totalLabel}>脂肪</div><div style={styles.totalValue}>{entry.analysis.totals.fatG ?? '-'} g</div></div>
            <div style={styles.totalItem}><div style={styles.totalLabel}>纤维</div><div style={styles.totalValue}>{entry.analysis.totals.fiberG ?? '-'} g</div></div>
          </div>
        </div>
      )}

      {meals.length > 0 && (
        <div style={styles.card}>
          <div style={styles.label}>当日条目</div>
          <div style={styles.mealList}>
            {meals.map((m, i) => {
              const costText = m?.cost != null && m?.cost !== '' ? ` · ¥${m.cost}` : ''
              return (
                <div key={m.id || i} style={styles.mealItem}>
                  <div style={styles.mealTop}>
                    <span style={styles.mealType}>{m.mealType || '未设置'}</span>
                    <span style={styles.mealTime}>{m.time ? m.time : ''}</span>
                    <span style={styles.mealCost}>{costText}</span>
                  </div>
                  <div style={styles.mealFood}>{m.foodText}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={styles.navRow}>
        <Link to="/days" style={styles.navLink}>查看日记录</Link>
        <Link to="/expenses" style={styles.navLink}>花销汇总</Link>
      </div>
    </div>
  )
}

const styles = {
  page: { padding: 16, paddingBottom: 80 },
  title: { fontSize: 22, marginBottom: 16, fontWeight: 600 },
  card: { background: '#fff', padding: 16, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 12 },
  label: { fontSize: 13, color: '#666', marginBottom: 8 },
  text: { fontSize: 14, color: '#444', lineHeight: 1.6 },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 },
  btn: { padding: '10px 16px', background: '#0d7377', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 },
  btnSecondary: { padding: '10px 16px', background: '#f3f4f6', color: '#0d7377', borderRadius: 8, textDecoration: 'none', fontWeight: 600, border: '1px solid #e5e7eb' },
  summaryRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  summaryItem: { flex: '1 1 180px', background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 },
  summaryLabel: { fontSize: 13, color: '#666', marginBottom: 6 },
  summaryValue: { fontSize: 16, fontWeight: 900, color: '#111' },
  totalsGrid: { display: 'flex', flexWrap: 'wrap', gap: 12 },
  totalItem: { flex: '1 1 160px', background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, minWidth: 160 },
  totalLabel: { fontSize: 13, color: '#666', marginBottom: 6 },
  totalValue: { fontSize: 16, fontWeight: 900, color: '#111' },
  mealList: { display: 'flex', flexDirection: 'column', gap: 12 },
  mealItem: { background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 },
  mealTop: { display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' },
  mealType: { fontWeight: 900, color: '#0d7377' },
  mealTime: { fontWeight: 700, color: '#666', fontSize: 13 },
  mealCost: { marginLeft: 'auto', fontWeight: 900, color: '#0d7377' },
  mealFood: { marginTop: 6, fontSize: 14, fontWeight: 600, color: '#111', wordBreak: 'break-word' },
  navRow: { display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 16 },
  navLink: { color: '#0d7377', textDecoration: 'underline', fontWeight: 600, fontSize: 14 }
}

