import BookingSignIn from '@/components/BookingSignIn'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { hospitalBookingApi as api } from '@/api/hospitalBookingApi'
import { useAuth } from '@/context/AuthContext'
import DoctorBookingCancelButton from '@/components/bkd/DoctorBookingCancelButton'

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
  const [cancelNotice, setCancelNotice] = useState('')
  const [state, setState] = useState({ loading: true, data: [], pagination: null, error: '' })

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

  if (authLoading) return <p className="p-8">Đang kiểm tra đăng nhập…</p>
  if (!user) return <BookingSignIn title="Lịch khám của tôi"/>
  return <main className="mx-auto max-w-4xl space-y-6 p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="MedSi" className="h-8 w-auto object-contain" />
        <h1 className="text-2xl font-bold">Lịch khám của tôi</h1>
      </div>
      <Link className="text-sage-700 underline" to="/hospital-booking">Đặt khám bệnh viện</Link>
    </div>
    <div role="tablist" aria-label="Trạng thái lịch khám" className="flex flex-wrap gap-2">{[['upcoming', 'Sắp khám'], ['completed', 'Đã khám'], ['closed', 'Đã hủy hoặc vắng']].map(([value, label]) =>
      <button key={value} role="tab" aria-selected={tab === value} onClick={() => { setTab(value); setPage(1) }} className={`rounded-lg px-4 py-2 ${tab === value ? 'bg-sage-700 text-white' : 'bg-slate-100'}`}>{label}</button>)}</div>
    <label className="block">Tìm mã phiếu, mã lịch hoặc cơ sở khám<input className="mt-2 w-full rounded-lg border p-3" value={search} maxLength={100} onChange={(e) => { setSearch(e.target.value); setPage(1) }} /></label>
    <button className="text-sage-700 underline" onClick={() => setRevision((value) => value + 1)}>Cập nhật trạng thái</button>
    {cancelNotice && <p role="status" className="rounded-lg bg-sage-50 p-4 text-sage-800">{cancelNotice}</p>}
    {state.error && <p role="alert" className="rounded-lg bg-rose-50 p-4 text-rose-800">{state.error}</p>}
    {state.loading ? <p role="status">Đang tải lịch khám…</p> : state.data.length === 0 && !state.error ? <p>Chưa có lịch khám trong mục này.</p> :
      state.data.map((booking) => <article key={booking.id} className="space-y-3 rounded-xl border bg-white p-5">
        <div className="flex flex-wrap justify-between gap-2"><strong>{booking.code}</strong><span>{statuses[booking.status] || booking.status}</span></div>
        <p>{booking.hospital_name || booking.doctor_name} · {booking.specialty_name}</p>
        <p>{booking.work_date} · {booking.start_time}–{booking.end_time}</p>
        <p>Người khám: {booking.patient_snapshot.full_name}</p>
        {booking.payment && <p>Tổng: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.payment.total_amount)} · {booking.payment.status === 'paid' ? 'Đã thanh toán' : booking.payment.status === 'refunded' ? 'Đã hoàn tiền' : 'Chưa xác nhận thanh toán'}</p>}
        <Link className="text-sage-800 underline" to={`/bookings/${booking.id}/refunds`}>Theo dõi hoàn tiền</Link>
        {booking.ticket ? <><p>Mã phiếu: {booking.ticket.ticket_code} · Số thứ tự: <strong>{booking.ticket.queue_number}</strong></p><Link className="inline-block text-sage-700 underline" to={`/bookings/${booking.id}/ticket`}>Xem phiếu, QR và tải PNG</Link></> : <p className="text-slate-500">Phiếu được cấp khi lịch được xác nhận.</p>}
        {booking.status === 'pending_payment' && <p><Link className="text-sage-700 underline" to={`/payment?booking_id=${booking.id}`}>Tiếp tục thanh toán</Link></p>}
        <DoctorBookingCancelButton booking={booking} onResult={message => { setCancelNotice(message); setRevision(value => value + 1) }}/>
      </article>)}
    {state.pagination && <div className="flex items-center gap-4"><button disabled={page <= 1 || state.loading} className="disabled:opacity-40" onClick={() => setPage(page - 1)}>Trang trước</button><span>Trang {page}/{state.pagination.last_page}</span><button disabled={page >= state.pagination.last_page || state.loading} className="disabled:opacity-40" onClick={() => setPage(page + 1)}>Trang sau</button></div>}
  </main>
}
