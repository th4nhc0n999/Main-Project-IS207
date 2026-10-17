import axiosClient from './axiosClient';

/**
 * authApi — các hàm gọi API xác thực người dùng.
 * Tất cả đều trả về Promise; lỗi đã được chuẩn hóa bởi axiosClient interceptor.
 */
const authApi = {
  /**
   * Đăng ký tài khoản mới.
   * @param {{ name: string, email: string, password: string, password_confirmation: string, phone?: string }} data
   */
  register(data) {
    return axiosClient.post('/auth/register', data);
  },

  /**
   * Đăng nhập và nhận về Sanctum token.
   * @param {{ email: string, password: string }} credentials
   */
  login(credentials) {
    return axiosClient.post('/auth/login', credentials);
  },

  /**
   * Đăng xuất — thu hồi token hiện tại.
   * Yêu cầu Bearer token trong header (axiosClient tự gắn từ localStorage).
   */
  logout() {
    return axiosClient.post('/auth/logout');
  },

  /**
   * Lấy thông tin người dùng đang đăng nhập.
   * Dùng khi khởi động app để restore session.
   */
  me() {
    return axiosClient.get('/auth/me');
  },
};

export default authApi;
