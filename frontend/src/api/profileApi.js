import { 
  getStoredBookings, 
  saveBookings, 
  getStoredPatientProfiles, 
  savePatientProfiles, 
  getStoredSlots, 
  saveSlots 
} from "@/lib/mockData"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

/**
 * Helper lấy token xác thực từ LocalStorage
 */
function getAuthToken() {
  return localStorage.getItem("auth_token") || localStorage.getItem("token") || ""
}

/**
 * Helper gọi fetch kèm header Authorization và JSON headers
 */
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken()
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP error ${response.status}`)
    error.status = response.status
    error.errors = data?.errors
    throw error
  }

  return data
}

// ========================================================
// 1. BOOKINGS API (Lấy danh sách lịch khám, lọc & tìm kiếm)
// ========================================================

/**
 * Lấy danh sách booking của user (có filter status & tìm kiếm từ khóa theo bác sĩ / bệnh viện)
 */
export async function fetchUserBookings({ status = "all", q = "", page = 1, per_page = 20 } = {}) {
  try {
    const params = new URLSearchParams()
    if (status && status !== "all") params.append("status", status)
    if (q) params.append("q", q)
    if (page) params.append("page", page)
    if (per_page) params.append("per_page", per_page)

    const res = await apiRequest(`/bookings?${params.toString()}`)
    return {
      success: true,
      data: res.data || [],
      pagination: res.pagination,
      source: "api",
    }
  } catch (err) {
    console.warn("API /bookings không phản hồi, chuyển sang fallback LocalStorage:", err.message)
    // Fallback sang LocalStorage
    let list = getStoredBookings()

    if (status && status !== "all") {
      list = list.filter((b) => b.status === status)
    }

    if (q) {
      const keyword = q.toLowerCase().trim()
      list = list.filter((b) => {
        return (
          b.code?.toLowerCase().includes(keyword) ||
          b.doctor_name?.toLowerCase().includes(keyword) ||
          b.hospital_name?.toLowerCase().includes(keyword) ||
          b.patient_name?.toLowerCase().includes(keyword) ||
          b.specialty_name?.toLowerCase().includes(keyword)
        )
      })
    }

    return {
      success: true,
      data: list,
      pagination: { current_page: 1, last_page: 1, total: list.length },
      source: "mock",
    }
  }
}

/**
 * Hủy phiếu khám
 */
export async function cancelUserBooking(bookingId, cancelReason = "") {
  try {
    const res = await apiRequest(`/bookings/${bookingId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason: cancelReason }),
    })
    return { success: true, data: res.data, source: "api" }
  } catch (err) {
    console.warn("API cancel booking không khả dụng, cập nhật LocalStorage:", err.message)
    const bookings = getStoredBookings()
    let target = null
    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        target = {
          ...b,
          status: "cancelled",
          cancel_reason: cancelReason || "Bệnh nhân yêu cầu hủy",
          cancelled_at: new Date().toISOString(),
        }
        return target
      }
      return b
    })
    saveBookings(updated)

    // Trả lại slot
    if (target?.slot_id) {
      const slots = getStoredSlots()
      const updatedSlots = slots.map((s) => {
        if (s.id === target.slot_id && s.booked_count > 0) {
          return { ...s, booked_count: s.booked_count - 1, status: "available" }
        }
        return s
      })
      saveSlots(updatedSlots)
    }

    return { success: true, data: target, source: "mock" }
  }
}

// ========================================================
// 2. PATIENT PROFILES API (CRUD Hồ sơ bệnh nhân)
// ========================================================

/**
 * Lấy danh sách hồ sơ bệnh nhân của user
 */
export async function fetchPatientProfiles() {
  try {
    const res = await apiRequest("/patient-profiles")
    return { success: true, data: res.data || [], source: "api" }
  } catch (err) {
    console.warn("API /patient-profiles không khả dụng, lấy từ LocalStorage:", err.message)
    const profiles = getStoredPatientProfiles()
    return { success: true, data: profiles, source: "mock" }
  }
}

/**
 * Thêm mới hồ sơ bệnh nhân
 */
export async function createPatientProfile(profileData) {
  try {
    const res = await apiRequest("/patient-profiles", {
      method: "POST",
      body: JSON.stringify(profileData),
    })
    return { success: true, data: res.data, message: res.message, source: "api" }
  } catch (err) {
    console.warn("API tạo profile không khả dụng, lưu vào LocalStorage:", err.message)
    const profiles = getStoredPatientProfiles()
    const newProfile = {
      ...profileData,
      id: Date.now(),
      user_id: 1,
      created_at: new Date().toISOString(),
    }
    const updated = [newProfile, ...profiles]
    savePatientProfiles(updated)
    return { success: true, data: newProfile, message: "Thêm hồ sơ thành công", source: "mock" }
  }
}

/**
 * Cập nhật hồ sơ bệnh nhân
 */
export async function updatePatientProfile(profileId, profileData) {
  try {
    const res = await apiRequest(`/patient-profiles/${profileId}`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    })
    return { success: true, data: res.data, message: res.message, source: "api" }
  } catch (err) {
    console.warn("API cập nhật profile không khả dụng, cập nhật LocalStorage:", err.message)
    const profiles = getStoredPatientProfiles()
    let updatedItem = null
    const updated = profiles.map((p) => {
      if (p.id === profileId) {
        updatedItem = { ...p, ...profileData, updated_at: new Date().toISOString() }
        return updatedItem
      }
      return p
    })
    savePatientProfiles(updated)
    return { success: true, data: updatedItem, message: "Cập nhật hồ sơ thành công", source: "mock" }
  }
}

/**
 * Xóa hồ sơ bệnh nhân
 */
export async function deletePatientProfile(profileId) {
  try {
    const res = await apiRequest(`/patient-profiles/${profileId}`, {
      method: "DELETE",
    })
    return { success: true, message: res.message, source: "api" }
  } catch (err) {
    console.warn("API xóa profile không khả dụng, xóa từ LocalStorage:", err.message)
    const bookings = getStoredBookings()
    const hasBooking = bookings.some((b) => b.patient_profile_id === profileId)
    if (hasBooking) {
      const error = new Error("Không thể xóa hồ sơ bệnh nhân này do đã có lịch khám trong hệ thống.")
      error.status = 422
      throw error
    }

    const profiles = getStoredPatientProfiles()
    const filtered = profiles.filter((p) => p.id !== profileId)
    savePatientProfiles(filtered)
    return { success: true, message: "Xóa hồ sơ thành công", source: "mock" }
  }
}

// ========================================================
// 3. USER PROFILE & AUTH (Thông tin tài khoản & Đăng xuất)
// ========================================================

/**
 * Lấy thông tin tài khoản đang đăng nhập
 */
export async function fetchCurrentUser() {
  try {
    const res = await apiRequest("/user")
    return { success: true, data: res.data, source: "api" }
  } catch (err) {
    console.warn("API /user không khả dụng, đọc từ auth context:", err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Cập nhật thông tin tài khoản (Họ và tên, SĐT)
 */
export async function updateCurrentUser(userData) {
  try {
    const res = await apiRequest("/user", {
      method: "PUT",
      body: JSON.stringify(userData),
    })
    return { success: true, data: res.data, message: res.message, source: "api" }
  } catch (err) {
    console.warn("API cập nhật user không khả dụng, cập nhật mock user:", err.message)
    return { success: true, data: userData, message: "Cập nhật thông tin thành công (chế độ demo)", source: "mock" }
  }
}

/**
 * Đăng xuất
 */
export async function logoutUser() {
  try {
    await apiRequest("/auth/logout", { method: "POST" })
  } catch {
    // Không quan trọng nếu lỗi mạng
  } finally {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("token")
  }
  return { success: true }
}
