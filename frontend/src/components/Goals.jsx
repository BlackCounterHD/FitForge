import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = ['Strength', 'Cardio', 'Flexibility', 'Weight Loss', 'Endurance', 'Other']
const defaultForm = { title: '', description: '', target_value: '', category: 'Strength' }

export default function Goals() {
  const { currentUser, isGuest } = useAuth()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (isGuest) {
      setGoals([
        { id: '1', title: 'Run 5km in 25 minutes', description: 'Improve pace', target_value: '25 min', category: 'Cardio', is_completed: false },
        { id: '2', title: '50 Push-ups', description: 'Upper body strength', target_value: '50 reps', category: 'Strength', is_completed: true }
      ])
      setLoading(false)
      return
    }
    if (!currentUser) { setLoading(false); return }

    return onSnapshot(query(collection(db, 'goals'), where('userId', '==', currentUser.uid)), snap => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
      setLoading(false)
    })
  }, [currentUser, isGuest])

  const reset = () => { setForm(defaultForm); setShowForm(false); setEditing(null) }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    if (isGuest) {
      editing ? setGoals(g => g.map(x => x.id === editing.id ? { ...x, ...form } : x))
        : setGoals(g => [{ id: Date.now().toString(), ...form, is_completed: false }, ...g])
      reset(); return
    }
    try {
      editing ? await updateDoc(doc(db, 'goals', editing.id), form)
        : await addDoc(collection(db, 'goals'), { ...form, userId: currentUser.uid, is_completed: false, created_at: new Date().toISOString() })
      reset()
    } catch (e) { console.error(e) }
  }

  const toggle = async (g) => {
    if (isGuest) { setGoals(gs => gs.map(x => x.id === g.id ? { ...x, is_completed: !x.is_completed } : x)); return }
    try { await updateDoc(doc(db, 'goals', g.id), { is_completed: !g.is_completed }) } catch (e) { console.error(e) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this goal?')) return
    if (isGuest) { setGoals(g => g.filter(x => x.id !== id)); return }
    try { await deleteDoc(doc(db, 'goals', id)) } catch (e) { console.error(e) }
  }

  const edit = (g) => { setForm({ title: g.title, description: g.description || '', target_value: g.target_value || '', category: g.category || 'Strength' }); setEditing(g); setShowForm(true) }

  if (loading) return <div className="card"><p>Loading goals...</p></div>

  return (
    <div className="card">
      <div className="card-header">
        <h2>Fitness Goals</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Goal'}</button>
      </div>

      {showForm && (
        <form className="add-goal-form" onSubmit={submit}>
          <h3>{editing ? 'Edit Goal' : 'New Goal'}</h3>
          <div className="form-group">
            <label>Goal Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Target</label>
              <input type="text" value={form.target_value} onChange={e => setForm({ ...form, target_value: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
        </form>
      )}

      <div className="goals-list">
        {goals.length === 0 ? <p className="empty-state">No goals yet. Click "+ Add Goal" to start!</p> : goals.map(g => (
          <div key={g.id} className={`goal-item ${g.is_completed ? 'completed' : ''}`}>
            <div className="goal-info">
              <div className="goal-title">{g.title}</div>
              {g.description && <div className="goal-description">{g.description}</div>}
              {g.target_value && <div className="goal-description">Target: {g.target_value}</div>}
              <span className="goal-category">{g.category}</span>
            </div>
            <div className="goal-actions">
              <button className="btn btn-secondary" onClick={() => edit(g)}>Edit</button>
              <button className={`btn ${g.is_completed ? 'btn-secondary' : 'btn-success'}`} onClick={() => toggle(g)}>{g.is_completed ? 'Undo' : 'Done'}</button>
              <button className="btn btn-danger" onClick={() => remove(g.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
