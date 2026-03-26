// NOTE: 为避免与 trip-activity-app 冲突，diet app 使用独立命名空间 key。
const TRIPS_KEY = 'diet_entries'
const STANDALONE_ACTIVITIES_KEY = 'diet_standalone_activities'
const API_CONFIG_KEY = 'diet_api_config'
const GEOCODING_CONFIG_KEY = 'diet_geocoding_config'
const APP_CONFIG_KEY = 'diet_app_config'
const SCORE_GRADE_CONFIG_KEY = 'diet_score_grade_config'
const USER_PROFILE_KEY = 'diet_user_profile'
const FAVORITE_MEALS_KEY = 'diet_favorite_meals'
const SETTINGS_LOG_KEY = 'diet_settings_log'
const EXPORT_VERSION = 2

const DEFAULT_ACTIVITY_TYPES = ['景点', '餐厅', '交通', '住宿', '其他']
const DEFAULT_PACKING_CATEGORIES = ['证件', '电子', '衣物', '洗漱', '药品', '其他']

const DEFAULT_SCORE_GRADE_CONFIG = { S: 90, A: 80, B: 70, C: 60 }

const DEFAULT_USER_PROFILE = {
  weightKg: '',
  heightCm: '',
  age: '',
  sex: '',
  activityLevel: '',
  note: ''
}

const MAX_SETTINGS_LOG = 200

// --- Trips ---
export function getTrips() {
  try {
    const raw = localStorage.getItem(TRIPS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveTrip(trip) {
  const trips = getTrips()
  const idx = trips.findIndex(t => t.id === trip.id)
  if (idx >= 0) {
    trips[idx] = trip
  } else {
    trips.unshift(trip)
  }
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips))
  return trips
}

export function deleteTrip(id) {
  const trips = getTrips().filter(t => t.id !== id)
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips))
  return trips
}

export function getTripById(id) {
  return getTrips().find(t => t.id === id)
}

// --- Daily Entries (Diet App) ---
// diet app 里把 “每日饮食记录” 作为主体对象存储在 TRIPS_KEY 对应的数组中，
// 复用 trip-activity-app 的 localStorage CRUD 习惯，提供更语义化的函数名。
export function getDailyEntries() {
  return getTrips()
}

export function saveDailyEntry(entry) {
  return saveTrip(entry)
}

export function deleteDailyEntry(id) {
  return deleteTrip(id)
}

export function getDailyEntryById(id) {
  return getTripById(id)
}

// --- Standalone Activities ---
export function getStandaloneActivities() {
  try {
    const raw = localStorage.getItem(STANDALONE_ACTIVITIES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveStandaloneActivity(activity) {
  const list = getStandaloneActivities()
  const idx = list.findIndex(a => a.id === activity.id)
  if (idx >= 0) {
    list[idx] = activity
  } else {
    list.unshift(activity)
  }
  localStorage.setItem(STANDALONE_ACTIVITIES_KEY, JSON.stringify(list))
  return list
}

export function deleteStandaloneActivity(id) {
  const list = getStandaloneActivities().filter(a => a.id !== id)
  localStorage.setItem(STANDALONE_ACTIVITIES_KEY, JSON.stringify(list))
  return list
}

export function getStandaloneActivityById(id) {
  return getStandaloneActivities().find(a => a.id === id)
}

// --- API Config ---
export function getApiConfig() {
  try {
    const raw = localStorage.getItem(API_CONFIG_KEY)
    return raw ? JSON.parse(raw) : {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini'
    }
  } catch {
    return { apiKey: '', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' }
  }
}

export function saveApiConfig(config) {
  localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config))
  return config
}

// --- Geocoding Config ---
const DEFAULT_GEOCODING_CONFIG = {
  env: 'auto',           // 'auto' | 'cn' | 'intl'
  amapKey: '',
  amapSecurityKey: '',   // 高德安全密钥（若 Key 开启数字签名则必填）
  geoapifyKey: ''
}

export function getGeocodingConfig() {
  try {
    const raw = localStorage.getItem(GEOCODING_CONFIG_KEY)
    if (!raw) return { ...DEFAULT_GEOCODING_CONFIG }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_GEOCODING_CONFIG, ...parsed }
  } catch {
    return { ...DEFAULT_GEOCODING_CONFIG }
  }
}

export function saveGeocodingConfig(config) {
  localStorage.setItem(GEOCODING_CONFIG_KEY, JSON.stringify({ ...DEFAULT_GEOCODING_CONFIG, ...config }))
  return config
}

// --- App Config (活动类型、携带物品分类) ---
const DEFAULT_APP_CONFIG = {
  activityTypes: DEFAULT_ACTIVITY_TYPES,
  packingCategories: DEFAULT_PACKING_CATEGORIES
}

export function getAppConfig() {
  try {
    const raw = localStorage.getItem(APP_CONFIG_KEY)
    if (!raw) return { ...DEFAULT_APP_CONFIG }
    const parsed = JSON.parse(raw)
    return {
      activityTypes: Array.isArray(parsed.activityTypes) && parsed.activityTypes.length > 0 ? parsed.activityTypes : DEFAULT_ACTIVITY_TYPES,
      packingCategories: Array.isArray(parsed.packingCategories) && parsed.packingCategories.length > 0 ? parsed.packingCategories : DEFAULT_PACKING_CATEGORIES
    }
  } catch {
    return { ...DEFAULT_APP_CONFIG }
  }
}

export function saveAppConfig(config) {
  const merged = {
    activityTypes: Array.isArray(config.activityTypes) && config.activityTypes.length > 0 ? config.activityTypes : DEFAULT_ACTIVITY_TYPES,
    packingCategories: Array.isArray(config.packingCategories) && config.packingCategories.length > 0 ? config.packingCategories : DEFAULT_PACKING_CATEGORIES
  }
  localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(merged))
  return merged
}

// --- Score -> Grade Config ---
export function getScoreGradeConfig() {
  try {
    const raw = localStorage.getItem(SCORE_GRADE_CONFIG_KEY)
    if (!raw) return { ...DEFAULT_SCORE_GRADE_CONFIG }
    const parsed = JSON.parse(raw)
    return {
      S: Number.isFinite(Number(parsed?.S)) ? Number(parsed.S) : DEFAULT_SCORE_GRADE_CONFIG.S,
      A: Number.isFinite(Number(parsed?.A)) ? Number(parsed.A) : DEFAULT_SCORE_GRADE_CONFIG.A,
      B: Number.isFinite(Number(parsed?.B)) ? Number(parsed.B) : DEFAULT_SCORE_GRADE_CONFIG.B,
      C: Number.isFinite(Number(parsed?.C)) ? Number(parsed.C) : DEFAULT_SCORE_GRADE_CONFIG.C
    }
  } catch {
    return { ...DEFAULT_SCORE_GRADE_CONFIG }
  }
}

export function saveScoreGradeConfig(config) {
  const merged = {
    S: Number.isFinite(Number(config?.S)) ? Number(config.S) : DEFAULT_SCORE_GRADE_CONFIG.S,
    A: Number.isFinite(Number(config?.A)) ? Number(config.A) : DEFAULT_SCORE_GRADE_CONFIG.A,
    B: Number.isFinite(Number(config?.B)) ? Number(config.B) : DEFAULT_SCORE_GRADE_CONFIG.B,
    C: Number.isFinite(Number(config?.C)) ? Number(config.C) : DEFAULT_SCORE_GRADE_CONFIG.C
  }
  localStorage.setItem(SCORE_GRADE_CONFIG_KEY, JSON.stringify(merged))
  return merged
}

// --- User profile（个人体质，供分析参考）---
export function getUserProfile() {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY)
    if (!raw) return { ...DEFAULT_USER_PROFILE }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_USER_PROFILE, ...parsed }
  } catch {
    return { ...DEFAULT_USER_PROFILE }
  }
}

export function saveUserProfile(profile) {
  const merged = { ...DEFAULT_USER_PROFILE, ...(profile || {}) }
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(merged))
  return merged
}

// --- Favorite meals（常用饮食）---
export function getFavoriteMeals() {
  try {
    const raw = localStorage.getItem(FAVORITE_MEALS_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function saveFavoriteMeals(list) {
  const arr = Array.isArray(list) ? list : []
  localStorage.setItem(FAVORITE_MEALS_KEY, JSON.stringify(arr))
  return arr
}

// --- Settings change log ---
export function getSettingsLog() {
  try {
    const raw = localStorage.getItem(SETTINGS_LOG_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function appendSettingsLog(message) {
  const msg = (message || '').trim()
  if (!msg) return getSettingsLog()
  const list = getSettingsLog()
  const entry = { at: new Date().toISOString(), message: msg }
  const next = [entry, ...list].slice(0, MAX_SETTINGS_LOG)
  localStorage.setItem(SETTINGS_LOG_KEY, JSON.stringify(next))
  return next
}

export function clearSettingsLog() {
  localStorage.setItem(SETTINGS_LOG_KEY, JSON.stringify([]))
  return []
}

// --- Import / Export ---
export function exportData() {
  const data = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    [TRIPS_KEY]: getTrips(),
    [API_CONFIG_KEY]: getApiConfig(),
    [SCORE_GRADE_CONFIG_KEY]: getScoreGradeConfig(),
    [USER_PROFILE_KEY]: getUserProfile(),
    [FAVORITE_MEALS_KEY]: getFavoriteMeals(),
    [SETTINGS_LOG_KEY]: getSettingsLog()
  }
  return JSON.stringify(data, null, 2)
}

export function importData(jsonStr, mode = 'merge') {
  try {
    const data = JSON.parse(jsonStr)
    if (!data || typeof data !== 'object') return { ok: false, error: '无效的 JSON' }

    const trips = data[TRIPS_KEY] || []
    const apiConfig = data[API_CONFIG_KEY]

    const geocodingConfig = data[GEOCODING_CONFIG_KEY]
    const appConfig = data[APP_CONFIG_KEY]
    const scoreGradeConfig = data[SCORE_GRADE_CONFIG_KEY]
    const userProfile = data[USER_PROFILE_KEY]
    const favoriteMeals = data[FAVORITE_MEALS_KEY]
    const settingsLog = data[SETTINGS_LOG_KEY]

    if (mode === 'overwrite') {
      localStorage.setItem(TRIPS_KEY, JSON.stringify(Array.isArray(trips) ? trips : []))
      if (apiConfig && typeof apiConfig === 'object') {
        localStorage.setItem(API_CONFIG_KEY, JSON.stringify(apiConfig))
      }
      if (geocodingConfig && typeof geocodingConfig === 'object') {
        localStorage.setItem(GEOCODING_CONFIG_KEY, JSON.stringify(geocodingConfig))
      }
      if (appConfig && typeof appConfig === 'object') {
        saveAppConfig(appConfig)
      }
      if (scoreGradeConfig && typeof scoreGradeConfig === 'object') {
        saveScoreGradeConfig(scoreGradeConfig)
      }
      if (userProfile && typeof userProfile === 'object') {
        saveUserProfile(userProfile)
      }
      if (Array.isArray(favoriteMeals)) {
        saveFavoriteMeals(favoriteMeals)
      }
      if (Array.isArray(settingsLog)) {
        localStorage.setItem(SETTINGS_LOG_KEY, JSON.stringify(settingsLog.slice(0, MAX_SETTINGS_LOG)))
      }
    } else {
      const existingTrips = getTrips()
      const tripIds = new Set(existingTrips.map(t => t.id))

      const mergedTrips = [...existingTrips]
      ;(Array.isArray(trips) ? trips : []).forEach(t => {
        if (t.id && !tripIds.has(t.id)) {
          mergedTrips.push(t)
          tripIds.add(t.id)
        }
      })

      localStorage.setItem(TRIPS_KEY, JSON.stringify(mergedTrips))
      if (apiConfig && typeof apiConfig === 'object') {
        localStorage.setItem(API_CONFIG_KEY, JSON.stringify(apiConfig))
      }
      if (geocodingConfig && typeof geocodingConfig === 'object') {
        localStorage.setItem(GEOCODING_CONFIG_KEY, JSON.stringify(geocodingConfig))
      }
      if (appConfig && typeof appConfig === 'object') {
        saveAppConfig(appConfig)
      }
      if (scoreGradeConfig && typeof scoreGradeConfig === 'object') {
        saveScoreGradeConfig(scoreGradeConfig)
      }
      if (userProfile && typeof userProfile === 'object') {
        saveUserProfile({ ...getUserProfile(), ...userProfile })
      }
      if (Array.isArray(favoriteMeals) && favoriteMeals.length > 0) {
        const existing = getFavoriteMeals()
        const ids = new Set(existing.map(x => x.id))
        const merged = [...existing]
        favoriteMeals.forEach(x => {
          if (x?.id && !ids.has(x.id)) {
            merged.push(x)
            ids.add(x.id)
          }
        })
        saveFavoriteMeals(merged)
      }
      if (Array.isArray(settingsLog) && settingsLog.length > 0) {
        const cur = getSettingsLog()
        const mergedLog = [...settingsLog, ...cur].slice(0, MAX_SETTINGS_LOG)
        localStorage.setItem(SETTINGS_LOG_KEY, JSON.stringify(mergedLog))
      }
    }

    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message || '解析失败' }
  }
}
