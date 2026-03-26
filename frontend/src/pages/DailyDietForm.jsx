import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DateSelect from '../components/DateSelect'
import TimeSelect from '../components/TimeSelect'
import { uuid } from '../utils/uuid'
import { getDailyEntryById, saveDailyEntry } from '../utils/storage'
import { analyzeDailyDiet } from '../utils/dietAnalysis'

export default function DailyDietForm() {
  const { id } = useParams()
  const navigate = useNavigate()

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const MEAL_TYPES = ['早餐', '午餐', '晚餐', '加餐']

  function emptyMeal() {
    return { id: uuid(), mealType: '早餐', time: '', foodText: '', cost: '', note: '' }
  }

  const [form, setForm] = useState({
    date: today,
    meals: [emptyMeal()],
    analysis: null
  })

  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (!id) return
    const entry = getDailyEntryById(id)
    if (entry) {
      setForm({
        date: entry.date || today,
        meals: Array.isArray(entry.meals) && entry.meals.length > 0 ? entry.meals : [emptyMeal()],
        analysis: entry.analysis || null
      })
    }
  }, [id])

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const updateMeal = (idx, k, v) => {
    setForm(prev => ({
      ...prev,
      meals: prev.meals.map((m, i) => (i === idx ? { ...m, [k]: v } : m))
    }))
  }

  const addMeal = () => update('meals', [...(form.meals || []), emptyMeal()])

  const removeMeal = (idx) => {
    const next = (form.meals || []).filter((_, i) => i !== idx)
    update('meals', next.length > 0 ? next : [emptyMeal()])
  }

  const getFilteredMeals = () => {
    return (form.meals || []).filter(m => (m.foodText || '').trim().length > 0)
  }

  const buildEntry = () => {
    const meals = (form.meals || []).map(m => ({
      ...m,
      id: m.id || uuid(),
      cost: m.cost === '' || m.cost == null ? '' : m.cost
    }))
    return {
      id: id || uuid(),
      date: form.date,
      meals,
      analysis: form.analysis || null
    }
  }

  const handleSave = async () => {
    setMsg(null)
    if (!form.date) {
      setMsg({ type: 'error', text: '请选择日期' })
      return
    }
    setSaving(true)
    try {
      const entry = buildEntry()
      saveDailyEntry(entry)
      setMsg({ type: 'ok', text: '保存成功' })
      navigate(`/day/${entry.id}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAnalyze = async () => {
    setMsg(null)
    if (!form.date) {
      setMsg({ type: 'error', text: '请选择日期' })
      return
    }
    const mealsForAi = getFilteredMeals()
    if (mealsForAi.length === 0) {
      setMsg({ type: 'error', text: '请至少填写一条餐/食物（foodText）' })
      return
    }

    setAiLoading(true)
    try {
      const entry = buildEntry()
      // 先保存 meals，避免分析成功后用户刷新丢失
      saveDailyEntry(entry)

      const analysis = await analyzeDailyDiet({ date: entry.date, meals: mealsForAi })
      const updated = { ...entry, analysis }
      saveDailyEntry(updated)
      setForm(prev => ({ ...prev, analysis }))
      setMsg({ type: 'ok', text: '分析完成' })
      navigate(`/day/${entry.id}`)
    } catch (err) {
      setMsg({ type: 'error', text: `分析失败：${err.message}` })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.actions}>
        <Link to={id ? `/day/${id}` : '/'} style={styles.back}>← 返回</Link>
      </div>

      <h1 style={styles.title}>{id ? '编辑每日饮食' : '新建每日饮食'}</h1>

      <div style={styles.section}>
        <div style={styles.field}>
          <label style={styles.label}>日期</label>
          <DateSelect value={form.date} onChange={v => update('date', v)} />
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>餐/食物条目</h2>
        <p style={styles.hint}>每条可以输入“食物名称 + 份量/描述”，费用用于花销统计（不直接参与营养估算）。</p>

        {(form.meals || []).map((m, idx) => (
          <div key={m.id || idx} style={styles.mealCard}>
            <div style={styles.mealRow}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={styles.smallLabel}>类型</label>
                <select value={m.mealType || '早餐'} onChange={e => updateMeal(idx, 'mealType', e.target.value)} style={styles.select}>
                  {MEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={styles.smallLabel}>时间（可选）</label>
                <TimeSelect value={m.time || ''} onChange={v => updateMeal(idx, 'time', v)} />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.smallLabel}>食物描述</label>
              <input
                value={m.foodText || ''}
                onChange={e => updateMeal(idx, 'foodText', e.target.value)}
                placeholder="如：米饭200g + 鸡蛋1个 + 青菜一份"
                style={styles.input}
              />
            </div>

            <div style={styles.mealRow}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={styles.smallLabel}>费用（元，可选）</label>
                <input
                  type="number"
                  value={m.cost ?? ''}
                  onChange={e => updateMeal(idx, 'cost', e.target.value)}
                  placeholder="0"
                  style={styles.input}
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={styles.smallLabel}>备注（可选）</label>
                <input
                  value={m.note || ''}
                  onChange={e => updateMeal(idx, 'note', e.target.value)}
                  placeholder="如：少油/外卖/运动后等"
                  style={styles.input}
                />
              </div>
            </div>

            {(form.meals || []).length > 1 && (
              <button type="button" onClick={() => removeMeal(idx)} style={styles.removeBtn}>
                删除
              </button>
            )}
          </div>
        ))}

        <button type="button" onClick={addMeal} style={styles.addBtn}>
          + 添加一条
        </button>
      </div>

      {msg && (
        <div style={msg.type === 'ok' ? styles.msgOk : styles.msgErr}>
          {msg.text}
        </div>
      )}

      <div style={styles.btnRow}>
        <button type="button" onClick={handleSave} disabled={saving || aiLoading} style={styles.btn}>
          {saving ? '保存中…' : '保存'}
        </button>
        <button type="button" onClick={handleAnalyze} disabled={saving || aiLoading} style={styles.aiBtn}>
          {aiLoading ? '分析中…' : '分析当日饮食'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: { padding: 16, paddingBottom: 80 },
  actions: { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  back: { fontSize: 14, color: '#0d7377', textDecoration: 'underline' },
  title: { fontSize: 22, marginBottom: 16, fontWeight: 600 },
  section: { marginTop: 18, background: '#fff', padding: 16, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  field: { marginBottom: 14 },
  label: { fontSize: 13, color: '#666', marginBottom: 8, fontWeight: 600, display: 'block' },
  sectionTitle: { fontSize: 16, marginBottom: 8, fontWeight: 600 },
  hint: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.5 },
  mealCard: { border: '1px solid #e5e7eb', background: '#f8f9fa', borderRadius: 12, padding: 14, marginBottom: 14 },
  mealRow: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 12 },
  smallLabel: { fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 600, display: 'block' },
  input: { width: '100%', padding: '12px 14px', fontSize: 16, borderRadius: 8, border: '1px solid #ddd', minHeight: 44, background: '#fff', boxSizing: 'border-box' },
  select: { width: '100%', padding: '12px 14px', fontSize: 16, borderRadius: 8, border: '1px solid #ddd', minHeight: 44, background: '#fff' },
  removeBtn: { padding: '10px 14px', fontSize: 14, background: 'none', border: '1px solid #ccc', borderRadius: 8, cursor: 'pointer', color: '#c00', fontWeight: 600, marginTop: 6 },
  addBtn: { padding: '14px 18px', fontSize: 15, minHeight: 44, width: '100%', borderRadius: 10, border: '1px dashed #ccc', background: '#fafafa', cursor: 'pointer' },
  msgOk: { marginTop: 14, color: '#0a0', fontSize: 14 },
  msgErr: { marginTop: 14, color: '#c00', fontSize: 14 },
  btnRow: { display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' },
  btn: { flex: 1, minWidth: 160, padding: '12px 16px', fontSize: 15, borderRadius: 10, background: '#eee', border: '1px solid #ddd', cursor: 'pointer' },
  aiBtn: { flex: 1, minWidth: 160, padding: '12px 16px', fontSize: 15, borderRadius: 10, background: '#0d7377', border: '1px solid #0d7377', color: '#fff', cursor: 'pointer' }
}

