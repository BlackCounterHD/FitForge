import { useState, useEffect } from 'react'

function Profile({ user, onUpdate }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    theme: 'light'
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        theme: user.theme || 'light'
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate(formData)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="card">
      <h2>User Profile</h2>
      <div className="profile-section">
        <div className="avatar-section">
          <div className="avatar">
            {formData.avatar ? (
              <img src={formData.avatar} alt="Avatar" />
            ) : (
              getInitials(formData.name || 'U')
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Add image URL below
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="avatar">Avatar URL</label>
            <input
              type="url"
              id="avatar"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <button type="submit" className="btn btn-primary">
            {saved ? 'Saved!' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
