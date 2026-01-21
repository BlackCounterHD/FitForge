import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3001/api'

function Streak({ userId }) {
  const [streak, setStreak] = useState(null)
  const [loading, setLoading] = useState(true)
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchStreak()
    }
  }, [userId])

  const fetchStreak = async () => {
    try {
      const res = await fetch(`${API_URL}/streak/${userId}`)
      const data = await res.json()
      setStreak(data)
    } catch (err) {
      console.error('Failed to fetch streak:', err)
    } finally {
      setLoading(false)
    }
  }

  const logWorkout = async () => {
    setLogging(true)
    try {
      const res = await fetch(`${API_URL}/streak/${userId}/log`, {
        method: 'POST'
      })
      const data = await res.json()
      setStreak(data)
    } catch (err) {
      console.error('Failed to log workout:', err)
    } finally {
      setLogging(false)
    }
  }

  const resetStreak = async () => {
    if (!confirm('Are you sure you want to reset your streak?')) return
    try {
      const res = await fetch(`${API_URL}/streak/${userId}/reset`, {
        method: 'POST'
      })
      const data = await res.json()
      setStreak(data)
    } catch (err) {
      console.error('Failed to reset streak:', err)
    }
  }

  if (loading) {
    return <div className="card"><p>Loading streak...</p></div>
  }

  const isLoggedToday = streak?.last_workout_date === new Date().toISOString().split('T')[0]

  return (
    <div className="card">
      <h2>Workout Streak</h2>
      <div className="streak-container">
        <div className="streak-number">{streak?.current_streak || 0}</div>
        <div className="streak-label">
          {streak?.current_streak === 1 ? 'Day Streak' : 'Days Streak'}
        </div>

        <div className="streak-stats">
          <div className="streak-stat">
            <div className="streak-stat-value">{streak?.longest_streak || 0}</div>
            <div className="streak-stat-label">Longest Streak</div>
          </div>
          <div className="streak-stat">
            <div className="streak-stat-value">
              {streak?.last_workout_date || 'Never'}
            </div>
            <div className="streak-stat-label">Last Workout</div>
          </div>
        </div>

        <div className="streak-actions">
          <button
            className="btn btn-success"
            onClick={logWorkout}
            disabled={logging || isLoggedToday}
          >
            {isLoggedToday ? 'Logged Today!' : logging ? 'Logging...' : 'Log Workout'}
          </button>
          <button className="btn btn-secondary" onClick={resetStreak}>
            Reset Streak
          </button>
        </div>

        {isLoggedToday && (
          <p style={{ marginTop: '15px', color: 'var(--success)' }}>
            Great job! You've already logged your workout today.
          </p>
        )}
      </div>
    </div>
  )
}

export default Streak
