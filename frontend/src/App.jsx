import { useState, useEffect } from 'react'
import ThemeSelector from './components/ThemeSelector'
import Profile from './components/Profile'
import Streak from './components/Streak'
import Goals from './components/Goals'

const API_URL = 'http://localhost:3001/api'

function App() {
  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch user on mount
  useEffect(() => {
    fetchUser()
  }, [])

  // Apply theme when user changes
  useEffect(() => {
    if (user?.theme) {
      document.documentElement.setAttribute('data-theme', user.theme)
    }
  }, [user?.theme])

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/user/1`)
      const data = await res.json()
      setUser(data)
    } catch (err) {
      console.error('Failed to fetch user:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateTheme = async (theme) => {
    try {
      await fetch(`${API_URL}/user/1/theme`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme })
      })
      setUser(prev => ({ ...prev, theme }))
    } catch (err) {
      console.error('Failed to update theme:', err)
    }
  }

  const updateUser = async (userData) => {
    try {
      const res = await fetch(`${API_URL}/user/1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      const data = await res.json()
      setUser(data)
    } catch (err) {
      console.error('Failed to update user:', err)
    }
  }

  if (loading) {
    return <div className="app"><p>Loading...</p></div>
  }

  return (
    <div className="app">
      <header className="header">
        <h1>FitForge</h1>
        <ThemeSelector currentTheme={user?.theme || 'light'} onThemeChange={updateTheme} />
      </header>

      <nav className="nav">
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={activeTab === 'streak' ? 'active' : ''}
          onClick={() => setActiveTab('streak')}
        >
          Streak
        </button>
        <button
          className={activeTab === 'goals' ? 'active' : ''}
          onClick={() => setActiveTab('goals')}
        >
          Goals
        </button>
      </nav>

      <main>
        {activeTab === 'profile' && (
          <Profile user={user} onUpdate={updateUser} />
        )}
        {activeTab === 'streak' && (
          <Streak userId={user?.id} />
        )}
        {activeTab === 'goals' && (
          <Goals userId={user?.id} />
        )}
      </main>
    </div>
  )
}

export default App
