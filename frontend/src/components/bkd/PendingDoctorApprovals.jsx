import { useEffect, useRef, useState } from 'react'
import { Check, Clock3, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import doctorBookingApi from '@/api/doctorBookingApi'
import DoctorRejectionDialog from './DoctorRejectionDialog'

const errorMessages = {
  UNAUTHENTICATED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Bạn không có quyền duyệt lịch này. Chỉ bác sĩ sở hữu lịch được thao tác.',
  NOT_FOUND: 'Không tìm thấy lịch khám. Vui lòng cập nhật danh sách.',
  HTTP_ERROR: 'Yêu cầu không thực hiện được. Vui lòng cập nhật danh sách và thử lại.',
  SE001: 'Ca khám đã hết chỗ hoặc có lịch xung đột. Vui lòng cập nhật danh sách.',
  IDEMPOTENCY_CONFLICT: 'Yêu cầu đã được sử dụng với thông tin khác. Vui lòng cập nhật danh sách.',
  STALE_VERSION: 'Lịch đã thay đổi',
  BKD_CONFLICT: 'Lịch không còn chờ duyệt hoặc đã hết thời gian duyệt. Vui lòng cập nhật danh sách.',
  VALIDATION_ERROR: 'Thông tin chưa hợp lệ. Kiểm tra lý do từ chối (tối đa 255 ký tự) và thử lại.',
  INVALID_BOOKING_TRANSITION: 'Trạng thái hoặc điều kiện của lịch không cho phép thao tác này. Vui lòng cập nhật danh sách.',
  BKD_INTEGRATION_UNAVAILABLE: 'Dịch vụ phiếu khám hoặc hoàn tiền chưa sẵn sàng. Vui lòng thử lại sau.',
  BKD_UNAVAILABLE: 'Dịch vụ đặt lịch tạm thời gặp lỗi. Vui lòng thử lại sau.',
  DATABASE_UNAVAILABLE: 'Chưa kết nối được dữ liệu. Vui lòng thử lại sau.',
}

function problemCode(error) {
  return error.raw?.response?.data?.code || error.code
}

function problemMessage(error) {
  const code = problemCode(error)
  if (!error.status && error.raw) return 'Không kết nối được dịch vụ. Vui lòng kiểm tra mạng và cập nhật danh sách trước khi thử lại.'
  return errorMessages[code] || (error.status === 401 ? errorMessages.UNAUTHENTICATED
    : error.status === 403 ? errorMessages.FORBIDDEN : error.message)
    || 'Chưa nhận được kết quả. Vui lòng cập nhật danh sách trước khi thử lại.'
}

function serverNow(snapshot, monotonicTime) {
  return snapshot.serverTime + Math.max(0, monotonicTime - snapshot.receivedAt)
}

function secondsLeft(booking, time) {
  const deadline = Date.parse(booking.approval_expires_at)
  return Number.isFinite(deadline) && Number.isFinite(time) ? Math.max(0, Math.ceil((deadline - time) / 1000)) : null
}

function countdown(seconds) {
  if (seconds === null) return 'Chưa xác định hạn duyệt'
  if (seconds === 0) return 'Hết thời gian duyệt'
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export default function PendingDoctorApprovals({ onDecision }) {
  const [page, setPage] = useState(1)
  const [revision, refresh] = useState(0)
  const [result, setResult] = useState(null)
  const [tick, setTick] = useState(0)
  const [pending, setPending] = useState(null)
  const [rejectionId, setRejectionId] = useState(null)
  const [issue, setIssue] = useState('')
  const [notice, setNotice] = useState('')
  const inFlight = useRef(false)
  const expiryReloaded = useRef(new Set())
  const request = `${page}:${revision}`
  const current = result?.request === request ? result : null
  const snapshot = current?.snapshot
  const loading = !current
  const busy = pending !== null

  useEffect(() => {
    let active = true
    doctorBookingApi.doctorBookings({ status: 'pending_approval', page, per_page: 20 })
      .then(response => {
        if (!active) return
        const data = response.data
        const time = Date.parse(data?.server_time)
        if (response.success !== true || !Array.isArray(data?.items) || !Number.isFinite(time)) {
          throw new Error('Chưa nhận được danh sách và thời gian server hợp lệ. Vui lòng cập nhật lại.')
        }
        const receivedAt = performance.now()
        setTick(receivedAt)
        setResult({ request: `${page}:${revision}`, snapshot: { ...data, serverTime: time, receivedAt } })
        if (page > data.pagination.last_page) setPage(Math.max(1, data.pagination.last_page))
      })
      .catch(error => { if (active) setResult({ request: `${page}:${revision}`, error: problemMessage(error) }) })
    return () => { active = false }
  }, [page, revision])

  useEffect(() => {
    if (!snapshot) return
    const timer = setInterval(() => {
      const monotonicTime = performance.now()
      setTick(monotonicTime)
      if (inFlight.current) return
      const time = serverNow(snapshot, monotonicTime)
      const newlyExpired = snapshot.items.filter(booking => {
        const key = `${booking.id}:${booking.approval_expires_at}`
        return secondsLeft(booking, time) === 0 && !expiryReloaded.current.has(key)
      })
      if (newlyExpired.length > 0) {
        newlyExpired.forEach(booking => expiryReloaded.current.add(`${booking.id}:${booking.approval_expires_at}`))
        setRejectionId(null)
        setNotice('Có lịch đã hết thời gian duyệt. Đã yêu cầu cập nhật trạng thái từ server.')
        refresh(value => value + 1)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [snapshot])

  function reload() {
    if (inFlight.current) return
    setRejectionId(null)
    refresh(value => value + 1)
  }

  function canDecide(booking, monotonicTime) {
    return !loading && booking.status === 'pending_approval'
      && secondsLeft(booking, serverNow(snapshot, monotonicTime)) > 0
  }

  async function decide(booking, action, reason, monotonicTime) {
    if (inFlight.current) return
    if (!canDecide(booking, monotonicTime)) {
      setIssue('Lịch đã hết thời gian duyệt. Vui lòng kiểm tra trạng thái mới nhất.')
      reload()
      return
    }
    if (action === 'reject' && (!reason?.trim() || reason.trim().length > 255)) return
    inFlight.current = true
    setPending({ id: booking.id, action })
    setIssue(''); setNotice('')
    try {
      const response = action === 'approve' ? await doctorBookingApi.approve(booking.id, booking.version)
        : await doctorBookingApi.reject(booking.id, booking.version, reason.trim())
      if (response.success !== true) throw new Error('Chưa xác nhận được kết quả. Vui lòng cập nhật danh sách.')
      setRejectionId(null)
      setNotice(action === 'approve' ? 'Đã chấp nhận lịch khám.' : 'Đã từ chối lịch và tạo yêu cầu hoàn tiền.')
      refresh(value => value + 1)
      onDecision()
    } catch (error) {
      setIssue(problemMessage(error))
      if (['STALE_VERSION', 'BKD_CONFLICT', 'INVALID_BOOKING_TRANSITION', 'NOT_FOUND'].includes(problemCode(error))) {
        setRejectionId(null)
        refresh(value => value + 1)
      }
    } finally {
      inFlight.current = false
      setPending(null)
    }
  }

  const time = snapshot ? serverNow(snapshot, tick) : null
  const rejection = snapshot?.items.find(booking => booking.id === rejectionId)
  return <section>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-[22px] font-semibold">Yêu cầu chờ duyệt{snapshot && ` (${snapshot.pagination.total})`}</h2>
      <Button variant="outline" className="min-h-11 bg-sage-100 text-sage-600" disabled={loading || busy} onClick={reload}><RefreshCw size={16}/>Cập nhật danh sách</Button>
    </div>
    <p className="mb-4 text-sm text-[var(--med-muted)]">Thời gian còn lại được tính từ server. Chỉ duyệt lịch đã thanh toán và còn hạn.</p>
    {issue && <p role="alert" className="mb-4 rounded-lg bg-[#FFF2EE] p-4 text-[#842E25]">{issue}</p>}
    {notice && <p role="status" className="mb-4 rounded-lg bg-sage-100 p-4 text-sage-700">{notice}</p>}
    {loading ? <p role="status" className="rounded-[14px] border border-[var(--med-line)] bg-white p-6">Đang tải lịch chờ duyệt…</p>
      : current.error ? <div role="alert" className="rounded-lg bg-[#FFF2EE] p-4 text-[#842E25]"><p>{current.error}</p><Button variant="outline" className="mt-3 min-h-11" onClick={reload}>Thử lại</Button></div>
        : snapshot.items.length === 0 ? <p role="status" className="rounded-[14px] border border-[var(--med-line)] bg-white p-6 text-[var(--med-muted)]">Chưa có yêu cầu chờ duyệt.</p>
          : <div className="grid gap-4">{snapshot.items.map(booking => {
            const remaining = secondsLeft(booking, time)
            const disabled = busy || booking.status !== 'pending_approval' || remaining === null || remaining <= 0
            return <article key={booking.id} className="grid gap-4 rounded-[14px] border border-[var(--med-line)] bg-white p-5 md:grid-cols-[1fr_auto]">
              <div><div className="mb-3 flex flex-wrap items-center gap-3"><h3 className="font-semibold">{booking.code}</h3><span className="rounded-full bg-sage-100 px-3 py-1 text-sm text-sage-700">Chờ duyệt</span></div>
                <p className="font-semibold">{booking.patient?.full_name || 'Chưa có tên người khám'}</p>
                <p className="mt-2 tabular-nums text-[var(--med-muted)]">{booking.slot?.work_date} · {booking.slot?.start_time?.slice(0, 5)} – {booking.slot?.end_time?.slice(0, 5)}</p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <p className={`flex items-center gap-2 text-sm tabular-nums ${remaining === 0 ? 'text-[#842E25]' : 'text-sage-700'}`}><Clock3 size={16}/>{countdown(remaining)}</p>
                <div className="flex flex-wrap gap-3">
                  <Button className="min-h-11" disabled={disabled} onClick={() => decide(booking, 'approve', undefined, performance.now())}><Check size={16}/>{pending?.id === booking.id && pending.action === 'approve' ? 'Đang gửi…' : 'Chấp nhận'}</Button>
                  <Button variant="outline" className="min-h-11 text-[#842E25]" disabled={disabled} onClick={() => { setIssue(''); if (canDecide(booking, performance.now())) setRejectionId(booking.id); else reload() }}><X size={16}/>Từ chối</Button>
                </div>
              </div>
            </article>
          })}</div>}
    {snapshot && snapshot.pagination.last_page > 1 && <nav aria-label="Phân trang lịch chờ duyệt" className="mt-5 flex flex-wrap items-center justify-end gap-3">
      <Button variant="outline" className="min-h-11" disabled={busy || page <= 1} onClick={() => { setRejectionId(null); setPage(value => value - 1) }}>Trang trước</Button>
      <span className="text-sm">Trang {snapshot.pagination.current_page}/{snapshot.pagination.last_page}</span>
      <Button variant="outline" className="min-h-11" disabled={busy || page >= snapshot.pagination.last_page} onClick={() => { setRejectionId(null); setPage(value => value + 1) }}>Trang sau</Button>
    </nav>}
    {rejection && <DoctorRejectionDialog key={rejection.id} booking={rejection} remaining={secondsLeft(rejection, time)} busy={busy} error={issue}
      onClose={() => { if (!inFlight.current) { setRejectionId(null); setIssue('') } }} onReject={reason => decide(rejection, 'reject', reason, performance.now())}/>}
  </section>
}
