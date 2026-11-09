import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import doctorBookingApi from '@/api/doctorBookingApi'
import DoctorModal from './DoctorModal'
import { apiErrorMessage, formatMoney, needsRefresh } from './bookingPresentation'

export default function DoctorEmergencyCancellation({ id, onClose, onSuccess, onConflict }) {
  const [revision, refresh] = useState(0)
  const [result, setResult] = useState(null)
  const [reason, setReason] = useState('')
  const [issue, setIssue] = useState('')
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const current = result?.revision === revision ? result : null
  useEffect(() => {
    let active = true
    // The detail endpoint authorizes the logged-in doctor; never infer ownership from user.id.
    doctorBookingApi.detail(id).then(response => {
      if (response.success !== true || !response.data?.id) throw new Error('Chưa nhận được chi tiết lịch hợp lệ.')
      if (active) setResult({ revision, booking: response.data })
    }).catch(error => { if (active) setResult({ revision, error: apiErrorMessage(error) }) })
    return () => { active = false }
  }, [id, revision])
  const booking = current?.booking
  const confirmed = booking?.status === 'confirmed'
  async function submit(event) {
    event.preventDefault()
    if (submitting.current || !confirmed || !reason.trim() || reason.trim().length > 255) return
    submitting.current = true
    setBusy(true); setIssue('')
    try {
      const response = await doctorBookingApi.cancel(booking.id, booking.version, reason.trim())
      if (response.success !== true) throw new Error('Chưa xác nhận được kết quả huỷ. Vui lòng cập nhật danh sách trước khi thử lại.')
      onSuccess()
    } catch (error) {
      const message = apiErrorMessage(error)
      setIssue(message)
      if (needsRefresh(error)) onConflict(message)
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }
  return <DoctorModal title="Nghỉ đột xuất — huỷ lịch khám" busy={busy} onClose={() => { if (!submitting.current) onClose() }}>
    {!current ? <p role="status">Đang kiểm tra lịch bị ảnh hưởng…</p> : current.error ? <div><p role="alert" className="rounded-lg bg-[#FFF2EE] p-4 text-[#842E25]">{current.error}</p><Button className="mt-4 min-h-11" onClick={() => refresh(value => value + 1)}>Thử lại</Button></div> : <>
      <div className="mb-5 rounded-lg border border-[var(--med-line)] bg-sage-50 p-4">
        <h3 className="mb-2 font-semibold">Lịch bị ảnh hưởng: {booking.code}</h3>
        <p>{booking.patient?.full_name || 'Chưa có tên người khám'}</p>
        <p className="my-2 tabular-nums">{booking.slot?.work_date} · {booking.slot?.start_time?.slice(0, 5)} – {booking.slot?.end_time?.slice(0, 5)}</p>
        <p className="text-sm text-[var(--med-muted)]">Khi huỷ, ca khám liên quan sẽ bị khoá nhận lịch mới. Hệ thống tạo yêu cầu hoàn phí khám và phí tiện ích theo chính sách.</p>
        <p className="mt-2 text-sm">Phí khám: {formatMoney(booking.payment?.exam_fee)} · Phí tiện ích: {formatMoney(booking.payment?.service_fee)}</p>
      </div>
      {!confirmed && <p role="alert" className="mb-4 rounded-lg bg-[#FFF2EE] p-4 text-[#842E25]">Lịch đã thay đổi, không còn ở trạng thái đã xác nhận. Không thể huỷ do nghỉ đột xuất.</p>}
      <form onSubmit={submit}>
        <label htmlFor="doctor-emergency-reason" className="text-sm font-semibold">Lý do nghỉ đột xuất (bắt buộc)</label>
        <textarea id="doctor-emergency-reason" required maxLength={255} rows={4} value={reason} disabled={busy || !confirmed}
          onChange={event => setReason(event.target.value)} className="mt-2 w-full rounded-lg border border-[var(--med-line)] p-3 disabled:bg-sage-100"/>
        <p className="text-right text-sm text-[var(--med-muted)]">{reason.length}/255 ký tự</p>
        {issue && <p role="alert" className="my-4 rounded-lg bg-[#FFF2EE] p-4 text-[#842E25]">{issue}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-3"><Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={onClose}>Quay lại</Button><Button type="submit" className="min-h-11" disabled={busy || !confirmed || !reason.trim()}>{busy ? 'Đang gửi…' : 'Xác nhận huỷ lịch'}</Button></div>
      </form>
    </>}
  </DoctorModal>
}
