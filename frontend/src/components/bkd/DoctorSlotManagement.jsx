import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import doctorBookingApi from '@/api/doctorBookingApi'
import DoctorSlotForm from './DoctorSlotForm'
import { apiErrorCode, apiErrorMessage } from './bookingPresentation'

const slotLabels = { available: 'Đang mở', full: 'Đã đầy', blocked: 'Đã khoá' }

function initialDate() {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const value = type => parts.find(part => part.type === type).value
  return `${value('year')}-${value('month')}-${value('day')}`
}

function SlotStatus({ status }) {
  return <span className={`inline-block rounded-full px-3 py-1 text-sm ${status === 'available' ? 'bg-sage-100 text-sage-700' : status === 'blocked' ? 'bg-[#FFF2EE] text-[#842E25]' : 'bg-slate-100 text-slate-700'}`}>{slotLabels[status] || status}</span>
}

export default function DoctorSlotManagement() {
  const [date, setDate] = useState(initialDate)
  const [revision, refresh] = useState(0)
  const [result, setResult] = useState(null)
  const [form, setForm] = useState(null)
  const [notice, setNotice] = useState('')
  const [issue, setIssue] = useState('')
  const request = `${date}:${revision}`
  const current = result?.request === request ? result : null
  useEffect(() => {
    if (!date) return
    let active = true
    Promise.all([doctorBookingApi.me(), doctorBookingApi.ownSlots(date)])
      .then(([profile, slots]) => {
        if (profile.success !== true || !Number.isInteger(profile.data?.doctor_id) || profile.data.doctor_id <= 0
          || slots.success !== true || !Array.isArray(slots.data)) throw new Error('Chưa nhận được hồ sơ bác sĩ hoặc danh sách ca hợp lệ.')
        if (slots.data.some(slot => slot.doctor_id !== profile.data.doctor_id)) throw new Error('Danh sách ca không khớp hồ sơ bác sĩ đăng nhập. Vui lòng cập nhật lại.')
        if (active) setResult({ request, doctor: profile.data, slots: slots.data })
      })
      .catch(error => { if (active) setResult({ request, error: apiErrorCode(error) === 'NOT_FOUND' ? error.message || 'Tài khoản chưa có hồ sơ bác sĩ.' : apiErrorMessage(error) }) })
    return () => { active = false }
  }, [date, revision, request])
  function editButton(slot) {
    const held = slot.booked_count > 0 || slot.status === 'full'
    return <div><Button variant="outline" className="min-h-11" disabled={held} onClick={() => { setIssue(''); setNotice(''); setForm({ slot }) }}>Sửa ca</Button>
      {held && <p className="mt-2 text-xs text-[var(--med-muted)]">Đang có lịch giữ chỗ, không thể sửa.</p>}</div>
  }
  return <section>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-[22px] font-semibold">Ca khám của bạn</h2>{current?.doctor && <p className="mt-2 text-sm text-[var(--med-muted)]">{current.doctor.name} · {current.doctor.specialty?.name}</p>}</div>
      <Button className="min-h-11" disabled={!current?.doctor} onClick={() => { setIssue(''); setNotice(''); setForm({ slot: null }) }}>Tạo ca khám</Button>
    </div>
    <div className="mb-5 flex flex-wrap items-end gap-4 rounded-[14px] border border-[var(--med-line)] bg-white p-5">
      <label className="text-sm font-semibold">Ngày xem ca<input type="date" required value={date} onChange={event => { setDate(event.target.value); setIssue(''); setNotice('') }} className="mt-2 min-h-11 rounded-lg border border-[var(--med-line)] p-3"/></label>
      <Button variant="outline" className="min-h-11" disabled={!date || !current} onClick={() => refresh(value => value + 1)}>Cập nhật danh sách</Button>
    </div>
    <p className="mb-4 text-sm text-[var(--med-muted)]">Hiển thị toàn bộ ca trong ngày, gồm ca đã qua, đầy hoặc bị khoá. Ca có lịch giữ chỗ không được sửa.</p>
    {notice && <p role="status" className="mb-4 rounded-lg bg-sage-100 p-4 text-sage-700">{notice}</p>}
    {issue && <p role="alert" className="mb-4 rounded-lg bg-[#FFF2EE] p-4 text-[#842E25]">{issue}</p>}
    {!date ? <p role="status">Vui lòng chọn ngày để xem ca khám.</p> : !current ? <p role="status">Đang tải hồ sơ bác sĩ và ca khám…</p> : current.error ?
      <div role="alert" className="rounded-lg bg-[#FFF2EE] p-4 text-[#842E25]"><p>{current.error}</p><Button variant="outline" className="mt-3 min-h-11" onClick={() => refresh(value => value + 1)}>Thử lại</Button></div> :
      current.slots.length === 0 ? <p role="status" className="rounded-[14px] border border-[var(--med-line)] bg-white p-6">Chưa có ca khám trong ngày đã chọn.</p> : <>
        <div className="hidden overflow-x-auto rounded-[14px] border border-[var(--med-line)] bg-white md:block"><table className="w-full text-left text-sm">
          <caption className="sr-only">Ca khám của bác sĩ theo ngày</caption>
          <thead className="bg-sage-100 text-sage-900"><tr>{['Ca khám', 'Chỗ còn', 'Đã giữ / Sức chứa', 'Trạng thái', 'Thao tác'].map(label => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
          <tbody>{current.slots.map(slot => <tr key={slot.id} className="border-t border-[var(--med-line)]"><th scope="row" className="px-4 py-4 tabular-nums">{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</th><td className="px-4 py-4">{slot.remaining_places}</td><td className="px-4 py-4">{slot.booked_count} / {slot.capacity}</td><td className="px-4 py-4"><SlotStatus status={slot.status}/></td><td className="px-4 py-4">{editButton(slot)}</td></tr>)}</tbody>
        </table></div>
        <div className="grid gap-4 md:hidden">{current.slots.map(slot => <article key={slot.id} className="rounded-[14px] border border-[var(--med-line)] bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold tabular-nums">{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</h3><SlotStatus status={slot.status}/></div>
          <p className="mb-3 text-sm">Chỗ còn: {slot.remaining_places} · Đã giữ: {slot.booked_count} / {slot.capacity}</p>{editButton(slot)}
        </article>)}</div>
      </>}
    {form && <DoctorSlotForm slot={form.slot} initialDate={date} onClose={() => setForm(null)}
      onSaved={(workDate, message) => { setForm(null); setDate(workDate); refresh(value => value + 1); setIssue(''); setNotice(message) }}
      onConflict={message => { setForm(null); setIssue(message); refresh(value => value + 1) }}/>}
  </section>
}
