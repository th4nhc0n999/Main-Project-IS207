import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import doctorBookingApi from '@/api/doctorBookingApi'
import DoctorModal from './DoctorModal'
import { apiErrorMessage, formatMoney, statusLabel } from './bookingPresentation'

export default function DoctorBookingDetail({ id, onClose }) {
  const [revision, refresh] = useState(0)
  const [result, setResult] = useState(null)
  const current = result?.revision === revision ? result : null
  useEffect(() => {
    let active = true
    doctorBookingApi.detail(id).then(response => {
      if (response.success !== true || !response.data?.id) throw new Error('Chưa nhận được chi tiết lịch hợp lệ.')
      if (active) setResult({ revision, booking: response.data })
    }).catch(error => { if (active) setResult({ revision, error: apiErrorMessage(error) }) })
    return () => { active = false }
  }, [id, revision])
  const booking = current?.booking
  return <DoctorModal title="Chi tiết lịch khám" onClose={onClose}>
    {!current ? <p role="status">Đang tải chi tiết…</p> : current.error ? <div><p role="alert" className="rounded-lg bg-[#FFF2EE] p-4 text-[#842E25]">{current.error}</p><Button className="mt-4 min-h-11" onClick={() => refresh(value => value + 1)}>Thử lại</Button></div> :
      <dl className="grid gap-4 sm:grid-cols-2">{[
        ['Mã lịch', booking.code], ['Người khám', booking.patient?.full_name], ['Trạng thái', statusLabel(booking.status)],
        ['Ngày khám', booking.slot?.work_date], ['Ca khám', booking.slot ? `${booking.slot.start_time?.slice(0, 5)} – ${booking.slot.end_time?.slice(0, 5)}` : null],
        ['Phí khám', formatMoney(booking.payment?.exam_fee)], ['Phí tiện ích', formatMoney(booking.payment?.service_fee)],
        ['Tổng tiền', formatMoney(booking.payment?.total_amount)],
      ].map(([label, value]) => <div key={label} className="border-b border-[var(--med-line)] pb-3"><dt className="text-sm text-[var(--med-muted)]">{label}</dt><dd className="mt-1 font-semibold">{value || 'Chưa có dữ liệu'}</dd></div>)}</dl>}
  </DoctorModal>
}
