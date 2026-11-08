import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, ClipboardList, FolderHeart, Ticket } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import useApi from '@/api/useApi'

const reminders = ['Kiểm tra ngày, giờ và địa chỉ khám', 'Chuẩn bị giấy tờ và hồ sơ liên quan', 'Lưu phiếu khám để xuất trình khi đến nơi']

function VisitPanel({ patient, loading }) {
  const { data, error } = useApi(patient ? '/me/bookings?tab=upcoming&page=1' : null)
  const booking = data?.data?.[0]
  let message = 'Đăng nhập để xem giờ hẹn và phiếu khám của bạn.'
  if (loading || (patient && !data && !error)) message = 'Đang tải lịch khám…'
  else if (error) message = 'Chưa tải được lịch. Bạn có thể kiểm tra lại trong mục Lịch khám.'
  else if (patient && !booking) message = 'Bạn chưa có lịch khám sắp tới.'
  const link = !patient ? '/login' : booking?.ticket ? '/bookings/'+booking.id+'/ticket' : '/my-bookings'
  return <article className="visit-panel">
    <CalendarDays size={26}/><h2>Lịch khám sắp tới</h2>
    {booking ? <><strong>{booking.doctor_name || booking.hospital_name}</strong><p>{booking.specialty_name} · {booking.work_date} · {booking.start_time?.slice(0,5)}</p></> : <p>{message}</p>}
    {!loading && <Link to={link} state={!patient ? {returnTo:'/my-bookings'} : undefined}>{!patient ? 'Đăng nhập' : booking?.ticket ? 'Mở phiếu khám' : 'Xem lịch khám'} <ArrowRight size={16}/></Link>}
  </article>
}

export default function PatientOverview() {
  const { user, loading } = useAuth()
  const [checked, setChecked] = useState([])
  const patient = user?.role === 'patient'
  return <section aria-label="Quản lý khám bệnh" className="overview-grid">
    {(!user || patient) && <VisitPanel key={user?.id || 'guest'} patient={patient} loading={loading}/>}
    <article className="overview-card"><FolderHeart size={26}/><h2>Hồ sơ &amp; phiếu khám</h2>
      <Link to="/my-bookings?tab=profiles"><FolderHeart size={17}/>Hồ sơ người khám <ArrowRight size={15}/></Link>
      <Link to="/my-bookings"><Ticket size={17}/>Tra cứu lịch và phiếu khám <ArrowRight size={15}/></Link>
    </article>
    <article className="overview-card prep-card"><ClipboardList size={26}/><h2>Trước buổi khám <small>{checked.length}/{reminders.length}</small></h2>
      {reminders.map(item=><label key={item}><input type="checkbox" checked={checked.includes(item)} onChange={e=>setChecked(e.target.checked ? [...checked,item] : checked.filter(x=>x!==item))}/><span>{item}</span></label>)}
    </article>
  </section>
}
