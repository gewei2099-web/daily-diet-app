import React, { useState, useEffect, useRef } from 'react'
import {
  getApiConfig,
  saveApiConfig,
  getScoreGradeConfig,
  saveScoreGradeConfig,
  getUserProfile,
  saveUserProfile,
  getFavoriteMeals,
  saveFavoriteMeals,
  getSettingsLog,
  appendSettingsLog,
  clearSettingsLog,
  exportData,
  importData
} from '../utils/storage'
import { uuid } from '../utils/uuid'

const MEAL_TYPES = ['早餐', '午餐', '晚餐', '加餐']

function useDebouncedSettingsLog(setLog, message, deps, delay = 1200) {
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(() => {
      const next = appendSettingsLog(message)
      setLog(next)
    }, delay)
    return () => clearTimeout(t)
  }, deps)
}

export default function Settings() {
  const [config, setConfig] = useState(getApiConfig())
  const [scoreGradeConfig, setScoreGradeConfig] = useState(getScoreGradeConfig())
  const [profile, setProfile] = useState(getUserProfile())
  const [favorites, setFavorites] = useState(() => getFavoriteMeals())
  const [settingsLog, setSettingsLog] = useState(() => getSettingsLog())
  const [saved, setSaved] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    saveApiConfig(config)
    setSaved(true)
    const t = setTimeout(() => setSaved(false), 1500)
    return () => clearTimeout(t)
  }, [config])

  useEffect(() => {
    saveScoreGradeConfig(scoreGradeConfig)
    setSaved(true)
    const t = setTimeout(() => setSaved(false), 1500)
    return () => clearTimeout(t)
  }, [scoreGradeConfig])

  useEffect(() => {
    saveUserProfile(profile)
  }, [profile])

  useEffect(() => {
    saveFavoriteMeals(favorites)
  }, [favorites])

  useDebouncedSettingsLog(setSettingsLog, 'LLM 配置已更新', [config.apiKey, config.baseUrl, config.model])
  useDebouncedSettingsLog(setSettingsLog, '评分阈值已更新', [scoreGradeConfig.S, scoreGradeConfig.A, scoreGradeConfig.B, scoreGradeConfig.C])
  useDebouncedSettingsLog(setSettingsLog, '个人体质已更新', [JSON.stringify(profile)])
  useDebouncedSettingsLog(setSettingsLog, '常用饮食已更新', [JSON.stringify(favorites)])

  const update = (k, v) => setConfig(prev => ({ ...prev, [k]: v }))

  const updateProfile = (k, v) => setProfile(prev => ({ ...prev, [k]: v }))

  const addFavorite = () => {
    setFavorites(prev => [...prev, { id: uuid(), name: '', foodText: '', mealType: '早餐', cost: '' }])
  }

  const updateFavorite = (idx, patch) => {
    setFavorites(prev => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  }

  const removeFavorite = (idx) => {
    setFavorites(prev => prev.filter((_, i) => i !== idx))
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    a.download = `daily-diet-backup-${dateStr}-${timeStr}.json`
    a.click()
    URL.revokeObjectURL(url)
    const next = appendSettingsLog('已导出数据备份')
    setSettingsLog(next)
  }

  const runImport = (file, mode) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const result = importData(reader.result, mode)
        if (result.ok) {
          const logMsg = mode === 'overwrite' ? '数据：覆盖导入' : '数据：合并导入'
          appendSettingsLog(logMsg)
          setImportMsg({ type: 'ok', text: '导入成功，请刷新页面' })
          setTimeout(() => window.location.reload(), 1000)
        } else {
          setImportMsg({ type: 'error', text: result.error || '导入失败' })
        }
      } catch (err) {
        setImportMsg({ type: 'error', text: err.message || '解析失败' })
      }
    }
    reader.readAsText(file)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    runImport(file, 'overwrite')
    e.target.value = ''
  }

  const handleImportMerge = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    runImport(file, 'merge')
    e.target.value = ''
  }

  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? String(__BUILD_TIME__) : ''

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>设置</h1>
      {buildTime && (
        <div style={styles.version}>构建：{buildTime}</div>
      )}

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>LLM 配置（可选）</h2>
        <p style={styles.hint}>用于每日饮食分析与分级。API Key 仅存本机，不上传。</p>
        <div style={styles.field}>
          <label>API Key</label>
          <input
            type="password"
            placeholder="sk-xxx"
            value={config.apiKey ?? ''}
            onChange={e => update('apiKey', e.target.value)}
            autoComplete="off"
          />
        </div>
        <div style={styles.field}>
          <label>接口地址</label>
          <input
            placeholder="https://api.openai.com/v1"
            value={config.baseUrl ?? ''}
            onChange={e => update('baseUrl', e.target.value)}
          />
        </div>
        <div style={styles.field}>
          <label>模型</label>
          <input
            placeholder="gpt-4o-mini"
            value={config.model ?? ''}
            onChange={e => update('model', e.target.value)}
          />
        </div>
        {saved && <div style={styles.saved}>已保存</div>}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>评分阈值（可选）</h2>
        <p style={styles.hint}>用于把分析结果的 score 映射到 grade。数值越高，对应等级越严格。</p>
        <div style={styles.row}>
          <div style={styles.fieldSmall}>
            <label>S（最优）最小分</label>
            <input
              type="number"
              value={scoreGradeConfig.S}
              onChange={e => setScoreGradeConfig(prev => ({ ...prev, S: e.target.value }))}
              style={styles.input}
            />
          </div>
          <div style={styles.fieldSmall}>
            <label>A（优秀）最小分</label>
            <input
              type="number"
              value={scoreGradeConfig.A}
              onChange={e => setScoreGradeConfig(prev => ({ ...prev, A: e.target.value }))}
              style={styles.input}
            />
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.fieldSmall}>
            <label>B（良好）最小分</label>
            <input
              type="number"
              value={scoreGradeConfig.B}
              onChange={e => setScoreGradeConfig(prev => ({ ...prev, B: e.target.value }))}
              style={styles.input}
            />
          </div>
          <div style={styles.fieldSmall}>
            <label>C（中等）最小分</label>
            <input
              type="number"
              value={scoreGradeConfig.C}
              onChange={e => setScoreGradeConfig(prev => ({ ...prev, C: e.target.value }))}
              style={styles.input}
            />
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>个人体质（可选）</h2>
        <p style={styles.hint}>用于分析时参考大致热量需求与活动水平；非医疗诊断，仅供参考。</p>
        <div style={styles.row}>
          <div style={styles.fieldSmall}>
            <label>体重（kg）</label>
            <input value={profile.weightKg ?? ''} onChange={e => updateProfile('weightKg', e.target.value)} style={styles.input} placeholder="如 65" />
          </div>
          <div style={styles.fieldSmall}>
            <label>身高（cm）</label>
            <input value={profile.heightCm ?? ''} onChange={e => updateProfile('heightCm', e.target.value)} style={styles.input} placeholder="如 170" />
          </div>
          <div style={styles.fieldSmall}>
            <label>年龄</label>
            <input value={profile.age ?? ''} onChange={e => updateProfile('age', e.target.value)} style={styles.input} placeholder="如 30" />
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.fieldSmall}>
            <label>性别</label>
            <select value={profile.sex ?? ''} onChange={e => updateProfile('sex', e.target.value)} style={styles.select}>
              <option value="">不填</option>
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div style={{ ...styles.fieldSmall, flex: '2 1 280px' }}>
            <label>日常活动量</label>
            <select value={profile.activityLevel ?? ''} onChange={e => updateProfile('activityLevel', e.target.value)} style={styles.select}>
              <option value="">不填</option>
              <option value="久坐少动">久坐少动</option>
              <option value="轻度活动">轻度活动</option>
              <option value="中度活动">中度活动</option>
              <option value="高强度">高强度</option>
            </select>
          </div>
        </div>
        <div style={styles.field}>
          <label>备注（可选）</label>
          <textarea
            value={profile.note ?? ''}
            onChange={e => updateProfile('note', e.target.value)}
            placeholder="如：减脂期、素食、过敏提示（仍非医疗建议）"
            style={styles.textarea}
            rows={3}
          />
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>常用饮食</h2>
        <p style={styles.hint}>在「新建/编辑每日饮食」中可一键填入本条餐食的食物描述、餐别与默认费用。</p>
        {favorites.length === 0 && (
          <p style={styles.muted}>暂无条目，点击下方按钮添加。</p>
        )}
        {favorites.map((f, idx) => (
          <div key={f.id || idx} style={styles.favCard}>
            <div style={styles.row}>
              <div style={styles.fieldSmall}>
                <label>显示名称</label>
                <input value={f.name ?? ''} onChange={e => updateFavorite(idx, { name: e.target.value })} style={styles.input} placeholder="如：公司盒饭" />
              </div>
              <div style={{ ...styles.fieldSmall, flex: '2 1 240px' }}>
                <label>食物描述</label>
                <input value={f.foodText ?? ''} onChange={e => updateFavorite(idx, { foodText: e.target.value })} style={styles.input} placeholder="米饭+青菜+鸡腿…" />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldSmall}>
                <label>默认餐别</label>
                <select value={f.mealType || '早餐'} onChange={e => updateFavorite(idx, { mealType: e.target.value })} style={styles.select}>
                  {MEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={styles.fieldSmall}>
                <label>默认费用（元）</label>
                <input type="number" value={f.cost ?? ''} onChange={e => updateFavorite(idx, { cost: e.target.value })} style={styles.input} placeholder="可选" />
              </div>
              <div style={{ alignSelf: 'flex-end', marginBottom: 4 }}>
                <button type="button" onClick={() => removeFavorite(idx)} style={styles.dangerBtn}>删除</button>
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={addFavorite} style={styles.btn}>+ 添加常用饮食</button>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>配置变更日志</h2>
        <p style={styles.hint}>上述配置在保存后约 1.2 秒内自动记入（避免每次按键一条）。导入/导出也会记录。</p>
        <div style={styles.btnRow}>
          <button type="button" className="secondary" onClick={() => { clearSettingsLog(); setSettingsLog([]) }} style={styles.btn}>
            清空日志
          </button>
        </div>
        <div style={styles.logBox}>
          {settingsLog.length === 0 ? (
            <div style={styles.muted}>暂无记录</div>
          ) : (
            settingsLog.map((row, i) => (
              <div key={`${row.at}-${i}`} style={styles.logRow}>
                <span style={styles.logTime}>{String(row.at || '').slice(0, 19).replace('T', ' ')}</span>
                <span style={styles.logMsg}>{row.message}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>数据导入/导出</h2>
        <p style={styles.hint}>数据存于本机，换设备需导出后在新设备导入。</p>
        <div style={styles.btnRow}>
          <button type="button" onClick={handleExport} style={styles.btn}>导出 JSON</button>
        </div>
        <div style={styles.btnRow}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="secondary"
            style={styles.btn}
          >
            覆盖导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <button
            type="button"
            onClick={() => document.getElementById('import-merge-diet')?.click()}
            className="secondary"
            style={styles.btn}
          >
            合并导入
          </button>
          <input
            id="import-merge-diet"
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportMerge}
          />
        </div>
        {importMsg && (
          <div style={importMsg.type === 'ok' ? styles.msgOk : styles.msgErr}>
            {importMsg.text}
          </div>
        )}
      </section>
    </div>
  )
}

const styles = {
  page: { padding: 16, paddingBottom: 80 },
  title: { fontSize: 22, marginBottom: 16, fontWeight: 600 },
  version: { fontSize: 13, color: '#888', marginBottom: 12 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, marginBottom: 8 },
  hint: { fontSize: 14, color: '#666', marginBottom: 12 },
  muted: { fontSize: 14, color: '#888', marginBottom: 8 },
  field: { marginBottom: 16 },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' },
  select: { width: '100%', padding: '10px 12px', fontSize: 16, borderRadius: 8, border: '1px solid #ddd' },
  fieldSmall: { flex: '1 1 200px' },
  fieldHint: { fontSize: 12, color: '#888', marginTop: 4 },
  input: { width: '100%', padding: '10px 12px', fontSize: 16, borderRadius: 8, border: '1px solid #ddd', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', fontSize: 15, borderRadius: 8, border: '1px solid #ddd', boxSizing: 'border-box', resize: 'vertical' },
  saved: { color: '#0a0', fontSize: 14, marginBottom: 8 },
  btnRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 },
  btn: { padding: '10px 16px' },
  dangerBtn: { padding: '8px 14px', color: '#c00', border: '1px solid #ccc', borderRadius: 8, background: '#fff', cursor: 'pointer' },
  msgOk: { color: '#0a0', fontSize: 14, marginTop: 8 },
  msgErr: { color: '#c00', fontSize: 14, marginTop: 8 },
  favCard: { border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, marginBottom: 12, background: '#f8f9fa' },
  logBox: { maxHeight: 280, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, background: '#fafafa', fontSize: 13 },
  logRow: { display: 'flex', gap: 10, flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid #eee' },
  logTime: { color: '#888', fontFamily: 'monospace', flex: '0 0 auto' },
  logMsg: { color: '#333', flex: '1 1 200px' }
}
