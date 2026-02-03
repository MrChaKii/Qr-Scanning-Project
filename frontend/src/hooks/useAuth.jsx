import React, { useEffect, useState, createContext, useContext } from 'react'
import {
  getCurrentUser,
  login as loginService,
  logout as logoutService,
} from '../services/auth.service'

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const normalizeUser = (u) => {
    if (!u) return null
    const role = typeof u.role === 'string' ? u.role.toLowerCase() : u.role
    return { ...u, role }
  }

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(normalizeUser(currentUser))
    setIsLoading(false)
  }, [])

  const login = async (email, password) => {
    const response = await loginService(email, password)
    const normalized = {
      ...response,
      user: normalizeUser(response.user),
    }
    setUser(normalized.user)
    return normalized
  }

  const logout = () => {
    logoutService()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
