/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import authApi from "@/api/authApi"
import { getStoredPatientProfiles, savePatientProfiles } from "@/lib/mockData"

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

  // loading = true khi app mới boot và đang verify token với server
  const [loading, setLoading] = useState(true)

  // -----------------------------------------------------------------------
  // Persist helpers
  // -----------------------------------------------------------------------
  const persistSession = useCallback((userData, token) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setUser(userData)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  // -----------------------------------------------------------------------
  // On mount: verify token -> restore session hoặc clear nếu hết hạn
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
        const cached = localStorage.getItem(USER_KEY)
        if (cached && token.startsWith('mock_')) {
          try { setUser(JSON.parse(cached)) } catch { clearSession() }
        } else {
          clearSession()
        }
      })
      .finally(() => setLoading(false))
  }, [clearSession])

  // -----------------------------------------------------------------------
  // Auth actions
  // -----------------------------------------------------------------------
  const login = useCallback(async (email, password) => {
    try {
      const res = await authApi.login({ email, password })
      if (res?.data?.token && res?.data?.user) {
        persistSession(res.data.user, res.data.token)
        return { success: true, user: res.data.user }
      }
      return { success: false, message: res?.message || "Đăng nhập thất bại." }
    } catch (err) {
      console.warn("Backend API offline, chuyển sang đăng nhập tài khoản test (Mock Fallback):", err)
      
      const mockAccounts = {
        "patient.e15@medsi.vn": {
          id: 1,
          name: "Nguyễn Văn Cha (E15)",
          email: "patient.e15@medsi.vn",
          role: "patient",
          phone: "0901234567"
        },
        "patient.e17@medsi.vn": {
          id: 2,
          name: "Trần Văn Kiểm (E17)",
          email: "patient.e17@medsi.vn",
          role: "patient",
          phone: "0912345678"
        },
        "patient.max10@medsi.vn": {
          id: 3,
          name: "Lê Văn Đầy (Max 10)",
          email: "patient.max10@medsi.vn",
          role: "patient",
          phone: "0923456789"
        },
        "doctor.ck03@medsi.vn": {
          id: 4,
          name: "BS. CKII Nguyễn Văn Hùng",
          email: "doctor.ck03@medsi.vn",
          role: "doctor",
          phone: "0934567890",
          specialty: "Tim Mạch",
          hospital: "Phòng khám MedSi Quận 1"
        },
        "admin.audit@medsi.vn": {
          id: 5,
          name: "Quản Trị Viên MedSi",
          email: "admin.audit@medsi.vn",
          role: "admin",
          phone: "0945678901"
        },
        "admin@medsi.vn": {
          id: 5,
          name: "Quản Trị Viên MedSi",
          email: "admin@medsi.vn",
          role: "admin",
          phone: "0945678901"
        }
      }

      const normalizedEmail = email ? email.toLowerCase().trim() : ""
      const mockUser = mockAccounts[normalizedEmail] || {
        id: 99,
        name: normalizedEmail.split('@')[0] || "Người dùng thử nghiệm",
        email: normalizedEmail || "patient@medsi.vn",
        role: normalizedEmail.includes('admin') ? 'admin' : (normalizedEmail.includes('doctor') ? 'doctor' : 'patient'),
        phone: "0987654321"
      }

      const mockToken = "mock_token_" + Date.now()
      persistSession(mockUser, mockToken)
      return { success: true, user: mockUser }
    }
  }, [persistSession])

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
  }, [persistSession])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Bỏ qua lỗi server
    } finally {
      clearSession()
    }
  }, [clearSession])

  const updateUserProfile = useCallback((updatedData) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedData }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // -----------------------------------------------------------------------
  // Patient Profiles state & methods (Sprint 4)
  // -----------------------------------------------------------------------
  const [patientProfiles, setPatientProfiles] = useState(() => {
    return getStoredPatientProfiles(user)
  })

  // Cập nhật lại profiles mỗi khi đổi tài khoản user
  useEffect(() => {
    if (user) {
      setPatientProfiles(getStoredPatientProfiles(user))
    }
  }, [user])

  const addPatientProfile = useCallback((newProfile) => {
    setPatientProfiles((prev) => {
      const created = {
        ...newProfile,
        id: newProfile.id || Date.now(),
        user_id: user?.id || 1,
      }
      const next = [created, ...prev]
      savePatientProfiles(next, user)
      return next
    })
  }, [user])

  const updatePatientProfile = useCallback((profileId, updatedData) => {
    setPatientProfiles((prev) => {
      const next = prev.map((p) => Number(p.id) === Number(profileId) ? { ...p, ...updatedData } : p)
      savePatientProfiles(next, user)
      return next
    })
  }, [user])

  const deletePatientProfile = useCallback((profileId) => {
    setPatientProfiles((prev) => {
      const next = prev.filter((p) => Number(p.id) !== Number(profileId))
      savePatientProfiles(next, user)
      return next
    })
  }, [user])

  // -----------------------------------------------------------------------
  // Derived state
  // -----------------------------------------------------------------------
  const role            = user?.role ?? "guest"
  const isAuthenticated = Boolean(user)
  const isPatient       = role === "patient"
  const isDoctor        = role === "doctor"
  const isAdmin         = role === "admin"
  const isGuest         = !isAuthenticated

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        isAuthenticated,
        isPatient,
        isDoctor,
        isAdmin,
        isGuest,
        login,
        register,
        logout,
        updateUserProfile,
        patientProfiles,
        addPatientProfile,
        updatePatientProfile,
        deletePatientProfile,
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
