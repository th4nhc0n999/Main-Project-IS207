import axiosClient from './axiosClient'

// BKD contract only. UI integration belongs to S4-71/S4-73 (Quốc Huy).
const doctorBookingApi = {
  slots: (doctorId, date) => axiosClient.get(`/doctors/${doctorId}/slots`, { params: { date } }),
  createSlot: (data) => axiosClient.post('/doctor/slots', data),
  updateSlot: (slotId, data) => axiosClient.put(`/doctor/slots/${slotId}`, data),
  adminUpdateSlot: (slotId, data) => axiosClient.put(`/admin/doctor-slots/${slotId}`, data),
  blockSlot: (slotId) => axiosClient.post(`/admin/doctor-slots/${slotId}/block`),
  create: (data) => axiosClient.post('/doctor-bookings', data),
  detail: (id) => axiosClient.get(`/doctor-bookings/${id}`),
  mine: (params = {}) => axiosClient.get('/patient/doctor-bookings', { params }),
  doctorBookings: (params = {}) => axiosClient.get('/doctor/bookings', { params }),
  approve: (id, version) => axiosClient.post(`/doctor/bookings/${id}/approve`, { version }),
  reject: (id, version, reason) => axiosClient.post(`/doctor/bookings/${id}/reject`, { version, reason }),
  cancel: (id, version, reason, reasonCode = null) => axiosClient.post(`/doctor-bookings/${id}/cancel`, {
    version, reason, reason_code: reasonCode,
  }),
}

export default doctorBookingApi
