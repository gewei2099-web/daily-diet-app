import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getDailyEntries } from '../utils/storage'

export default function ExpenseSummary() {
  const grouped = useMemo(() => {
    const entries = getDailyEntries()
    const map = {}
    entries.forEach(e => {
      const date = e?.date
      if (!date) return
      const meals = Array.isArray(e.meals) ? e.meals : []
      const total = meals.reduce((sum, m) => {
        const n = parseFloat(m?.cost)
        return Number.isNaN(n) ? sum : sum + n
      }, 0)
      map[date] = (map[date] || 0) + total
    })
    return Object.entries(map)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [])

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>花销汇总</h1>
      {grouped.length === 0 ? (
        <div style={styles.card}>
          <div style={styles.label}>暂无花销数据</div>
          <div style={styles.text}>请先在“新建每日饮食”里填写每条餐/食物的费用（cost）。</div>
          <div style={styles.row}>
            <Link to="/day/new" style={styles.btn}>新建每日饮食</Link>
          </div>
        </div>
      ) : (
        <div style={styles.card}>
          <div style={styles.label}>按日汇总（¥）</div>
          <div style={styles.list}>
            {grouped.map(item => (
              <div key={item.date} style={styles.item}>
                <div style={styles.itemDate}>{item.date}</div>
                <div style={styles.itemTotal}>¥{(item.total || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { padding: 16, paddingBottom: 80 },
  title: { fontSize: 22, marginBottom: 16, fontWeight: 600 },
  card: { background: '#fff', padding: 16, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  label: { fontSize: 13, color: '#666', marginBottom: 8 },
  text: { fontSize: 14, color: '#444', lineHeight: 1.6, marginTop: 8 },
  row: { marginTop: 14 },
  btn: { padding: '10px 16px', background: '#0d7377', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 },
  list: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 },
  item: { display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, background: '#f8f9fa' },
  itemDate: { fontWeight: 800 },
  itemTotal: { fontWeight: 900, color: '#0d7377' }
}

