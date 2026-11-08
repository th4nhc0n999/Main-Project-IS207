import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import doctorBookingApi from '@/api/doctorBookingApi'
import DoctorModal from './DoctorModal'
import { apiErrorCode, apiErrorMessage, needsRefresh } from './bookingPresentation'

export default function DoctorSlotForm({ slot, initialDate, onClose, onSaved, onConflict }) {
  const [date, setDate] = useState(slot?.work_date || initialDate)
  const [time, setTime] = useState(slot?.start_time?.slice(0, 5) || '')
  const [busy, setBusy] = useState(false)
  const [issue, setIssue] = useState('')
  const submitting = useRef(false)
  const held = slot && (slot.booked_count > 0 || slot.status === 'full')
  async function submit(event) {
    event.preventDefault()
    if (submitting.current || held || !date || !time) return
    submitting.current = true
    setBusy(true); setIssue('')
    try {
      // Owner, specialty, capacity and the 30-minute end time are controlled by the API.
      const fields = { work_date: date, start_time: time }
      const response = slot ? await doctorBookingApi.updateSlot(slot.id, fields) : await doctorBookingApi.createSlot(fields)
      if (response.success !== true || !response.data?.id) throw new Error('Chưa xác nhận được kết quả lưu ca. Vui lòng cập nhật danh sách trước khi thử lại.')
      onSaved(response.data.work_date, slot ? 'Đã cập nhật ca khám.' : 'Đã tạo ca khám 30 phút.')
    } catch (error) {
      const code = apiErrorCode(error)
      const message = code === 'SE001' ? 'Ca khám giao giờ với một ca đã công bố. Vui lòng chọn giờ khác.'
        : code === 'VALIDATION_ERROR' ? Object.values(error.errors || {}).flat().join(' ') || apiErrorMessage(error) : apiErrorMessage(error)
      setIssue(message)
      if (needsRefresh(error)) onConflict(message)
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }
  return <DoctorModal title={slot ? 'Sửa ca khám' : 'Tạo ca khám'} busy={busy} onClose={() => { if (!submitting.current) onClose() }}>
    <p className="mb-5 text-sm text-[var(--med-muted)]">Ca kéo dài 30 phút, sức chứa 1 người; chuyên khoa theo hồ sơ bác sĩ. Chỉ ca chưa bắt đầu và không có lịch giữ mới được sửa. Sửa thời gian không mở khoá ca.</p>
    <form onSubmit={submit}>
      <fieldset disabled={busy || held} className="space-y-4">
        <label className="block text-sm font-semibold">Ngày khám<input required type="date" value={date} onChange={event => setDate(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[var(--med-line)] p-3"/></label>
        <label className="block text-sm font-semibold">Giờ bắt đầu<input required type="time" step="60" value={time} onChange={event => setTime(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[var(--med-line)] p-3"/></label>
      </fieldset>
      {held && <p role="alert" className="mt-4 rounded-lg bg-[#FFF2EE] p-4 text-[#842E25]">Ca đang có lịch giữ chỗ, không thể sửa.</p>}
      {issue && <p role="alert" className="mt-4 rounded-lg bg-[#FFF2EE] p-4 text-[#842E25]">{issue}</p>}
      <div className="mt-5 flex justify-end gap-3"><Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={onClose}>Quay lại</Button><Button type="submit" className="min-h-11" disabled={busy || held || !date || !time}>{busy ? 'Đang lưu…' : 'Lưu ca khám'}</Button></div>
    </form>
  </DoctorModal>
}
