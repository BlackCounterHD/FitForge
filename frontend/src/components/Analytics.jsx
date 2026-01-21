import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import { jsPDF } from 'jspdf'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

const dateStr = d => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().split('T')[0] }

export default function Analytics() {
  const { currentUser, isGuest } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('week')

  useEffect(() => {
    if (isGuest) {
      setWorkouts([
        { id: '1', type: 'Running', duration: 30, calories: 300, date: dateStr(-6) },
        { id: '2', type: 'Strength', duration: 45, calories: 250, date: dateStr(-3) },
        { id: '3', type: 'HIIT', duration: 25, calories: 350, date: dateStr(-1) },
        { id: '4', type: 'Cycling', duration: 40, calories: 400, date: dateStr(0) }
      ])
      setGoals([{ id: '1', is_completed: true }, { id: '2', is_completed: false }])
      setLoading(false)
      return
    }
    if (!currentUser) { setLoading(false); return }

    const unsub1 = onSnapshot(query(collection(db, 'workouts'), where('userId', '==', currentUser.uid)), s => setWorkouts(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const unsub2 = onSnapshot(query(collection(db, 'goals'), where('userId', '==', currentUser.uid)), s => { setGoals(s.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) })
    return () => { unsub1(); unsub2() }
  }, [currentUser, isGuest])

  const start = new Date()
  if (range === 'week') start.setDate(start.getDate() - 7)
  else if (range === 'month') start.setMonth(start.getMonth() - 1)
  else start.setFullYear(start.getFullYear() - 1)
  const filtered = workouts.filter(w => new Date(w.date) >= start)

  const sum = (k) => filtered.reduce((a, w) => a + (w[k] || 0), 0)
  const completed = goals.filter(g => g.is_completed).length

  const weeklyData = () => {
    const v = Array(7).fill(0)
    filtered.forEach(w => v[new Date(w.date).getDay()] += w.duration || 0)
    return { labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], datasets: [{ label: 'Minutes', data: v, backgroundColor: 'rgba(99,102,241,0.5)', borderColor: '#6366f1', borderWidth: 1 }] }
  }

  const typeData = () => {
    const t = {}
    filtered.forEach(w => t[w.type] = (t[w.type] || 0) + 1)
    return { labels: Object.keys(t), datasets: [{ data: Object.values(t), backgroundColor: ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f97316'] }] }
  }

  const trendData = () => {
    const s = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date))
    return { labels: s.map(w => w.date), datasets: [{ label: 'Calories', data: s.map(w => w.calories || 0), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4 }] }
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(20); doc.text('FitForge Report', 20, 20)
    doc.setFontSize(11)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30)
    doc.text(`Workouts: ${filtered.length} | Minutes: ${sum('duration')} | Calories: ${sum('calories')} | Goals: ${completed}/${goals.length}`, 20, 40)
    filtered.slice(0, 10).forEach((w, i) => doc.text(`${w.date} - ${w.type} (${w.duration}min)`, 20, 55 + i * 7))
    doc.save('fitforge-report.pdf')
  }

  const exportCSV = () => {
    const csv = [['Date', 'Type', 'Duration', 'Calories'], ...filtered.map(w => [w.date, w.type, w.duration, w.calories])].map(r => r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv])); a.download = 'workouts.csv'; a.click()
  }

  if (loading) return <div className="card"><p>Loading...</p></div>

  return (
    <div className="card">
      <div className="analytics-header">
        <h2>Analytics</h2>
        <div className="analytics-controls">
          <select value={range} onChange={e => setRange(e.target.value)}>
            <option value="week">7 Days</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          <button className="btn btn-secondary" onClick={exportPDF}>PDF</button>
          <button className="btn btn-secondary" onClick={exportCSV}>CSV</button>
        </div>
      </div>

      <div className="analytics-summary">
        {[[filtered.length, 'Workouts'], [sum('duration'), 'Minutes'], [sum('calories'), 'Calories'], [`${completed}/${goals.length}`, 'Goals']].map(([v, l]) => (
          <div key={l} className="summary-card"><div className="summary-value">{v}</div><div className="summary-label">{l}</div></div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-container"><h3>Weekly Volume</h3><Bar data={weeklyData()} options={{ responsive: true, maintainAspectRatio: false }} /></div>
        <div className="chart-container"><h3>Types</h3><Doughnut data={typeData()} options={{ responsive: true, maintainAspectRatio: false }} /></div>
        <div className="chart-container wide"><h3>Trend</h3><Line data={trendData()} options={{ responsive: true, maintainAspectRatio: false }} /></div>
      </div>
    </div>
  )
}
