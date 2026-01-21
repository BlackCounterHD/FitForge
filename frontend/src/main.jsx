import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import './index.css'

function PrivateRoute({ children }) {
  const { currentUser, userProfile, isGuest, loading } = useAuth()

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!currentUser && !isGuest) {
    return <Navigate to="/login" />
  }

  return children
}

function PublicRoute({ children }) {
  const { currentUser, isGuest, loading } = useAuth()

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (currentUser || isGuest) {
    return <Navigate to="/dashboard" />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <Signup />
        </PublicRoute>
      } />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
