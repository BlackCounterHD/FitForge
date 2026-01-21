import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function NotificationSettings() {
  const { currentUser, userProfile, setUserProfile, isGuest } = useAuth()
  const [permission, setPermission] = useState('default')
  const [time, setTime] = useState(userProfile?.reminderTime || '09:00')
  const [enabled, setEnabled] = useState(userProfile?.remindersEnabled || false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission)
  }, [])

  const requestPerm = async () => {
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') new Notification('FitForge', { body: 'Notifications enabled!' })
  }

  const save = async () => {
    const data = { reminderTime: time, remindersEnabled: enabled }
    if (!isGuest) {
      try { await updateDoc(doc(db, 'users', currentUser.uid), data) }
      catch (e) { console.error(e); return }
    }
    setUserProfile(p => ({ ...p, ...data }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const test = () => new Notification('FitForge Reminder', { body: 'Time for your workout!' })

  return (
    <div className="notification-settings">
      <h3>Notification Settings</h3>
      <div className="setting-item">
        <label>Browser Notifications</label>
        {permission === 'granted' ? <span className="status-badge enabled">Enabled</span>
          : permission === 'denied' ? <span className="status-badge disabled">Blocked</span>
          : <button className="btn btn-primary" onClick={requestPerm}>Enable</button>}
      </div>
      {permission === 'granted' && <>
        <div className="setting-item">
          <label>Daily Reminders</label>
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        </div>
        {enabled && <div className="setting-item">
          <label>Time</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>}
        <div className="button-group">
          <button className="btn btn-primary" onClick={save}>{saved ? 'Saved!' : 'Save'}</button>
          <button className="btn btn-secondary" onClick={test}>Test</button>
        </div>
      </>}
    </div>
  )
}
