import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import doctorBookingApi from '@/api/doctorBookingApi'
import DoctorBookingRows from './DoctorBookingRows'
import DoctorBookingDetail from './DoctorBookingDetail'
import { apiErrorMessage, bookingStatuses } from './bookingPresentation'

export default function DoctorBookingList({ revision: externalRevision }) {
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [revision, refresh] = useState(0)
  const [result, setResult] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const request = `${date}:${status}:${page}:${revision}:${externalRevision}`
  const current = result?.request === request ? result : null
  useEffect(() => {
    let active = true
    doctorBookingApi.doctorBookings({ page, per_page: 20, ...(date ? { date } : {}), ...(status ? { status } : {}) })
      .then(response => {
        if (response.success !== true || !Array.isArray(response.data?.items) || !response.data.pagination) throw new Error('Chưa nhận được danh sách hợp lệ.')
        if (!active) return
        setResult({ request, data: response.data })
        if (page > response.data.pagination.last_page) setPage(Math.max(1, response.data.pagination.last_page))
      })
      .catch(error => { if (active) setResult({ request, error: apiErrorMessage(error) }) })
    return () => { active = false }
  }, [date, status, page, revision, externalRevision, request])
  const data = current?.data
  return <section>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-[22px] font-semibold">Lịch khám{data && ` (${data.pagination.total})`}</h2><Button variant="outline" className="min-h-11" disabled={!current} onClick={() => refresh(value => value + 1)}>Cập nhật danh sách</Button></div>
    <div className="mb-5 grid gap-4 rounded-[14px] border border-[var(--med-line)] bg-white p-5 sm:grid-cols-2">
      <label className="text-sm font-semibold">Ngày khám<input type="date" value={date} onChange={event => { setDate(event.target.value); setPage(1) }} className="mt-2 min-h-11 w-full rounded-lg border border-[var(--med-line)] p-2"/></label>
      <label className="text-sm font-semibold">Trạng thái<select value={status} onChange={event => { setStatus(event.target.value); setPage(1) }} className="mt-2 min-h-11 w-full rounded-lg border border-[var(--med-line)] p-2"><option value="">Tất cả trạng thái</option>{Object.entries(bookingStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    {!current ? <p role="status">Đang tải lịch khám…</p> : current.error ? <p role="alert" className="rounded-lg bg-[#FFF2EE] p-4 text-[#842E25]">{current.error}</p> : data.items.length === 0 ? <p role="status" className="rounded-[14px] border border-[var(--med-line)] bg-white p-6">Chưa có lịch khám phù hợp với bộ lọc.</p> :
      <DoctorBookingRows bookings={data.items} renderActions={booking => <Button variant="outline" className="min-h-11" onClick={() => setDetailId(booking.id)}>Chi tiết</Button>}/>}
    {data && data.pagination.last_page > 1 && <nav aria-label="Phân trang lịch khám" className="mt-5 flex flex-wrap items-center justify-end gap-3">
      <Button variant="outline" className="min-h-11" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Trang trước</Button>
      <span>Trang {data.pagination.current_page}/{data.pagination.last_page}</span>
      <Button variant="outline" className="min-h-11" disabled={page >= data.pagination.last_page} onClick={() => setPage(value => value + 1)}>Trang sau</Button>
    </nav>}
    {detailId !== null && <DoctorBookingDetail key={detailId} id={detailId} onClose={() => setDetailId(null)}/>}
  </section>
}
