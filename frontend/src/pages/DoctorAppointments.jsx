import { useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import BookingSignIn from '@/components/BookingSignIn'
import PendingDoctorApprovals from '@/components/bkd/PendingDoctorApprovals'
import DoctorBookingList from '@/components/bkd/DoctorBookingList'
import { Button } from '@/components/ui/button'
import useApi from '@/api/useApi'
import client from '@/api/axiosClient'

export default function DoctorAppointments() {
  const { user, loading } = useAuth()
  if (loading) return <p className="clinic" role="status">Đang kiểm tra tài khoản…</p>
  if (!user) return <BookingSignIn title="Lịch tiếp khám"/>
  if (user.role !== 'doctor') return <p className="clinic" role="alert">Chỉ bác sĩ được truy cập lịch tiếp khám của mình.</p>
  return <DoctorWorkspace key={user.id}/>
}

function DoctorWorkspace() {
  const [revision, refresh] = useState(0)
  const [tab, setTab] = useState('pending')
  const tabs = [['pending', 'Chờ duyệt'], ['appointments', 'Lịch khám']]
  return <section className="mx-auto max-w-[1180px] px-5 py-10 font-sans text-[var(--med-ink)]">
    <h1 className="mb-2 text-3xl font-bold">Lịch tiếp khám</h1>
    <p className="mb-6 text-[var(--med-muted)]">Xem yêu cầu đã thanh toán và quyết định trước khi hết hạn duyệt.</p>
    <div role="tablist" aria-label="Lịch bác sĩ" className="mb-6 border-b border-[var(--med-line)]">
      {tabs.map(([value, label], index) => <button key={value} id={`doctor-${value}-tab`} type="button" role="tab" aria-selected={tab === value} aria-controls={`doctor-${value}-panel`} tabIndex={tab === value ? 0 : -1}
        onClick={() => setTab(value)} onKeyDown={event => {
          const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null
          if (next !== null) { event.preventDefault(); setTab(tabs[next][0]); document.getElementById(`doctor-${tabs[next][0]}-tab`)?.focus() }
        }} className={`min-h-11 border-b-[3px] px-4 font-semibold ${tab === value ? 'border-[var(--med-coral)] text-sage-600' : 'border-transparent text-[var(--med-muted)]'}`}>{label}</button>)}
    </div>
    <div id={`doctor-${tab}-panel`} role="tabpanel" aria-labelledby={`doctor-${tab}-tab`}>
      {tab === 'pending' ? <PendingDoctorApprovals onDecision={() => refresh(value => value + 1)}/> : <DoctorBookingList revision={revision}/>}
    </div>
    <ExistingAppointments revision={revision}/>
  </section>
}

// Preserve the existing check-in/completion flow while the BKD tabs are added in stages.
function ExistingAppointments({ revision }) {
  const [refreshCount, refresh] = useState(0)
  const [issue, setIssue] = useState('')
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const { data, error } = useApi('/doctor/appointments', `${revision}:${refreshCount}`)
  const appointments = (data?.data || []).filter(booking => ['confirmed', 'checked_in'].includes(booking.status))
  async function complete(id) {
    if (submitting.current) return
    submitting.current = true
    setIssue(''); setBusy(true)
    try {
      await client.post('/doctor/appointments/' + id + '/complete')
      refresh(value => value + 1)
    } catch (problem) { setIssue(problem.message) }
    finally { submitting.current = false; setBusy(false) }
  }
  return <section className="mt-10 border-t border-[var(--med-line)] pt-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">Lịch tiếp khám hiện có</h2>
      <Button variant="outline" className="min-h-11" disabled={busy} onClick={() => refresh(value => value + 1)}>Cập nhật lịch</Button>
    </div>
    {(error || issue) && <p role="alert" className="mb-4 rounded-lg bg-[#FFF2EE] p-4 text-[#842E25]">{error || issue}</p>}
    {!data && !error && <p role="status">Đang tải…</p>}
    {data && appointments.length === 0 && <p className="text-[var(--med-muted)]">Chưa có lịch chờ tiếp khám.</p>}
    <div className="grid gap-4 md:grid-cols-2">{appointments.map(booking => <article key={booking.id} className="rounded-[14px] border border-[var(--med-line)] bg-white p-5">
      <h3 className="font-semibold">{booking.code}</h3><p className="my-2 tabular-nums">{booking.work_date} · {booking.start_time}</p>
      {booking.status === 'confirmed' ? <p>Đã duyệt · Chờ tiếp nhận</p> :
        <Button className="min-h-11" disabled={busy} onClick={() => complete(booking.id)}>Hoàn tất khám</Button>}
    </article>)}</div>
  </section>
}
