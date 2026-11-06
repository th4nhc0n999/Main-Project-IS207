import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { hospitalBookingApi as api } from '@/api/hospitalBookingApi'
import { useAuth } from '@/context/AuthContext'

const control = 'mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 disabled:bg-slate-100'
const money = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

export default function HospitalBookingPage() {
  const { hospitalId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [hospitals, setHospitals] = useState([])
  const [hospital, setHospital] = useState(hospitalId || '')
  const [options, setOptions] = useState(null)
  const [slots, setSlots] = useState([])
  const [form, setForm] = useState({ specialty_id: '', exam_type_id: '', slot_id: '', patient_profile_id: '', symptoms: '' })
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [booking, setBooking] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const requestKey = useRef(null)

  useEffect(() => {
    let active = true
    api.hospitals().then((res) => { if (active) setHospitals(res.data) })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!hospital || !user) return
    let active = true
    api.options(hospital).then((res) => { if (active) setOptions(res.data) })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [hospital, user])

  useEffect(() => {
    if (!hospital || !form.specialty_id) return
    let active = true
    api.slots(hospital, { specialty_id: form.specialty_id }).then((res) => { if (active) setSlots(res.data) })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [hospital, form.specialty_id])

  useEffect(() => {
    if (!booking) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [booking])

  function change(name, value) {
    requestKey.current = null
    setError('')
    setForm((previous) => ({ ...previous, [name]: value,
      ...(name === 'specialty_id' ? { exam_type_id: '', slot_id: '' } : {}) }))
    if (name === 'specialty_id') setSlots([])
  }

  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError('')
    requestKey.current ||= crypto.randomUUID()
    try {
      const res = await api.create({ ...form, hospital_id: Number(hospital),
        specialty_id: Number(form.specialty_id), exam_type_id: Number(form.exam_type_id),
        slot_id: Number(form.slot_id), patient_profile_id: Number(form.patient_profile_id), request_key: requestKey.current })
      setBooking(res.data)
    } catch (err) {
      setError(err.code === 'SE001' ? 'Ca khám vừa hết chỗ. Vui lòng chọn ca khác.' : err.message)
    } finally { setPending(false) }
  }

  if (authLoading) return <p className="p-8">Đang kiểm tra đăng nhập…</p>
  if (!user) return <p className="p-8">Vui lòng <Link className="text-sky-700 underline" to="/login">đăng nhập</Link> để đặt khám.</p>
  if (user.role !== 'patient') return <p className="p-8">Đặt khám dành cho tài khoản bệnh nhân.</p>

  if (booking) {
    const seconds = Math.max(0, Math.ceil((new Date(booking.hold_expires_at).getTime() - now) / 1000))
    return <main className="mx-auto max-w-2xl space-y-5 p-6">
      <h1 className="text-2xl font-bold">Đã giữ chỗ khám</h1>
      <p>Mã đặt khám: <strong>{booking.code}</strong></p>
      <p>{booking.hospital_name} · {booking.specialty_name} · {booking.work_date}, {booking.start_time}–{booking.end_time}</p>
      <p>Phí khám {money(booking.payment.exam_fee)} + phí tiện ích {money(booking.payment.service_fee)}.</p>
      <p className="font-semibold">Tổng thanh toán: {money(booking.payment.total_amount)}</p>
      <p role="status">{seconds > 0 ? `Thời gian giữ chỗ còn ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'Đã hết thời gian giữ chỗ. Vui lòng kiểm tra trạng thái lịch trước khi thanh toán.'}</p>
      {seconds > 0 && <Link className="inline-block rounded-lg bg-sky-700 px-5 py-3 text-white" to={`/payment?booking_id=${booking.id}`}>Tiếp tục thanh toán</Link>}
      <p>Phiếu khám và mã QR được cấp sau khi thanh toán được xác nhận.</p>
      <Link className="text-sky-700 underline" to="/my-bookings">Xem lịch đã đặt</Link>
    </main>
  }

  const exams = options?.exam_types.filter((exam) => exam.specialty_id === null || String(exam.specialty_id) === form.specialty_id) || []
  const exam = exams.find((item) => String(item.id) === form.exam_type_id)
  return <main className="mx-auto max-w-2xl space-y-6 p-6">
    <div><h1 className="text-2xl font-bold">Đặt khám tại bệnh viện</h1><p className="mt-2 text-slate-600">Chọn chuyên khoa và ca khám. Bệnh viện phân công bác sĩ khi tiếp nhận.</p></div>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-4 text-rose-800">{error}</p>}
    <form onSubmit={submit} className="space-y-5">
      <label className="block">Bệnh viện<select required disabled={pending} className={control} value={hospital} onChange={(event) => {
        setHospital(event.target.value); setOptions(null); setSlots([]); setError(''); requestKey.current = null
        setForm({ specialty_id: '', exam_type_id: '', slot_id: '', patient_profile_id: '', symptoms: '' })
      }}><option value="">Chọn bệnh viện</option>{hospitals.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.city}</option>)}</select></label>
      <label className="block">Chuyên khoa<select required disabled={!options || pending} className={control} value={form.specialty_id} onChange={(e) => change('specialty_id', e.target.value)}><option value="">Chọn chuyên khoa</option>{options?.specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="block">Loại khám<select required disabled={!form.specialty_id || pending} className={control} value={form.exam_type_id} onChange={(e) => change('exam_type_id', e.target.value)}><option value="">Chọn loại khám</option>{exams.map((item) => <option key={item.id} value={item.id}>{item.name} — {money(Number(item.price))}</option>)}</select></label>
      <label className="block">Ca khám<select required disabled={!form.specialty_id || pending} className={control} value={form.slot_id} onChange={(e) => change('slot_id', e.target.value)}><option value="">Chọn ca còn chỗ</option>{slots.map((item) => <option key={item.id} value={item.id}>{item.work_date} · {item.start_time}–{item.end_time} · Còn {item.remaining_capacity} chỗ</option>)}</select></label>
      {form.specialty_id && slots.length === 0 && <p className="text-slate-600">Chưa có ca còn chỗ trong thời gian cho phép đặt.</p>}
      <label className="block">Hồ sơ bệnh nhân<select required disabled={!options || pending} className={control} value={form.patient_profile_id} onChange={(e) => change('patient_profile_id', e.target.value)}><option value="">Chọn hồ sơ đã đồng ý dữ liệu</option>{options?.profiles.map((item) => <option key={item.id} value={item.id}>{item.full_name} — {item.relationship}</option>)}</select></label>
      {options?.profiles.length === 0 && <p>Chưa có hồ sơ với đồng ý dữ liệu còn hiệu lực. Vui lòng tạo hoặc cập nhật hồ sơ trước khi đặt khám.</p>}
      <label className="block">Triệu chứng (tùy chọn)<textarea maxLength={500} disabled={pending} className={control} value={form.symptoms} onChange={(e) => change('symptoms', e.target.value)} /></label>
      {exam && <p>Phí khám {money(Number(exam.price))} + phí tiện ích {money(options.service_fee)}. Tổng: <strong>{money(Number(exam.price) + options.service_fee)}</strong></p>}
      <button disabled={pending || !options} className="rounded-lg bg-sky-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{pending ? 'Đang giữ chỗ…' : 'Giữ chỗ 15 phút'}</button>
    </form>
  </main>
}
