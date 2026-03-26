import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getDailyEntries } from '../utils/storage'

export default function DailyDietList() {
  const entries = useMemo(() => {
    const list = getDailyEntries()
    return [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [])

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>日记录</h1>
      {entries.length === 0 ? (
        <div style={styles.card}>
          <div style={styles.label}>暂无记录</div>
          <div style={styles.text}>从“新建每日饮食”开始录入今天的餐/食物与花销。</div>
          <div style={styles.row}>
            <Link to="/day/new" style={styles.btn}>新建每日饮食</Link>
          </div>
        </div>
      ) : (
        <div style={styles.list}>
          {entries.map(e => {
            const analyzed = !!e.analysis?.score
            const grade = e.analysis?.grade
            const score = e.analysis?.score
            return (
              <div key={e.id} style={styles.item}>
                <Link to={`/day/${e.id}`} style={styles.link}>
                  <div style={styles.itemDate}>{e.date}</div>
                  <div style={styles.itemMeta}>
                    {analyzed ? (
                      <span style={styles.badge}>{grade} · {score} 分</span>
                    ) : (
                      <span style={styles.badgeEmpty}>未分析</span>
                    )}
                  </div>
                </Link>
                <div style={styles.actions}>
                  <Link to={`/day/${e.id}/edit`} style={styles.edit}>编辑</Link>
                </div>
              </div>
            )
          })}
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
  text: { fontSize: 14, color: '#444', lineHeight: 1.6 },
  row: { marginTop: 14 },
  btn: { padding: '10px 16px', background: '#0d7377', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  item: { background: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: 14, display: 'flex', alignItems: 'center', gap: 12 },
  link: { flex: 1, textDecoration: 'none', color: '#111' },
  itemDate: { fontWeight: 800, fontSize: 16, marginBottom: 6 },
  itemMeta: { display: 'flex', alignItems: 'center', gap: 10 },
  badge: { display: 'inline-block', background: '#e9f6f2', color: '#0d7377', border: '1px solid #bfe7dc', padding: '4px 10px', borderRadius: 999, fontWeight: 800, fontSize: 13 },
  badgeEmpty: { display: 'inline-block', background: '#f3f4f6', color: '#666', padding: '4px 10px', borderRadius: 999, fontWeight: 800, fontSize: 13 },
  actions: { display: 'flex' },
  edit: { padding: '8px 12px', fontSize: 13, color: '#0d7377', textDecoration: 'underline', fontWeight: 600 }
}

