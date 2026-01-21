import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const TYPES = ['Strength', 'Cardio', 'HIIT', 'Yoga', 'Swimming', 'Cycling', 'Running', 'Other']
const DIFFICULTY = ['Easy', 'Medium', 'Hard', 'Intense']
const today = () => new Date().toISOString().split('T')[0]
const defaultForm = { name: '', type: 'Strength', duration: 30, difficulty: 'Medium', calories: 0, notes: '', date: today() }

export default function Workouts() {
  const { currentUser, isGuest } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (isGuest) {
      setWorkouts([
        { id: '1', name: 'Morning Run', type: 'Running', duration: 30, difficulty: 'Medium', calories: 300, date: today() },
        { id: '2', name: 'Strength Training', type: 'Strength', duration: 45, difficulty: 'Hard', calories: 250, date: today() }
      ])
      setLoading(false)
      return
    }
    if (!currentUser) { setLoading(false); return }

    return onSnapshot(query(collection(db, 'workouts'), where('userId', '==', currentUser.uid)), snap => {
      setWorkouts(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.date) - new Date(a.date)))
      setLoading(false)
    })
  }, [currentUser, isGuest])

  const reset = () => { setForm({ ...defaultForm, date: today() }); setShowForm(false); setEditing(null) }
  const set = (k, v) => setForm(f => ({ ...f, [k]: k === 'duration' || k === 'calories' ? parseInt(v) || 0 : v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const data = { ...form, completed: true }
    if (isGuest) {
      editing ? setWorkouts(w => w.map(x => x.id === editing.id ? { ...x, ...data } : x))
        : setWorkouts(w => [{ id: Date.now().toString(), ...data }, ...w])
      reset(); return
    }
    try {
      editing ? await updateDoc(doc(db, 'workouts', editing.id), data)
        : await addDoc(collection(db, 'workouts'), { ...data, userId: currentUser.uid })
      reset()
    } catch (e) { console.error(e) }
  }

  const remove = async (id) => {
    if (!confirm('Delete workout?')) return
    if (isGuest) { setWorkouts(w => w.filter(x => x.id !== id)); return }
    try { await deleteDoc(doc(db, 'workouts', id)) } catch (e) { console.error(e) }
  }

  const edit = (w) => { setForm({ name: w.name, type: w.type, duration: w.duration, difficulty: w.difficulty, calories: w.calories || 0, notes: w.notes || '', date: w.date }); setEditing(w); setShowForm(true) }

  const totals = workouts.reduce((a, w) => ({ dur: a.dur + (w.duration || 0), cal: a.cal + (w.calories || 0) }), { dur: 0, cal: 0 })

  if (loading) return <div className="card"><p>Loading...</p></div>

  return (
    <div className="card">
      <div className="card-header">
        <h2>Workout Log</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Log'}</button>
      </div>

      <div className="workout-stats">
        {[['Total', workouts.length], ['Minutes', totals.dur], ['Calories', totals.cal]].map(([l, v]) => (
          <div key={l} className="stat-card"><div className="stat-value">{v}</div><div className="stat-label">{l}</div></div>
        ))}
      </div>

      {showForm && (
        <form className="add-goal-form" onSubmit={submit}>
          <h3>{editing ? 'Edit' : 'Log'} Workout</h3>
          <div className="form-group">
            <label>Name *</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                {DIFFICULTY.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Duration (min)</label>
              <input type="number" value={form.duration} onChange={e => set('duration', e.target.value)} min="1" />
            </div>
            <div className="form-group">
              <label>Calories</label>
              <input type="number" value={form.calories} onChange={e => set('calories', e.target.value)} min="0" />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>
          <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Log'}</button>
        </form>
      )}

      <div className="workouts-list">
        {workouts.length === 0 ? <p className="empty-state">No workouts yet.</p> : workouts.map(w => (
          <div key={w.id} className="workout-item">
            <div className="workout-info">
              <div className="workout-header">
                <span className="workout-name">{w.name}</span>
                <span className="workout-date">{w.date}</span>
              </div>
              <div className="workout-details">
                <span>{w.type}</span><span>{w.duration} min</span><span>{w.difficulty}</span>
                {w.calories > 0 && <span>{w.calories} cal</span>}
              </div>
              {w.notes && <p className="workout-notes">{w.notes}</p>}
            </div>
            <div className="workout-actions">
              <button className="btn btn-secondary" onClick={() => edit(w)}>Edit</button>
              <button className="btn btn-danger" onClick={() => remove(w.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
