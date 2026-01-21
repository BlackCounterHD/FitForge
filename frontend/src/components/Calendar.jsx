import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const fmt = d => d.toISOString().split('T')[0]

export default function Calendar() {
  const { currentUser, isGuest } = useAuth()
  const [date, setDate] = useState(new Date())
  const [workouts, setWorkouts] = useState([])
  const [selected, setSelected] = useState(null)
  const [dragged, setDragged] = useState(null)

  useEffect(() => {
    if (isGuest) {
      const t = new Date()
      setWorkouts([
        { id: '1', name: 'Morning Run', type: 'Running', date: fmt(t) },
        { id: '2', name: 'Strength', type: 'Strength', date: fmt(new Date(t - 86400000)) }
      ])
      return
    }
    if (!currentUser) return
    return onSnapshot(query(collection(db, 'workouts'), where('userId', '==', currentUser.uid)), snap => {
      setWorkouts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [currentUser, isGuest])

  const year = date.getFullYear(), month = date.getMonth()
  const days = [...Array(new Date(year, month, 1).getDay()).fill(null), ...Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1)]
  const today = fmt(new Date())
  const getW = d => workouts.filter(w => w.date === d)

  const drop = async (e, dateStr) => {
    e.preventDefault()
    if (!dragged || dragged.date === dateStr) { setDragged(null); return }
    if (isGuest) { setWorkouts(w => w.map(x => x.id === dragged.id ? { ...x, date: dateStr } : x)) }
    else { try { await updateDoc(doc(db, 'workouts', dragged.id), { date: dateStr }) } catch (e) { console.error(e) } }
    setDragged(null)
  }

  return (
    <div className="card">
      <h2>Workout Calendar</h2>
      <div className="calendar-header">
        <button className="btn btn-secondary" onClick={() => setDate(new Date(year, month - 1))}>&lt;</button>
        <h3>{MONTHS[month]} {year}</h3>
        <button className="btn btn-secondary" onClick={() => setDate(new Date(year, month + 1))}>&gt;</button>
      </div>

      <div className="calendar-grid">
        {DAYS.map(d => <div key={d} className="calendar-day-header">{d}</div>)}
        {days.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="calendar-day empty" />
          const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dw = getW(d)
          return (
            <div key={d} className={`calendar-day ${d === today ? 'today' : ''} ${d === selected ? 'selected' : ''} ${dw.length ? 'has-workouts' : ''}`}
              onClick={() => setSelected(d)} onDragOver={e => e.preventDefault()} onDrop={e => drop(e, d)}>
              <span className="day-number">{day}</span>
              <div className="day-workouts">
                {dw.slice(0, 2).map(w => (
                  <div key={w.id} className="workout-pill" draggable onDragStart={() => setDragged(w)}>{w.name}</div>
                ))}
                {dw.length > 2 && <div className="workout-more">+{dw.length - 2}</div>}
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <div className="selected-date-details">
          <h4>{selected}</h4>
          {getW(selected).length === 0 ? <p>No workouts</p> : (
            <ul>{getW(selected).map(w => <li key={w.id}><strong>{w.name}</strong> - {w.type}</li>)}</ul>
          )}
        </div>
      )}
      <p className="calendar-hint">Drag workouts to reschedule</p>
    </div>
  )
}
