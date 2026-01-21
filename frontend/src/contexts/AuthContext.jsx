import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  async function createUserProfile(user, additionalData = {}) {
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      const { email, displayName, photoURL } = user
      const createdAt = new Date().toISOString()

      await setDoc(userRef, {
        email,
        name: displayName || additionalData.name || 'User',
        avatar: photoURL || '',
        theme: 'light',
        role: 'user',
        createdAt,
        ...additionalData
      })
    }

    return fetchUserProfile(user.uid)
  }

  async function fetchUserProfile(uid) {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const profile = { id: uid, ...userSnap.data() }
      setUserProfile(profile)
      return profile
    }
    return null
  }

  async function signup(email, password, name) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName: name })
    await createUserProfile(result.user, { name })
    return result
  }

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password)
    await fetchUserProfile(result.user.uid)
    return result
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider)
    await createUserProfile(result.user)
    return result
  }

  async function logout() {
    setUserProfile(null)
    setIsGuest(false)
    return signOut(auth)
  }

  function enterGuestMode() {
    setIsGuest(true)
    setUserProfile({
      id: 'guest',
      name: 'Guest User',
      email: 'guest@fitforge.demo',
      avatar: '',
      theme: 'light',
      role: 'guest'
    })
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        await fetchUserProfile(user.uid)
        setIsGuest(false)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userProfile,
    setUserProfile,
    loading,
    isGuest,
    signup,
    login,
    loginWithGoogle,
    logout,
    enterGuestMode,
    fetchUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
