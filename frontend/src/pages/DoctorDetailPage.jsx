import { Link, useParams } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import useApi, { money } from '@/api/useApi'
import BookingSteps from '@/components/BookingSteps'

export default function DoctorDetailPage() {
  const { id } = useParams()
  const { data, error } = useApi('/doctors/' + id)
  if (!data) return <section className="clinic"><Link to="/doctors">← Tìm nơi khám</Link><h1>Lịch khám bác sĩ</h1><p role="status">{error || 'Đang tải bác sĩ…'}</p></section>
  const doctor = data.data
  const days = new Map()
  for (const slot of data.slots) {
    if (!days.has(slot.work_date)) days.set(slot.work_date, [])
    days.get(slot.work_date).push(slot)
  }
  return <section className="clinic">
    <Link to="/doctors">← Tìm nơi khám</Link>
    <h1>Đặt khám theo bác sĩ</h1>
    <BookingSteps current={1}/>
    <div className="booking-columns">
      <aside className="booking-summary">
        <div className="med-avatar">{doctor.name.split(' ').slice(-2).map(word=>word[0]).join('')}</div>
        <small>{doctor.specialty}</small><h2>{[doctor.title,doctor.name].filter(Boolean).join(' ')}</h2>
        <p><MapPin size={16}/> {[doctor.hospital,doctor.city].filter(Boolean).join(' · ')}</p>
        {doctor.years_experience != null && <p>{doctor.years_experience} năm kinh nghiệm</p>}
        <p>{doctor.bio}</p><hr/><p>Phí khám <strong>{money(doctor.consultation_fee)}</strong></p>
      </aside>
      <article><h2><CalendarDays size={22}/> Chọn ca khám</h2>
        {!days.size && <p>Chưa có ca khám còn chỗ.</p>}
        {Array.from(days, ([day, slots])=><section className="slot-day" key={day}>
          <h3>{new Date(day+'T12:00:00').toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</h3>
          <div>{slots.map(slot=><Link key={slot.id} to={'/booking/confirm?doctor='+id+'&slot='+slot.id}>{slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}</Link>)}</div>
        </section>)}
      </article>
    </div>
  </section>
}
