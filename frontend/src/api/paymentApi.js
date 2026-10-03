import axiosClient from './axiosClient';

const paymentApi = {
  /**
   * Tính toán hóa đơn đặt khám bệnh viện
   * @param {string|number} bookingId
   */
  calculateInvoice: (bookingId) => {
    return axiosClient.post('/payments/calculate-invoice', { booking_id: bookingId });
  },

  /**
   * Khởi tạo giao dịch thanh toán
   * @param {{ booking_id: string|number, method: string }} data
   */
  createPayment: (data) => {
    return axiosClient.post('/payments/create', data);
  },

  /**
   * Xác nhận thanh toán (sau khi nhập OTP / xác thực ngân hàng)
   * @param {{ payment_id: number, otp?: string, transaction_code?: string }} data
   */
  confirmPayment: (data) => {
    return axiosClient.post('/payments/confirm', data);
  },

  /**
   * Lấy chi tiết thông tin thanh toán theo ID
   * @param {number} paymentId
   */
  getPaymentDetail: (paymentId) => {
    return axiosClient.get(`/payments/${paymentId}`);
  },

  /**
   * Hủy giao dịch thanh toán
   * @param {number} paymentId
   */
  cancelPayment: (paymentId) => {
    return axiosClient.post(`/payments/${paymentId}/cancel`);
  },
};

export default paymentApi;
