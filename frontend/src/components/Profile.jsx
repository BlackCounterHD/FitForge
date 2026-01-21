import { useState, useRef } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import NotificationSettings from './NotificationSettings'

export default function Profile() {
  const { currentUser, userProfile, setUserProfile, isGuest } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(userProfile?.name || '')
  const [email, setEmail] = useState(userProfile?.email || '')
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)

  const save = async (e) => {
    e.preventDefault()
    if (isGuest) {
      setUserProfile(p => ({ ...p, name, email }))
    } else {
      try { await updateDoc(doc(db, 'users', currentUser.uid), { name, email }) }
      catch (e) { console.error(e); return }
      setUserProfile(p => ({ ...p, name, email }))
    }
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const uploadAvatar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 500000) { alert('Image too large (max 500KB)'); return }
    setUploading(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      const img = reader.result
      if (isGuest) { setUserProfile(p => ({ ...p, avatar: img })); setUploading(false); return }
      try { await updateDoc(doc(db, 'users', currentUser.uid), { avatar: img }) }
      catch (e) { console.error(e) }
      setUserProfile(p => ({ ...p, avatar: img }))
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const initials = (userProfile?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="card">
      <h2>User Profile</h2>
      <div className="profile-section">
        <div className="avatar-section">
          <div className="avatar" onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer' }}>
            {userProfile?.avatar ? <img src={userProfile.avatar} alt="Avatar" /> : initials}
            <div className="avatar-overlay">{uploading ? '...' : 'Edit'}</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Click to upload (max 500KB)</p>
        </div>

        {editing ? (
          <form onSubmit={save}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!isGuest} />
            </div>
            <div className="button-group">
              <button type="submit" className="btn btn-primary">{saved ? 'Saved!' : 'Save'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="profile-display">
            <p><strong>Name:</strong> {userProfile?.name}</p>
            <p><strong>Email:</strong> {userProfile?.email}</p>
            <p><strong>Member since:</strong> {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}</p>
            <button className="btn btn-primary" onClick={() => { setName(userProfile?.name || ''); setEmail(userProfile?.email || ''); setEditing(true) }}>
              Edit Profile
            </button>
          </div>
        )}
      </div>
      <NotificationSettings />
    </div>
  )
}
