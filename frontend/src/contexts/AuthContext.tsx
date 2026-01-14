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
} from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  signup: (data: SignupData) => Promise<void>
  refreshUser: () => Promise<void>
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

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth()
  }, [])

  async function initializeAuth() {
    try {
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
          } catch {
            // Refresh failed, clear auth
            clearAuth()
            setUser(null)
          }
        } else {
          // Token is valid - fetch fresh user data to ensure permissions are current
          // This is especially important for client users who need up-to-date permissions
          try {
            const freshUser = await api.getCurrentUser()
            setUser(freshUser)
            saveUser(freshUser)
          } catch {
            // If fetch fails (e.g., network error), use saved user as fallback
            setUser(savedUser)
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

      // Fetch full user data (includes agencies/permissions for clients)
      // The login response only includes basic user info
      const fullUser = await api.getCurrentUser()
      
      // Store full user data
      saveUser(fullUser)
      setUser(fullUser)
    } catch (error) {
      throw error
    }
  }

  function logout() {
    clearAuth()
    setUser(null)
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
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        signup,
        refreshUser,
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
