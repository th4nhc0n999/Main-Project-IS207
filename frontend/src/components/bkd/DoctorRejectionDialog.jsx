import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function DoctorRejectionDialog({ booking, remaining, busy, error, onClose, onReject }) {
  const dialogRef = useRef(null)
  const reasonRef = useRef(null)
  const [reason, setReason] = useState('')
  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    reasonRef.current.focus()
    return () => dialog.close()
  }, [])
  const canReject = remaining !== null && remaining > 0 && reason.trim().length > 0 && !busy
  function submit(event) {
    event.preventDefault()
    if (canReject) onReject(reason.trim())
  }
  return <dialog ref={dialogRef} aria-labelledby="reject-booking-title" aria-describedby="reject-booking-description"
    onCancel={event => { event.preventDefault(); if (!busy) onClose() }}
    className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-[14px] border border-[var(--med-line)] bg-white p-6 text-[var(--med-ink)] shadow-xl backdrop:bg-slate-900/40">
    <h2 id="reject-booking-title" className="text-[22px] font-semibold">Từ chối lịch {booking.code}</h2>
    <p id="reject-booking-description" className="my-3 text-sm text-[var(--med-muted)]">Nhập lý do để bệnh nhân biết. Hệ thống sẽ tạo yêu cầu hoàn tiền theo chính sách, chưa xác nhận đã hoàn tiền.</p>
    <form onSubmit={submit}>
      <label htmlFor="booking-rejection-reason" className="text-sm font-semibold">Lý do từ chối <span aria-hidden="true">*</span></label>
      <textarea ref={reasonRef} id="booking-rejection-reason" required maxLength={255} rows={4} value={reason}
        disabled={busy || remaining === null || remaining <= 0} onChange={event => setReason(event.target.value)}
        className="mt-2 w-full rounded-lg border border-[var(--med-line)] p-3 focus-visible:outline-sage-600 disabled:bg-sage-100"/>
      <p className="mt-1 text-right text-sm text-[var(--med-muted)]">{reason.length}/255 ký tự</p>
      {(remaining === null || remaining <= 0) && <p role="alert" className="my-3 rounded-lg bg-[#FFF2EE] p-3 text-[#842E25]">Lịch đã hết thời gian duyệt hoặc chưa xác định được hạn duyệt. Vui lòng cập nhật danh sách.</p>}
      {error && <p role="alert" className="my-3 rounded-lg bg-[#FFF2EE] p-3 text-[#842E25]">{error}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={onClose}>Quay lại</Button>
        <Button type="submit" className="min-h-11" disabled={!canReject}>{busy ? 'Đang gửi…' : 'Xác nhận từ chối'}</Button>
      </div>
    </form>
  </dialog>
}
