import client from './axiosClient'
import { 
  getStoredBookings, 
  saveBookings, 
  getStoredPatientProfiles, 
  savePatientProfiles, 
  getStoredSlots, 
  saveSlots 
} from "@/lib/mockData"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"

/**
 * Helper lấy token xác thực từ LocalStorage
 */
function getAuthToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("auth_token") || localStorage.getItem("token") || ""
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
// 1. BOOKINGS API
// ========================================================

export async function fetchUserBookings({ status = "all", q = "", page = 1, per_page = 20 } = {}) {
  try {
    const res = await client.get('/me/bookings', { params: { status: status !== "all" ? status : undefined, q: q || undefined, page, per_page } })
    return {
      success: true,
      data: res.data || [],
      pagination: res.pagination,
      source: "api",
    }
  } catch (err) {
    console.warn("API /me/bookings không phản hồi, chuyển sang fallback LocalStorage:", err.message)
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

export async function cancelUserBooking(bookingId, cancelReason = "") {
  try {
    const res = await client.patch(`/bookings/${bookingId}/cancel`, { reason: cancelReason })
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
// 2. PATIENT PROFILES API (Hiệu - Sprint 4: S4-20..25)
// ========================================================

export async function fetchPatientProfiles() {
  try {
    const res = await client.get('/patient-profiles')
    return { success: true, data: res.data || [], source: "api" }
  } catch (err) {
    console.warn("API /patient-profiles không khả dụng, lấy từ LocalStorage:", err.message)
    const profiles = getStoredPatientProfiles()
    return { success: true, data: profiles, source: "mock" }
  }
}

export async function createPatientProfile(profileData) {
  try {
    const res = await client.post('/patient-profiles', profileData)
    return { success: true, data: res.data, source: "api" }
  } catch (err) {
    console.warn("API /patient-profiles offline, xử lý mock:", err.message)
    const profiles = getStoredPatientProfiles()

    // BR-PRF-01: Chặn vượt quá 10 hồ sơ
    if (profiles.length >= 10) {
      const error = new Error("Tài khoản đã đạt giới hạn tối đa 10 hồ sơ. Vui lòng xóa bớt trước khi thêm mới.")
      error.status = 422
      throw error
    }

    // BR-PRF-02: Không trùng số CCCD trong cùng tài khoản
    if (profileData.identity_card_number?.trim()) {
      const cccd = profileData.identity_card_number.trim()
      const duplicate = profiles.find((p) => (p.identity_card_number === cccd || p.identity_card === cccd) && !p.deleted_at)
      if (duplicate) {
        const error = new Error(`Số CCCD "${cccd}" đã tồn tại trên hồ sơ của "${duplicate.full_name}".`)
        error.status = 422
        throw error
      }
    }

    const newProfile = {
      id: Date.now(),
      ...profileData,
      identity_card: profileData.identity_card_number || profileData.identity_card || "",
      is_default: profiles.length === 0 ? true : Boolean(profileData.is_default),
      created_at: new Date().toISOString(),
    }

    const updated = [newProfile, ...profiles]
    savePatientProfiles(updated)
    return { success: true, data: newProfile, source: "mock" }
  }
}

export async function updatePatientProfile(profileId, profileData) {
  try {
    const res = await client.put(`/patient-profiles/${profileId}`, profileData)
    return { success: true, data: res.data, source: "api" }
  } catch (err) {
    const pId = Number(profileId)
    const profiles = getStoredPatientProfiles()

    if (profileData.identity_card_number?.trim()) {
      const cccd = profileData.identity_card_number.trim()
      const duplicate = profiles.find(
        (p) => Number(p.id) !== pId && !p.deleted_at && (p.identity_card_number === cccd || p.identity_card === cccd)
      )
      if (duplicate) {
        const error = new Error(`Số CCCD "${cccd}" đã tồn tại trên hồ sơ của "${duplicate.full_name}".`)
        error.status = 422
        throw error
      }
    }

    let updatedItem = null
    const updated = profiles.map((p) => {
      if (Number(p.id) === pId) {
        updatedItem = { ...p, ...profileData, identity_card: profileData.identity_card_number || p.identity_card }
        return updatedItem
      }
      return p
    })

    savePatientProfiles(updated)
    return { success: true, data: updatedItem, source: "mock" }
  }
}

export async function deletePatientProfile(profileId) {
  try {
    const res = await client.delete(`/patient-profiles/${profileId}`)
    return { success: true, message: res.message || "Đã xóa hồ sơ thành công!", source: "api" }
  } catch (err) {
    const pId = Number(profileId)
    const bookings = getStoredBookings()

    // TRƯỜNG HỢP 1 (E17): Đang có lịch khám chờ -> CHẶN XÓA
    const activeStatuses = ["pending", "confirmed", "waiting_payment", "processing"]
    const hasActiveBooking = bookings.some(
      (b) => Number(b.patient_profile_id) === pId && activeStatuses.includes(b.status)
    )

    if (hasActiveBooking) {
      const error = new Error("Không thể xóa hồ sơ này vì đang có lịch hẹn khám chưa hoàn thành. Vui lòng hoàn thành hoặc hủy lịch hẹn trước khi xóa.")
      error.status = 400
      error.error_code = "EX-PRF-06"
      throw error
    }

    // TRƯỜNG HỢP 2 (E17): Đã từng có lịch sử khám -> XÓA MỀM (Soft Delete: deleted_at)
    const pastStatuses = ["completed", "cancelled", "rejected", "expired", "no_show"]
    const hasPastHistory = bookings.some(
      (b) => Number(b.patient_profile_id) === pId && pastStatuses.includes(b.status)
    )

    const profiles = getStoredPatientProfiles()
    if (hasPastHistory) {
      const updated = profiles.map((p) => {
        if (Number(p.id) === pId) {
          return { ...p, deleted_at: new Date().toISOString() }
        }
        return p
      })
      savePatientProfiles(updated)
      return { 
        success: true, 
        action: "soft_deleted",
        message: "Đã xóa hồ sơ thành công! Dữ liệu lịch sử khám trước đây vẫn được lưu trữ bảo mật theo quy định y tế.",
        source: "mock" 
      }
    } else {
      // TRƯỜNG HỢP 3 (E17): Chưa từng phát sinh lịch khám -> XÓA HOÀN TOÀN (Hard Delete)
      const filtered = profiles.filter((p) => Number(p.id) !== pId)
      savePatientProfiles(filtered)
      return { 
        success: true, 
        action: "hard_deleted",
        message: "Đã xóa hồ sơ thành công!", 
        source: "mock" 
      }
    }
  }
}

export async function setDefaultPatientProfile(profileId) {
  try {
    const res = await client.patch(`/patient-profiles/${profileId}/default`)
    return { success: true, data: res.data, message: res.message, source: "api" }
  } catch (err) {
    const pId = Number(profileId)
    const profiles = getStoredPatientProfiles()
    const updated = profiles.map((p) => ({
      ...p,
      is_default: Number(p.id) === pId
    }))
    savePatientProfiles(updated)
    return { success: true, message: "Đã đặt làm hồ sơ mặc định!", source: "mock" }
  }
}

export async function fetchEditableProfile(id) {
  try {
    const res = await client.get(`/patient-profiles/${id}`, { params: { mode: 'edit' } })
    return res
  } catch (err) {
    const profiles = getStoredPatientProfiles()
    const found = profiles.find(p => Number(p.id) === Number(id))
    if (found) {
      return { success: true, data: found, source: 'mock' }
    }
    throw err
  }
}

export async function restorePatientProfile(profileId) {
  try {
    const res = await client.post(`/patient-profiles/${profileId}/restore`)
    return { success: true, message: res.message, data: res.data, source: "api" }
  } catch (err) {
    const profiles = getStoredPatientProfiles()
    const updated = profiles.map((p) => {
      if (Number(p.id) === Number(profileId)) {
        return { ...p, deleted_at: null }
      }
      return p
    })
    savePatientProfiles(updated)
    return { success: true, message: "Khôi phục hồ sơ bệnh nhân thành công!", source: "mock" }
  }
}

export async function revokePatientConsent(profileId) {
  try {
    const res = await client.post(`/patient-profiles/${profileId}/revoke-consent`)
    return { success: true, message: res.message, source: "api" }
  } catch (err) {
    return { success: true, message: "Đã ghi nhận rút lại sự đồng thuận theo Nghị định 13/2023/NĐ-CP (bảo lưu dữ liệu lịch sử).", source: "mock" }
  }
}

export async function fetchCurrentUser() {
  try {
    const res = await client.get('/auth/me')
    return { success: true, data: res.data?.user || res.data, source: "api" }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function updateCurrentUser(userData) {
  try {
    const res = await client.put('/user', userData)
    return { success: true, data: res.data, message: res.message, source: "api" }
  } catch (err) {
    return { success: true, data: userData, message: "Cập nhật thông tin thành công", source: "mock" }
  }
}

export async function logoutUser() {
  try {
    await client.post('/auth/logout')
  } catch {}
  finally {
    localStorage.removeItem("access_token")
    localStorage.removeItem("medsi_auth_user")
  }
  return { success: true }
}
