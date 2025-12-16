import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3001/api'

const CATEGORIES = ['Strength', 'Cardio', 'Flexibility', 'Weight Loss', 'Endurance', 'Other']

function Goals({ userId }) {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_value: '',
    category: 'Strength'
  })

  useEffect(() => {
    if (userId) {
      fetchGoals()
    }
  }, [userId])

  const fetchGoals = async () => {
    try {
      const res = await fetch(`${API_URL}/goals/${userId}`)
      const data = await res.json()
      setGoals(data)
    } catch (err) {
      console.error('Failed to fetch goals:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    try {
      const res = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: userId })
      })
      const newGoal = await res.json()
      setGoals(prev => [newGoal, ...prev])
      setFormData({ title: '', description: '', target_value: '', category: 'Strength' })
      setShowForm(false)
    } catch (err) {
      console.error('Failed to create goal:', err)
    }
  }

  const toggleComplete = async (goal) => {
    try {
      const res = await fetch(`${API_URL}/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...goal, is_completed: !goal.is_completed })
      })
      const updated = await res.json()
      setGoals(prev => prev.map(g => g.id === goal.id ? updated : g))
    } catch (err) {
      console.error('Failed to update goal:', err)
    }
  }

  const deleteGoal = async (id) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      await fetch(`${API_URL}/goals/${id}`, { method: 'DELETE' })
      setGoals(prev => prev.filter(g => g.id !== id))
    } catch (err) {
      console.error('Failed to delete goal:', err)
    }
  }

  if (loading) {
    return <div className="card"><p>Loading goals...</p></div>
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Fitness Goals</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Goal'}
        </button>
      </div>

      {showForm && (
        <form className="add-goal-form" onSubmit={handleSubmit}>
          <h3>New Goal</h3>
          <div className="form-group">
            <label htmlFor="title">Goal Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Run 5km in 25 minutes"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="target_value">Target</label>
              <input
                type="text"
                id="target_value"
                name="target_value"
                value={formData.target_value}
                onChange={handleChange}
                placeholder="e.g., 25 minutes, 100 reps"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add more details about your goal..."
              rows={3}
            />
          </div>

          <button type="submit" className="btn btn-primary">Create Goal</button>
        </form>
      )}

      <div className="goals-list">
        {goals.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
            No goals yet. Click "+ Add Goal" to create your first fitness goal!
          </p>
        ) : (
          goals.map(goal => (
            <div key={goal.id} className={`goal-item ${goal.is_completed ? 'completed' : ''}`}>
              <div className="goal-info">
                <div className="goal-title">{goal.title}</div>
                {goal.description && (
                  <div className="goal-description">{goal.description}</div>
                )}
                {goal.target_value && (
                  <div className="goal-description">Target: {goal.target_value}</div>
                )}
                <span className="goal-category">{goal.category}</span>
              </div>
              <div className="goal-actions">
                <button
                  className={`btn ${goal.is_completed ? 'btn-secondary' : 'btn-success'}`}
                  onClick={() => toggleComplete(goal)}
                >
                  {goal.is_completed ? 'Undo' : 'Complete'}
                </button>
                <button className="btn btn-danger" onClick={() => deleteGoal(goal.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Goals
