/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import authApi from "@/api/authApi"

const AuthContext = createContext(null)

const TOKEN_KEY = "access_token"
const USER_KEY  = "medsi_auth_user"

export function AuthProvider({ children }) {
  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) ?? null }
    catch { return null }
  })

  // loading = true saat pertama kali app boot & kita verify token ke server
  const [loading, setLoading] = useState(true)

  // -----------------------------------------------------------------------
  // Persist helpers
  // -----------------------------------------------------------------------
  const persistSession = (userData, token) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setUser(userData)
  }

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  // -----------------------------------------------------------------------
  // On mount: verify token → restore session hoặc clear nếu hết hạn
  // -----------------------------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }

    authApi.me()
      .then((res) => {
        if (res?.data?.user) {
          setUser(res.data.user)
          localStorage.setItem(USER_KEY, JSON.stringify(res.data.user))
        } else {
          clearSession()
        }
      })
      .catch(() => {
        // Token không hợp lệ / hết hạn → clear
        clearSession()
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------
  // Auth actions
  // -----------------------------------------------------------------------

  /**
   * Đăng nhập thật qua API.
   * @returns {{ success: boolean, user?: object, message?: string }}
   */
  const login = useCallback(async (email, password) => {
    try {
      const res = await authApi.login({ email, password })
      if (res?.data?.token && res?.data?.user) {
        persistSession(res.data.user, res.data.token)
        return { success: true, user: res.data.user }
      }
      return { success: false, message: res?.message || "Đăng nhập thất bại." }
    } catch (err) {
      return { success: false, message: err?.message || "Sai email hoặc mật khẩu." }
    }
  }, [])

  /**
   * Đăng ký tài khoản bệnh nhân mới.
   * @returns {{ success: boolean, user?: object, message?: string, errors?: object }}
   */
  const register = useCallback(async (data) => {
    try {
      const payload = {
        name:                  data.name,
        email:                 data.email,
        password:              data.password,
        password_confirmation: data.passwordConfirmation,
        phone:                 data.phone || undefined,
      }
      const res = await authApi.register(payload)
      if (res?.data?.token && res?.data?.user) {
        persistSession(res.data.user, res.data.token)
        return { success: true, user: res.data.user }
      }
      return { success: false, message: res?.message || "Đăng ký thất bại." }
    } catch (err) {
      return {
        success: false,
        message: err?.message || "Đăng ký thất bại.",
        errors:  err?.errors  || null,
      }
    }
  }, [])

  /**
   * Đăng xuất: revoke token trên server, xoá localStorage.
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore server error — vẫn clear local state
    } finally {
      clearSession()
    }
  }, [])

  // -----------------------------------------------------------------------
  // Derived state
  // -----------------------------------------------------------------------
  const role           = user?.role ?? "guest"
  const isAuthenticated = Boolean(user)
  const isPatient       = role === "patient"
  const isAdmin         = role === "admin"
  const isGuest         = !isAuthenticated

  // -----------------------------------------------------------------------
  // Context value
  // -----------------------------------------------------------------------
  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        isAuthenticated,
        isPatient,
        isAdmin,
        isGuest,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
