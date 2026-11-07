import axiosClient from './axiosClient'

export const hospitalBookingApi = {
  hospitals: () => axiosClient.get('/hospitals'),
  options: (id) => axiosClient.get(`/hospitals/${id}/booking-options`),
  slots: (id, params) => axiosClient.get(`/hospitals/${id}/slots`, { params }),
  create: (data) => axiosClient.post('/hospital-bookings', data),
  history: (params) => axiosClient.get('/me/bookings', { params }),
  ticket: (id) => axiosClient.get(`/bookings/${id}/ticket`),
  checkIn: (qr_token) => axiosClient.post('/tickets/check-in', { qr_token }),
}
