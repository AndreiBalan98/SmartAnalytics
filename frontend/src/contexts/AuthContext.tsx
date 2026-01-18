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

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth()
  }, [])

  async function initializeAuth() {
    try {
      // Apply dark mode from localStorage immediately (before API)
      const savedDarkMode = getDarkModePreference()
      setDarkMode(savedDarkMode)
      applyDarkMode(savedDarkMode)

      const savedUser = getSavedUser()
      const tokens = getTokens()

      if (savedUser && tokens) {
        // Check if token is expired
        if (isTokenExpired(tokens.access)) {
          // Try to refresh
          try {
            const freshUser = await api.getCurrentUser()
            setUser(freshUser)
            saveUser(freshUser)
            // Sync dark mode from server (override localStorage)
            if (freshUser.dark_mode !== undefined) {
              setDarkMode(freshUser.dark_mode)
              setDarkModePreference(freshUser.dark_mode)
            }
          } catch {
            // Refresh failed, clear auth
            clearAuth()
            setUser(null)
          }
        } else {
          // Token is valid, use saved user
          setUser(savedUser)
          // Sync dark mode from saved user
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
    try {
      const response: LoginResponse = await api.login(email, password)

      // Store tokens
      setTokens({
        access: response.access,
        refresh: response.refresh,
      })

      // Store user
      saveUser(response.user)
      setUser(response.user)

      // Apply dark mode from user response
      if (response.user.dark_mode !== undefined) {
        setDarkMode(response.user.dark_mode)
        setDarkModePreference(response.user.dark_mode)
      }
    } catch (error) {
      throw error
    }
  }

  function logout() {
    clearAuth()
    clearDarkModePreference()
    setUser(null)
    setDarkMode(false)
    // Redirect to home
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  async function signup(data: SignupData) {
    try {
      const response = await api.agencySignup(data)

      if (response.user) {
        // Auto-login after signup
        await login(data.email, data.password)
      } else if (response.error || response.errors) {
        throw new Error(response.error || Object.values(response.errors)[0])
      }
    } catch (error) {
      throw error
    }
  }

  async function refreshUser() {
    try {
      const freshUser = await api.getCurrentUser()
      setUser(freshUser)
      saveUser(freshUser)
      // Sync dark mode from server
      if (freshUser.dark_mode !== undefined) {
        setDarkMode(freshUser.dark_mode)
        setDarkModePreference(freshUser.dark_mode)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  async function toggleDarkMode() {
    // Optimistic update (instant UI change)
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    setDarkModePreference(newDarkMode)

    try {
      // Persist to server
      const response = await api.updateUserPreferences({ dark_mode: newDarkMode })
      // Update user object with new preference
      if (response.user) {
        setUser(response.user)
        saveUser(response.user)
      }
    } catch (error) {
      console.error('Failed to update dark mode preference:', error)
      // Revert on error
      setDarkMode(darkMode)
      setDarkModePreference(darkMode)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        darkMode,
        login,
        logout,
        signup,
        refreshUser,
        toggleDarkMode,
      }}
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
