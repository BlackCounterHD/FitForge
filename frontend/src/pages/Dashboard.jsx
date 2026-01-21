import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import ThemeSelector from '../components/ThemeSelector'
import Profile from '../components/Profile'
import Streak from '../components/Streak'
import Goals from '../components/Goals'
import Workouts from '../components/Workouts'
import Calendar from '../components/Calendar'
import Analytics from '../components/Analytics'
import AdminPanel from '../components/AdminPanel'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('profile')
  const [workouts, setWorkouts] = useState([])
  const { currentUser, userProfile, setUserProfile, logout, isGuest } = useAuth()
  const navigate = useNavigate()

  // Check if workout logged today
  const today = new Date().toISOString().split('T')[0]
  const hasWorkoutToday = workouts.some(w => w.date === today)

  useEffect(() => {
    if (!userProfile && !isGuest) {
      navigate('/login')
    }
  }, [userProfile, isGuest, navigate])

  // Fetch workouts for reminder banner
  useEffect(() => {
    if (isGuest) {
      setWorkouts([{ id: 'demo', date: '' }]) // Demo: no workout today
      return
    }
    if (!currentUser) return

    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', currentUser.uid)
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWorkouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsubscribe()
  }, [currentUser, isGuest])

  useEffect(() => {
    if (userProfile?.theme) {
      document.documentElement.setAttribute('data-theme', userProfile.theme)
    }
  }, [userProfile?.theme])

  async function updateTheme(theme) {
    if (isGuest) {
      setUserProfile(prev => ({ ...prev, theme }))
      return
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, { theme })
      setUserProfile(prev => ({ ...prev, theme }))
    } catch (err) {
      console.error('Failed to update theme:', err)
    }
  }

  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Failed to logout:', err)
    }
  }

  if (!userProfile) {
    return <div className="app"><p>Loading...</p></div>
  }

  const isAdmin = userProfile.role === 'admin'

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'workouts', label: 'Workouts' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'goals', label: 'Goals' },
    { id: 'streak', label: 'Streak' },
    { id: 'analytics', label: 'Analytics' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin' }] : [])
  ]

  return (
    <div className="app">
      <header className="header">
        <h1>FitForge</h1>
        <div className="header-actions">
          {isGuest && <span className="guest-badge">Demo Mode</span>}
          <ThemeSelector currentTheme={userProfile?.theme || 'light'} onThemeChange={updateTheme} />
          <button className="btn btn-logout" onClick={handleLogout}>
            {isGuest ? 'Exit Demo' : 'Logout'}
          </button>
        </div>
      </header>

      <nav className="nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {!hasWorkoutToday && (
        <div className="reminder-banner">
          You haven't logged a workout today!
        </div>
      )}

      <main>
        {activeTab === 'profile' && <Profile />}
        {activeTab === 'workouts' && <Workouts />}
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'goals' && <Goals />}
        {activeTab === 'streak' && <Streak />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'admin' && isAdmin && <AdminPanel />}
      </main>
    </div>
  )
}
