'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/lib/api'
import {
  User,
  LoginResponse,
  setTokens,
  setUser as saveUser,
  getUser as getSavedUser,
  getTokens,
  clearAuth,
  isTokenExpired,
  getDarkModePreference,
  setDarkModePreference,
  applyDarkMode,
  clearDarkModePreference,
} from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  darkMode: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  signup: (data: SignupData) => Promise<void>
  refreshUser: () => Promise<void>
  toggleDarkMode: () => Promise<void>
}

interface SignupData {
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  agency_name: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    initializeAuth()
  }, [])

  async function initializeAuth() {
    try {
      const savedDarkMode = getDarkModePreference()
      setDarkMode(savedDarkMode)
      applyDarkMode(savedDarkMode)

      const savedUser = getSavedUser()
      const tokens = getTokens()

      if (savedUser && tokens) {
        if (isTokenExpired(tokens.access)) {
          try {
            const freshUser = await api.getCurrentUser()
            setUser(freshUser)
            saveUser(freshUser)
            if (freshUser.dark_mode !== undefined) {
              setDarkMode(freshUser.dark_mode)
              setDarkModePreference(freshUser.dark_mode)
            }
          } catch {
            clearAuth()
            setUser(null)
          }
        } else {
          setUser(savedUser)
          if (savedUser.dark_mode !== undefined) {
            setDarkMode(savedUser.dark_mode)
            setDarkModePreference(savedUser.dark_mode)
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      clearAuth()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    const response: LoginResponse = await api.login(email, password)
    setTokens({ access: response.access, refresh: response.refresh })
    saveUser(response.user)
    setUser(response.user)
    if (response.user.dark_mode !== undefined) {
      setDarkMode(response.user.dark_mode)
      setDarkModePreference(response.user.dark_mode)
    }
  }

  function logout() {
    clearAuth()
    clearDarkModePreference()
    setUser(null)
    setDarkMode(false)
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  async function signup(data: SignupData) {
    const response = await api.agencySignup(data)
    if (response.user) {
      await login(data.email, data.password)
    } else if (response.error || response.errors) {
      throw new Error(response.error || Object.values(response.errors)[0])
    }
  }

  async function refreshUser() {
    try {
      const freshUser = await api.getCurrentUser()
      setUser(freshUser)
      saveUser(freshUser)
      if (freshUser.dark_mode !== undefined) {
        setDarkMode(freshUser.dark_mode)
        setDarkModePreference(freshUser.dark_mode)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  async function toggleDarkMode() {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    setDarkModePreference(newDarkMode)
    try {
      const response = await api.updatePreferences({ dark_mode: newDarkMode })
      if (response.user) {
        setUser(response.user)
        saveUser(response.user)
      }
    } catch (error) {
      console.error('Failed to update dark mode preference:', error)
      setDarkMode(darkMode)
      setDarkModePreference(darkMode)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, darkMode, login, logout, signup, refreshUser, toggleDarkMode }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
