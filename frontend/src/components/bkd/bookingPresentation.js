export const bookingStatuses = {
  pending_payment: 'Chờ thanh toán', pending_approval: 'Chờ duyệt', confirmed: 'Đã xác nhận',
  checked_in: 'Đã tiếp nhận', completed: 'Hoàn thành', cancelled: 'Đã huỷ',
  expired: 'Hết hạn', rejected: 'Bị từ chối', no_show: 'Không đến khám',
}

export function statusLabel(status) {
  return bookingStatuses[status] || status || 'Chưa có trạng thái'
}

export function formatMoney(value) {
  return value === null || value === undefined ? 'Chưa có dữ liệu' : Number(value).toLocaleString('vi-VN') + ' ₫'
}

export function apiErrorCode(error) {
  return error.raw?.response?.data?.code || error.code
}

export function apiErrorMessage(error) {
  const messages = {
    STALE_VERSION: 'Lịch đã thay đổi',
    UNAUTHENTICATED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    FORBIDDEN: 'Bạn không có quyền thao tác trên dữ liệu này.',
    NOT_FOUND: 'Không tìm thấy dữ liệu. Vui lòng cập nhật danh sách.',
    HTTP_ERROR: 'Không thực hiện được yêu cầu. Vui lòng cập nhật và thử lại.',
    SE001: 'Ca khám hết chỗ, giao giờ hoặc có lịch xung đột. Vui lòng chọn ca khác.',
    IDEMPOTENCY_CONFLICT: 'Yêu cầu đã được dùng với thông tin khác. Vui lòng cập nhật dữ liệu.',
    BKD_CONFLICT: error.message || 'Dữ liệu đã thay đổi hoặc không cho phép thao tác. Vui lòng cập nhật lại.',
    VALIDATION_ERROR: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường nhập và thử lại.',
    INVALID_BOOKING_TRANSITION: 'Trạng thái lịch không cho phép thao tác. Vui lòng cập nhật danh sách.',
    BKD_INTEGRATION_UNAVAILABLE: 'Dịch vụ tích hợp chưa sẵn sàng. Vui lòng thử lại sau.',
    BKD_UNAVAILABLE: 'Dịch vụ đặt lịch tạm thời gặp lỗi. Vui lòng thử lại sau.',
    DATABASE_UNAVAILABLE: 'Chưa kết nối được dữ liệu. Vui lòng thử lại sau.',
  }
  if (!error.status && error.raw) return 'Không kết nối được dịch vụ. Vui lòng kiểm tra mạng và thử lại.'
  return messages[apiErrorCode(error)] || (error.status === 401 ? messages.UNAUTHENTICATED
    : error.status === 403 ? messages.FORBIDDEN : error.message) || 'Không thực hiện được yêu cầu. Vui lòng thử lại.'
}

export function needsRefresh(error) {
  return ['STALE_VERSION', 'BKD_CONFLICT', 'INVALID_BOOKING_TRANSITION', 'NOT_FOUND'].includes(apiErrorCode(error))
}
