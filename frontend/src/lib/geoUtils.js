// Utility functions for Near-me Geolocation & Haversine Distance Calculation
// Compliant with ACT-UI-01, BR-UI-08, BR-UI-09, BR-UI-10, BR-UI-23

export const EARTH_RADIUS_KM = 6371 // Bán kính Trái Đất chuẩn WGS84

/**
 * Tính khoảng cách Haversine giữa 2 tọa độ GPS (kinh độ, vĩ độ)
 * @param {number} lat1 Vĩ độ điểm 1
 * @param {number} lon1 Kinh độ điểm 1
 * @param {number} lat2 Vĩ độ điểm 2
 * @param {number} lon2 Kinh độ điểm 2
 * @returns {number} Khoảng cách tính bằng km
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null
  
  const toRad = (deg) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const radLat1 = toRad(lat1)
  const radLat2 = toRad(lat2)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = EARTH_RADIUS_KM * c

  return distance
}

/**
 * Định dạng hiển thị khoảng cách theo chuẩn BR-UI-09 (làm tròn 1 chữ số thập phân)
 * @param {number} km Khoảng cách theo km
 * @returns {string} Chuỗi hiển thị (VD: "1.4 km")
 */
export function formatDistance(km) {
  if (km == null || isNaN(km)) return ""
  if (km < 0.1) return "< 100 m"
  return `${km.toFixed(1)} km`
}

/**
 * Ước tính thời gian di chuyển bằng xe máy trung bình trong đô thị (~25 km/h)
 * @param {number} km
 * @returns {string}
 */
export function estimateTravelTime(km) {
  if (km == null || isNaN(km)) return ""
  const minutes = Math.max(2, Math.round((km / 22) * 60))
  if (minutes < 60) {
    return `~${minutes} phút đi xe`
  }
  const hours = Math.floor(minutes / 60)
  const remMinutes = minutes % 60
  return `~${hours}h${remMinutes > 0 ? ` ${remMinutes}p` : ""} đi xe`
}

/**
 * Tọa độ trung tâm các Quận/Huyện TP.HCM phục vụ Fallback (EX-UI-01)
 * Khi người dùng từ chối quyền GPS hoặc trình duyệt không hỗ trợ.
 */
export const POPULAR_DISTRICTS = [
  { id: "q1", name: "Quận 1, TP.HCM", lat: 10.7758, lng: 106.7009, isDefault: true },
  { id: "q3", name: "Quận 3, TP.HCM", lat: 10.7843, lng: 106.6845 },
  { id: "q5", name: "Quận 5, TP.HCM", lat: 10.7540, lng: 106.6634 },
  { id: "q10", name: "Quận 10, TP.HCM", lat: 10.7716, lng: 106.6669 },
  { id: "q11", name: "Quận 11, TP.HCM", lat: 10.7630, lng: 106.6508 },
  { id: "binhthanh", name: "Quận Bình Thạnh, TP.HCM", lat: 10.8030, lng: 106.6993 },
  { id: "phunhuan", name: "Quận Phú Nhuận, TP.HCM", lat: 10.7992, lng: 106.6803 },
  { id: "tanbinh", name: "Quận Tân Bình, TP.HCM", lat: 10.8014, lng: 106.6528 },
  { id: "govap", name: "Quận Gò Vấp, TP.HCM", lat: 10.8388, lng: 106.6653 },
  { id: "thuduc", name: "TP. Thủ Đức, TP.HCM", lat: 10.8494, lng: 106.7716 },
  { id: "q7", name: "Quận 7, TP.HCM", lat: 10.7340, lng: 106.7218 },
  { id: "hanoi_hk", name: "Quận Hoàn Kiếm, Hà Nội", lat: 21.0285, lng: 105.8542 },
  { id: "danang_hc", name: "Quận Hải Châu, Đà Nẵng", lat: 16.0678, lng: 108.2208 },
]

/**
 * Các mốc bán kính tìm kiếm Near-me chuẩn quy định BR-UI-08
 */
export const RADIUS_OPTIONS = [
  { label: "< 2 km", value: 2, desc: "Rất gần (Đi bộ / 5p xe)" },
  { label: "< 5 km", value: 5, desc: "Gần bạn (Mặc định)", isDefault: true },
  { label: "< 10 km", value: 10, desc: "Khu vực nội thành" },
  { label: "< 20 km", value: 20, desc: "Bán kính mở rộng" },
  { label: "Tất cả", value: 9999, desc: "Không giới hạn cự ly" },
]

/**
 * Lấy tọa độ GPS thiết bị qua Geolocation API của trình duyệt
 * @returns {Promise<{success: boolean, lat?: number, lng?: number, accuracy?: number, error?: string, code?: number}>}
 */
export function getBrowserGeolocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        code: 0,
        error: "Trình duyệt của bạn không hỗ trợ tính năng định vị GPS.",
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (err) => {
        let msg = "Không thể xác định vị trí hiện tại."
        if (err.code === 1) {
          msg = "Bạn đã từ chối cấp quyền truy cập vị trí GPS (EX-UI-01)."
        } else if (err.code === 2) {
          msg = "Thiết bị không bắt được tín hiệu định vị."
        } else if (err.code === 3) {
          msg = "Hết thời gian chờ phản hồi từ GPS (Timeout)."
        }
        resolve({
          success: false,
          code: err.code,
          error: msg,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    )
  })
}
