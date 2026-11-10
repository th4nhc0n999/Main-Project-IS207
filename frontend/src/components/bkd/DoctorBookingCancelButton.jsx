import { useEffect, useRef, useState } from 'react'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import doctorBookingApi from '@/api/doctorBookingApi'
import DoctorModal from './DoctorModal'
import { apiErrorMessage, needsRefresh } from './bookingPresentation'

const cancellable = ['pending_payment', 'pending_approval', 'confirmed']
const day = 24 * 60 * 60 * 1000

export default function DoctorBookingCancelButton({ booking, onResult }) {
  const { user } = useAuth()
  if (user?.role !== 'patient' || String(booking.user_id) !== String(user.id)
    || booking.booking_type !== 'doctor' || !cancellable.includes(booking.status)) return null
  return <PatientCancellation key={`${user.id}:${booking.id}:${booking.status}`} bookingId={booking.id} onResult={onResult}/>
}

function PatientCancellation({ bookingId, onResult }) {
  const [result, setResult] = useState(null)
  const [revision, refresh] = useState(0)
  const [tick, setTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [issue, setIssue] = useState('')
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const current = result?.revision === revision ? result : null
  const booking = current?.booking

  useEffect(() => {
    let active = true
    // History has no version/server_time. Keep its loader intact and use BKD's contracts.
    Promise.all([
      doctorBookingApi.detail(bookingId),
      doctorBookingApi.mine({ per_page: 1 }).then(response => ({ response, receivedAt: performance.now() })),
    ]).then(([detail, clock]) => {
      const serverTime = Date.parse(clock.response.data?.server_time)
      if (detail.success !== true || Number(detail.data?.id) !== Number(bookingId)
        || detail.data?.booking_type !== 'doctor' || !Number.isInteger(detail.data?.version)
        || clock.response.success !== true || !Number.isFinite(serverTime)) {
        throw new Error('Chưa kiểm tra được lịch và thời gian server. Vui lòng thử lại.')
      }
      if (active) {
        setTick(performance.now())
        setResult({ revision, booking: detail.data, serverTime, receivedAt: clock.receivedAt })
      }
    }).catch(error => { if (active) setResult({ revision, error: apiErrorMessage(error) }) })
    return () => { active = false }
  }, [bookingId, revision])

  useEffect(() => {
    if (!booking || booking.status === 'pending_payment') return
    const timer = setInterval(() => setTick(performance.now()), 1000)
    return () => clearInterval(timer)
  }, [booking])

  function cancellationWindow(monotonicTime) {
    if (booking?.status === 'pending_payment') return { allowed: true, tooLate: false }
    const start = Date.parse(booking?.slot?.starts_at)
    const now = current?.serverTime + Math.max(0, monotonicTime - current?.receivedAt)
    const valid = Number.isFinite(start) && Number.isFinite(now)
    return { allowed: valid && start - now >= day, tooLate: valid && start - now < day }
  }

  const window = cancellationWindow(tick)
  const active = cancellable.includes(booking?.status)
  const paid = ['pending_approval', 'confirmed'].includes(booking?.status) || booking?.payment?.status === 'paid'
  const disabled = !active || !window.allowed || busy
  const close = () => { if (!inFlight.current) { setOpen(false); setIssue(''); setReason('') } }

  async function submit(event) {
    event.preventDefault()
    if (inFlight.current || !active || !cancellationWindow(performance.now()).allowed
      || !reason.trim() || reason.trim().length > 255) return
    inFlight.current = true
    setBusy(true); setIssue('')
    try {
      const response = await doctorBookingApi.cancel(booking.id, booking.version, reason.trim())
      if (response.success !== true || response.data?.status !== 'cancelled') {
        throw new Error('Chưa xác nhận được kết quả huỷ. Vui lòng cập nhật danh sách trước khi thử lại.')
      }
      setOpen(false)
      onResult(paid ? 'Đã yêu cầu hoàn tiền' : 'Đã huỷ lịch')
    } catch (error) {
      const message = apiErrorMessage(error)
      setIssue(message)
      if (needsRefresh(error)) {
        setOpen(false)
        onResult(message)
      }
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  return <div>
    <Button type="button" variant="outline" size="sm" disabled={disabled}
      onClick={() => { setIssue(''); setOpen(true) }}
      className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
      <XCircle className="mr-1 h-3.5 w-3.5"/>Huỷ lịch
    </Button>
    {!current && <p role="status" className="mt-2 text-sm text-[var(--med-muted)]">Đang kiểm tra điều kiện huỷ…</p>}
    {current?.error && <div className="mt-2"><p role="alert">{current.error}</p><Button type="button" variant="link" onClick={() => refresh(value => value + 1)}>Thử lại</Button></div>}
    {window.tooLate && <p className="mt-2 text-sm text-[var(--med-muted)]">Còn dưới 24 giờ, vui lòng liên hệ hỗ trợ</p>}
    {booking && !active && <p role="status" className="mt-2 text-sm">Lịch đã thay đổi, không còn cho phép huỷ. Vui lòng cập nhật danh sách.</p>}
    {active && booking.status !== 'pending_payment' && !window.tooLate && !window.allowed && <p role="alert">Chưa kiểm tra được giờ ca khám. Vui lòng cập nhật danh sách.</p>}
    {open && <DoctorModal title="Xác nhận huỷ lịch hẹn" busy={busy} onClose={close}>
      <div className="mb-4 space-y-2 rounded-xl border border-[var(--med-line)] bg-sage-50 p-4">
        <p className="font-semibold">Mã lịch: {booking.code}</p>
        <p>{booking.slot?.work_date} · {booking.slot?.start_time?.slice(0, 5)}–{booking.slot?.end_time?.slice(0, 5)}</p>
        <p>Bạn có chắc chắn muốn huỷ lịch khám này? Chỗ đã giữ sẽ được giải phóng.</p>
        {paid && <p className="font-semibold">Hoàn 100% phí khám, không hoàn phí tiện ích</p>}
      </div>
      {window.tooLate && <p role="alert" className="mb-4 text-rose-700">Còn dưới 24 giờ, vui lòng liên hệ hỗ trợ</p>}
      <form onSubmit={submit}>
        <label htmlFor={`cancel-reason-${bookingId}`} className="text-sm font-semibold">Lý do huỷ lịch (bắt buộc)</label>
        <textarea id={`cancel-reason-${bookingId}`} rows={3} required maxLength={255} value={reason} disabled={disabled}
          onChange={event => setReason(event.target.value)} placeholder="Ví dụ: Có lịch bận đột xuất…"
          className="mt-2 w-full rounded-xl border border-[var(--med-line)] p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"/>
        <p className="text-right text-sm text-[var(--med-muted)]">{reason.length}/255 ký tự</p>
        {issue && <p role="alert" className="my-4 rounded-lg bg-rose-50 p-4 text-rose-800">{issue}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={close}>Không huỷ</Button>
          <Button type="submit" variant="destructive" disabled={disabled || !reason.trim()}>{busy ? 'Đang huỷ…' : 'Xác nhận huỷ lịch'}</Button>
        </div>
      </form>
    </DoctorModal>}
  </div>
}
