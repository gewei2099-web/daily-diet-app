import React, { useState, useRef, useEffect } from 'react'
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import DietDashboard from './pages/DietDashboard'
import DailyDietList from './pages/DailyDietList'
import DailyDietForm from './pages/DailyDietForm'
import DailyDietDetail from './pages/DailyDietDetail'
import ExpenseSummary from './pages/ExpenseSummary'
import Settings from './pages/Settings'

function Nav() {
  const loc = useLocation()
  return (
    <header style={styles.header}>
      <Link to="/" style={styles.logo}>{loc?.state?.logo || '每日饮食'}</Link>
      <nav style={styles.nav}>
        <Link to="/" style={styles.navA}>首页</Link>
        <Link to="/days" style={styles.navA}>日记录</Link>
        <Link to="/day/new" style={styles.navA}>新建</Link>
        <Link to="/expenses" style={styles.navA}>花销</Link>
        <Link to="/settings" style={styles.navA}>设置</Link>
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <HashRouter>
      <div style={styles.app}>
        <Nav />
        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<DietDashboard />} />
            <Route path="/days" element={<DailyDietList />} />
            <Route path="/day/new" element={<DailyDietForm />} />
            <Route path="/day/:id" element={<DailyDietDetail />} />
            <Route path="/day/:id/edit" element={<DailyDietForm />} />
            <Route path="/expenses" element={<ExpenseSummary />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}

const styles = {
  app: { minHeight: '100%', display: 'flex', flexDirection: 'column' },
  header: {
    background: '#0d7377',
    color: '#fff',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  logo: { color: '#fff', fontWeight: 600, fontSize: 18 },
  nav: { display: 'flex', gap: 12, fontSize: 14, alignItems: 'center' },
  navA: { color: 'rgba(255,255,255,0.95)' },
  main: { flex: 1, padding: 0 }
}
