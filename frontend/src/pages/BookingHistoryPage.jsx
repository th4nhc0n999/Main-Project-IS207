import BookingSignIn from '@/components/BookingSignIn'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { hospitalBookingApi as api } from '@/api/hospitalBookingApi'
import { useAuth } from '@/context/AuthContext'

const statuses = {
  pending_payment: 'Chờ thanh toán', pending_approval: 'Chờ bác sĩ duyệt', confirmed: 'Đã xác nhận',
  checked_in: 'Đã tiếp nhận', completed: 'Đã khám', cancelled: 'Đã hủy', expired: 'Đã hết hạn', rejected: 'Bị từ chối', no_show: 'Vắng mặt',
}

export default function BookingHistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab] = useState('upcoming')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState({ loading: true, data: [], pagination: null, error: '' })

  // State cho Modal hủy lịch
  const [cancellingBooking, setCancellingBooking] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  useEffect(() => {
    if (!user) return
    let active = true
    const timer = setTimeout(() => {
      setState((previous) => ({ ...previous, loading: true, error: '' }))
      api.history({ tab, q: search, page }).then((res) => { if (active) setState({ ...res, loading: false, error: '' }) })
        .catch((err) => { if (active) setState({ loading: false, data: [], pagination: null, error: err.message }) })
    }, 200)
    return () => { active = false; clearTimeout(timer) }
  }, [tab, search, page, user, revision])

  const isUnder24Hours = (booking) => {
    if (!booking?.work_date) return false
    const timeStr = booking.start_time ? booking.start_time.slice(0, 5) : '07:30'
    const slotDate = new Date(`${booking.work_date}T${timeStr}:00`)
    return (slotDate.getTime() - Date.now()) < 24 * 60 * 60 * 1000
  }

  const openCancelModal = (booking) => {
    setCancellingBooking(booking)
    setCancelReason('')
    setCancelError('')
  }

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return
    const isPending = cancellingBooking.status === 'pending_payment'
    if (!isPending && !cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do hủy lịch khám.')
      return
    }

    setCancelLoading(true)
    setCancelError('')
    try {
      const res = await api.cancel(cancellingBooking.id, {
        reason: cancelReason.trim() || 'Bệnh nhân hủy giữ chỗ',
      })
      setActionSuccess(res.data?.message || 'Đã hủy lịch khám thành công.')
      setCancellingBooking(null)
      setRevision((v) => v + 1)
    } catch (err) {
      setCancelError(err.response?.data?.message || err.message || 'Không thể hủy lịch khám.')
    } finally {
      setCancelLoading(false)
    }
  }

  if (authLoading) return <p className="p-8">Đang kiểm tra đăng nhập…</p>
  if (!user) return <BookingSignIn title="Lịch khám của tôi"/>

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="MedSi" className="h-8 w-auto object-contain" />
          <h1 className="text-2xl font-bold">Lịch khám của tôi</h1>
        </div>
        <Link className="text-sage-700 underline" to="/hospital-booking">Đặt khám bệnh viện</Link>
      </div>

      {actionSuccess && (
        <div role="status" className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800">
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="text-emerald-700 font-bold ml-4">&times;</button>
        </div>
      )}

      <div role="tablist" aria-label="Trạng thái lịch khám" className="flex flex-wrap gap-2">
        {[['upcoming', 'Sắp khám'], ['completed', 'Đã khám'], ['closed', 'Đã hủy hoặc vắng']].map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => { setTab(value); setPage(1) }}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${tab === value ? 'bg-sage-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Tìm mã phiếu, mã lịch hoặc cơ sở khám
        <input
          className="mt-2 w-full rounded-lg border p-3 focus:border-sage-600 focus:outline-none"
          value={search}
          placeholder="Nhập mã đặt lịch (ví dụ: BK261108...), mã phiếu (TKT...)..."
          maxLength={100}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </label>

      <div className="flex justify-between items-center text-sm">
        <button className="text-sage-700 underline font-medium" onClick={() => setRevision((value) => value + 1)}>
          🔄 Cập nhật trạng thái
        </button>
      </div>

      {state.error && <p role="alert" className="rounded-lg bg-rose-50 p-4 text-rose-800">{state.error}</p>}
      
      {state.loading ? (
        <p role="status" className="text-slate-500 py-8 text-center">Đang tải lịch khám…</p>
      ) : state.data.length === 0 && !state.error ? (
        <p className="text-slate-500 py-8 text-center">Chưa có lịch khám trong mục này.</p>
      ) : (
        state.data.map((booking) => (
          <article key={booking.id} className="space-y-3 rounded-xl border bg-white p-5 shadow-sm hover:shadow transition-shadow">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <strong className="text-base text-slate-900">{booking.code}</strong>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                booking.status === 'pending_payment' ? 'bg-amber-100 text-amber-800' :
                booking.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                'bg-slate-100 text-slate-700'
              }`}>
                {statuses[booking.status] || booking.status}
              </span>
            </div>

            <p className="font-semibold text-slate-800">{booking.hospital_name || booking.doctor_name} · <span className="text-sage-800">{booking.specialty_name}</span></p>
            <p className="text-sm text-slate-600">📅 {booking.work_date} · ⏰ {booking.start_time}–{booking.end_time}</p>
            <p className="text-sm text-slate-600">👤 Người khám: <strong>{booking.patient_snapshot?.full_name}</strong></p>
            
            {booking.payment && (
              <p className="text-sm text-slate-700">
                💳 Tổng: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.payment.total_amount)}</strong> · 
                <span className="ml-1 text-xs px-2 py-0.5 rounded bg-slate-100 font-medium">
                  {booking.payment.status === 'paid' ? 'Đã thanh toán' : booking.payment.status === 'refunded' ? 'Đã hoàn tiền' : 'Chưa xác nhận thanh toán'}
                </span>
              </p>
            )}

            {booking.ticket ? (
              <div className="rounded-lg bg-sage-50 border border-sage-200 p-3 text-sm text-sage-950 space-y-1">
                <p>Mã phiếu: <strong>{booking.ticket.ticket_code}</strong> · Số thứ tự: <strong className="text-base text-sage-800">{booking.ticket.queue_number}</strong></p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Phiếu khám và số thứ tự được cấp khi lịch đã xác nhận.</p>
            )}

            {/* Thanh điều hướng và nút tác vụ */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link className="text-sage-800 underline hover:text-sage-950" to={`/bookings/${booking.id}/refunds`}>
                  Theo dõi hoàn tiền
                </Link>
                {booking.ticket && (
                  <Link className="text-sage-700 underline font-medium hover:text-sage-900" to={`/bookings/${booking.id}/ticket`}>
                    Xem phiếu, QR và tải PNG
                  </Link>
                )}
                {booking.status === 'pending_payment' && (
                  <Link className="font-semibold text-emerald-700 underline hover:text-emerald-900" to={`/payment?booking_id=${booking.id}`}>
                    Tiếp tục thanh toán
                  </Link>
                )}
              </div>

              {/* Nút hủy dành cho tab Sắp khám */}
              {tab === 'upcoming' && (
                <div className="flex items-center gap-2">
                  {booking.status === 'pending_payment' && (
                    <button
                      onClick={() => openCancelModal(booking)}
                      className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      Hủy giữ chỗ
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => openCancelModal(booking)}
                      className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      Hủy lịch khám
                    </button>
                  )}
                </div>
              )}
            </div>
          </article>
        ))
      )}

      {state.pagination && (
        <div className="flex items-center justify-between gap-4 pt-4 border-t text-sm">
          <button disabled={page <= 1 || state.loading} className="rounded-lg border px-3 py-1.5 disabled:opacity-40" onClick={() => setPage(page - 1)}>
            Trang trước
          </button>
          <span>Trang {page} / {state.pagination.last_page}</span>
          <button disabled={page >= state.pagination.last_page || state.loading} className="rounded-lg border px-3 py-1.5 disabled:opacity-40" onClick={() => setPage(page + 1)}>
            Trang sau
          </button>
        </div>
      )}

      {/* MODAL: XÁC NHẬN HỦY LỊCH KHÁM */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {cancellingBooking.status === 'pending_payment' ? 'Xác nhận hủy giữ chỗ' : 'Xác nhận hủy lịch khám'}
              </h3>
              <button
                onClick={() => setCancellingBooking(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 text-sm space-y-1 text-slate-700">
              <p><strong>Mã lịch:</strong> {cancellingBooking.code}</p>
              <p><strong>Cơ sở:</strong> {cancellingBooking.hospital_name || cancellingBooking.doctor_name}</p>
              <p><strong>Chuyên khoa:</strong> {cancellingBooking.specialty_name}</p>
              <p><strong>Thời gian:</strong> {cancellingBooking.work_date} ({cancellingBooking.start_time} - {cancellingBooking.end_time})</p>
            </div>

            {cancellingBooking.status === 'pending_payment' ? (
              <p className="text-sm text-slate-600">
                Bạn đang yêu cầu hủy giữ chỗ ca khám này. Chỗ khám sẽ được giải phóng ngay lập tức cho bệnh nhân khác và không phát sinh bất kỳ khoản phí nào.
              </p>
            ) : isUnder24Hours(cancellingBooking) ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-950 space-y-2">
                  <p className="font-semibold flex items-center gap-1.5 text-amber-900">
                    <span>⚠️</span> Lịch khám còn dưới 24 giờ
                  </p>
                  <p>
                    Theo quy định của hệ thống MedSi, bệnh nhân không thể tự hủy trên web khi thời gian đến ca khám còn dưới 24 giờ.
                  </p>
                  <p className="pt-1 text-xs text-amber-900">
                    📞 Vui lòng liên hệ <strong>Tổng đài hỗ trợ MedSi: 1900 1234</strong> để được nhân viên tiếp nhận hỗ trợ hủy lịch hộ và xem xét chính sách hoàn 50% tiền khám.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 space-y-1">
                  <p className="font-semibold">✓ Chính sách hoàn tiền hợp lệ</p>
                  <p>Bạn sẽ được hoàn lại <strong>100% tiền khám</strong> qua phương thức thanh toán ban đầu. Phí tiện ích hệ thống (20.000đ) không hoàn lại.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Lý do hủy lịch khám <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    className="w-full rounded-lg border p-2.5 text-sm focus:border-sage-600 focus:outline-none"
                    rows={3}
                    placeholder="Vui lòng cho biết lý do hủy lịch (ví dụ: bận đột xuất, thay đổi lịch trình cá nhân...)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    maxLength={255}
                  />
                </div>
              </div>
            )}

            {cancelError && (
              <p role="alert" className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800">
                {cancelError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {isUnder24Hours(cancellingBooking) && cancellingBooking.status !== 'pending_payment' ? 'Đã hiểu' : 'Bỏ qua'}
              </button>
              {(!isUnder24Hours(cancellingBooking) || cancellingBooking.status === 'pending_payment') && (
                <button
                  type="button"
                  disabled={cancelLoading || (cancellingBooking.status !== 'pending_payment' && !cancelReason.trim())}
                  onClick={handleConfirmCancel}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {cancelLoading ? 'Đang xử lý…' : cancellingBooking.status === 'pending_payment' ? 'Xác nhận hủy giữ chỗ' : 'Xác nhận hủy lịch'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
