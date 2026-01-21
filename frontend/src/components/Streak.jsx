import { useState, useEffect } from 'react'
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const getDateStr = (d = new Date()) => d.toISOString().split('T')[0]

export default function Streak() {
  const { currentUser, isGuest } = useAuth()
  const [streak, setStreak] = useState(null)
  const [loading, setLoading] = useState(true)
  const [logging, setLogging] = useState(false)

  const today = getDateStr()
  const isLoggedToday = streak?.last_workout_date === today

  useEffect(() => {
    if (isGuest) {
      setStreak({ current_streak: 5, longest_streak: 12, last_workout_date: getDateStr(new Date(Date.now() - 86400000)) })
      setLoading(false)
      return
    }
    if (!currentUser) { setLoading(false); return }

    const ref = doc(db, 'streaks', currentUser.uid)
    return onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        setStreak(snap.data())
      } else {
        const init = { current_streak: 0, longest_streak: 0, last_workout_date: null }
        await setDoc(ref, init)
        setStreak(init)
      }
      setLoading(false)
    })
  }, [currentUser, isGuest])

  const logWorkout = async () => {
    if (isLoggedToday) return
    setLogging(true)

    const yesterday = getDateStr(new Date(Date.now() - 86400000))
    const newCount = streak?.last_workout_date === yesterday ? (streak?.current_streak || 0) + 1 : 1
    const newStreak = {
      current_streak: newCount,
      longest_streak: Math.max(newCount, streak?.longest_streak || 0),
      last_workout_date: today
    }

    if (isGuest) { setStreak(newStreak); setLogging(false); return }
    try { await updateDoc(doc(db, 'streaks', currentUser.uid), newStreak) }
    catch (e) { console.error(e) }
    setLogging(false)
  }

  const resetStreak = async () => {
    if (!confirm('Reset your streak?')) return
    const data = { current_streak: 0, last_workout_date: null }
    if (isGuest) { setStreak(s => ({ ...s, ...data })); return }
    try { await updateDoc(doc(db, 'streaks', currentUser.uid), data) }
    catch (e) { console.error(e) }
  }

  if (loading) return <div className="card"><p>Loading streak...</p></div>

  return (
    <div className="card">
      <h2>Workout Streak</h2>
      <div className="streak-container">
        <div className="streak-number">{streak?.current_streak || 0}</div>
        <div className="streak-label">{streak?.current_streak === 1 ? 'Day' : 'Days'} Streak</div>
        <div className="streak-stats">
          <div className="streak-stat">
            <div className="streak-stat-value">{streak?.longest_streak || 0}</div>
            <div className="streak-stat-label">Longest Streak</div>
          </div>
          <div className="streak-stat">
            <div className="streak-stat-value">{streak?.last_workout_date || 'Never'}</div>
            <div className="streak-stat-label">Last Workout</div>
          </div>
        </div>
        <div className="streak-actions">
          <button className="btn btn-success" onClick={logWorkout} disabled={logging || isLoggedToday}>
            {isLoggedToday ? 'Logged Today!' : logging ? 'Logging...' : 'Log Workout'}
          </button>
          <button className="btn btn-secondary" onClick={resetStreak}>Reset Streak</button>
        </div>
        {isLoggedToday && <p style={{ marginTop: '15px', color: 'var(--success)' }}>Great job! You've logged today.</p>}
      </div>
    </div>
  )
}
