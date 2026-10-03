import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor gắn Bearer token nếu có trong localStorage
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor bắt lỗi và chuẩn hóa
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Trích xuất message chuẩn từ response.data.message
    const message =
      error.response?.data?.message ||
      error.message ||
      'Đã có lỗi xảy ra trong quá trình xử lý.';
    
    return Promise.reject({
      status: error.response?.status,
      message,
      errors: error.response?.data?.errors || null,
      raw: error,
    });
  }
);

export default axiosClient;
