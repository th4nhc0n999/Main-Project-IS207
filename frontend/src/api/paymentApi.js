import axiosClient from './axiosClient';

/**
 * paymentApi — Tích hợp API Cổng thanh toán MedSi (Sprint 4: S4-60..65)
 * Kết nối trực tiếp vào Laravel Backend /api/payments
 */
const paymentApi = {
  /**
   * Bắt đầu giao dịch thanh toán
   * @param {{ booking_id: number|string, method: 'qr_pay'|'momo'|'atm'|'credit_card'|'store_pay' }} data
   */
  start: (data) => {
    return axiosClient.post('/payments/start', data);
  },

  /**
   * Mô phỏng xác nhận kết quả thanh toán từ cổng (chỉ cho môi trường thử nghiệm)
   * @param {{ transaction_code: string, status: 'success'|'failed' }} data
   */
  simulate: (data) => {
    return axiosClient.post('/payments/simulate', data);
  },

  /**
   * Lấy thông tin thanh toán của một booking
   * @param {number|string} bookingId
   */
  getByBooking: (bookingId) => {
    return axiosClient.get(`/payments/bookings/${bookingId}`);
  },

  /**
   * Tra cứu chi tiết một giao dịch theo transaction_code
   * @param {string} code
   */
  getTransaction: (code) => {
    return axiosClient.get(`/payments/transactions/${code}`);
  },

  /**
   * Truy vấn trạng thái giao dịch MoMo Sandbox
   * @param {string} code
   */
  queryMomo: (code) => {
    return axiosClient.post(`/payments/momo/transactions/${code}/query`);
  },

  /**
   * Admin / Quầy xác nhận thanh toán tại quầy (Store Pay)
   * @param {number|string} bookingId
   */
  confirmCounter: (bookingId) => {
    return axiosClient.post(`/payments/bookings/${bookingId}/counter-confirm`);
  },
};

export default paymentApi;
