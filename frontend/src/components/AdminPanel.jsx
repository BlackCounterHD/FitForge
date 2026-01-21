import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const EXERCISES = [
  { id: 1, name: 'Push-ups', category: 'Strength', muscle: 'Chest', difficulty: 'Medium' },
  { id: 2, name: 'Squats', category: 'Strength', muscle: 'Legs', difficulty: 'Medium' },
  { id: 3, name: 'Pull-ups', category: 'Strength', muscle: 'Back', difficulty: 'Hard' },
  { id: 4, name: 'Plank', category: 'Core', muscle: 'Abs', difficulty: 'Easy' },
  { id: 5, name: 'Burpees', category: 'Cardio', muscle: 'Full Body', difficulty: 'Hard' },
  { id: 6, name: 'Running', category: 'Cardio', muscle: 'Legs', difficulty: 'Medium' }
]

export default function AdminPanel() {
  const { isGuest } = useAuth()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ users: 0, workouts: 0, today: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('users')

  useEffect(() => {
    if (isGuest) {
      setUsers([
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user', createdAt: '2024-01-15' },
        { id: '2', name: 'Admin', email: 'admin@fitforge.com', role: 'admin', createdAt: '2024-01-01' }
      ])
      setStats({ users: 2, workouts: 45, today: 3 })
      setLoading(false)
      return
    }

    const unsub1 = onSnapshot(query(collection(db, 'users')), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setStats(s => ({ ...s, users: snap.size }))
    })
    const unsub2 = onSnapshot(query(collection(db, 'workouts')), snap => {
      const today = new Date().toISOString().split('T')[0]
      setStats(s => ({ ...s, workouts: snap.size, today: snap.docs.filter(d => d.data().date === today).length }))
      setLoading(false)
    })
    return () => { unsub1(); unsub2() }
  }, [isGuest])

  const setRole = async (id, role) => {
    if (isGuest) { setUsers(u => u.map(x => x.id === id ? { ...x, role } : x)); return }
    try { await updateDoc(doc(db, 'users', id), { role }) } catch (e) { console.error(e) }
  }

  const remove = async (id) => {
    if (!confirm('Delete user?')) return
    if (isGuest) { setUsers(u => u.filter(x => x.id !== id)); return }
    try { await deleteDoc(doc(db, 'users', id)) } catch (e) { console.error(e) }
  }

  if (loading) return <div className="card"><p>Loading...</p></div>

  return (
    <div className="card">
      <h2>Admin Panel</h2>
      <div className="admin-stats">
        {[['Users', stats.users], ['Workouts', stats.workouts], ['Today', stats.today]].map(([l, v]) => (
          <div key={l} className="admin-stat"><div className="stat-value">{v}</div><div className="stat-label">{l}</div></div>
        ))}
      </div>

      <div className="admin-tabs">
        {['users', 'exercises'].map(t => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t === 'users' ? 'Users' : 'Exercises'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role || 'user'} onChange={e => setRole(u.id, e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(u.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'exercises' && (
        <table className="admin-table">
          <thead><tr><th>Exercise</th><th>Category</th><th>Muscle</th><th>Difficulty</th></tr></thead>
          <tbody>
            {EXERCISES.map(e => (
              <tr key={e.id}>
                <td>{e.name}</td>
                <td>{e.category}</td>
                <td>{e.muscle}</td>
                <td><span className={`difficulty-badge ${e.difficulty.toLowerCase()}`}>{e.difficulty}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
