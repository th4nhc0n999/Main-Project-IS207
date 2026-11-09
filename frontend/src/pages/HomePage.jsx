import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Hospital, Search, Star, Stethoscope } from 'lucide-react'
import SpecialtyImage from '@/components/SpecialtyImage'
import PatientOverview from '@/components/PatientOverview'
import { useAuth } from '@/context/AuthContext'
import useApi from '@/api/useApi'
import { initialHospitals, initialSpecialties } from '@/lib/mockData'
import photo from '@/assets/consultation.jpg'
import './home.css'

const tabs = [['doctor', 'Bác sĩ', Stethoscope], ['hospital', 'Bệnh viện', Hospital]]
export default function HomePage() {
  const {user} = useAuth()
  const [type,setType] = useState('doctor')
  const [expanded, setExpanded] = useState(false)
  const {data,error} = useApi('/directory')
  const hasSpecialties = Boolean(data?.specialties?.length)
  const specialties = hasSpecialties ? data.specialties : initialSpecialties
  const doctors = data?.data?.filter(item=>item.kind==='doctor') || []
  const label = tabs.find(([key])=>key===type)[1].toLowerCase()
  return <div className="med-home"><div className="med-wrap">
    <section className="med-hero"><div className="med-copy"><h1>{user?.role === 'patient' ? <>Xin chào,<br/><em>{user.name || 'bạn'}.</em></> : <>Đặt lịch khám<br/><em>theo nhu cầu.</em></>}</h1><p>Tìm bác sĩ và bệnh viện uy tín.<br/>Chọn thời gian khám phù hợp với bạn.</p><div className="booking-entry"><Link to="/dat-kham/bac-si"><Stethoscope size={18}/>Đặt lịch bác sĩ</Link><Link to="/dat-kham/benh-vien"><Hospital size={18}/>Đặt lịch bệnh viện</Link></div></div><img src={photo} alt="Buổi tư vấn y tế"/></section>
    <section className="med-search" aria-label="Tìm nơi khám"><div className="med-tabs">{tabs.map(([key,title,Icon])=><button key={key} aria-pressed={type===key} onClick={()=>setType(key)}><Icon size={18}/>{title}</button>)}</div>
    <form action={'/dat-kham/'+(type==='doctor'?'bac-si':'benh-vien')}><input type="hidden" name="type" value={type}/><label><Search size={20}/><input name="q" aria-label={'Tên '+label} type="search" maxLength={150} placeholder={'Nhập tên '+label+'…'}/></label><button className="med-button">Tìm kiếm <ArrowRight size={16}/></button></form></section>
    <PatientOverview/>
    <section><div className="med-heading"><h2>Khám theo chuyên khoa</h2>
      {specialties.length > 6 && <button className="specialty-toggle" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded ? 'Thu gọn' : 'Xem tất cả'}</button>}</div>
      <div className="med-specialties">{specialties.slice(0, expanded ? specialties.length : 6).map(s=>
        <Link key={s.id} to={hasSpecialties ? '/doctors?specialty='+s.id : '/dat-kham/bac-si?specialty='+encodeURIComponent(s.name)}>
          <SpecialtyImage name={s.name}/>{s.name}
        </Link>)}</div>
    </section>
    <section><div className="med-heading"><h2>Bác sĩ khám bệnh</h2><Link to="/dat-kham/bac-si">Tất cả bác sĩ <ArrowRight size={16}/></Link></div>
    {error ? <p role="alert">Không tải được danh sách bác sĩ: {error}</p> : !data ? <p role="status">Đang tải bác sĩ…</p> : doctors.length === 0 ? <p role="status">Hiện chưa có bác sĩ trong danh mục.</p> :
    <div className="med-doctors">{doctors.slice(0,3).map(d=><article key={d.id}><header>{d.avatar ? <img src={d.avatar} alt=""/> : <span className="med-avatar">{d.name.split(' ').slice(-2).map(n=>n[0]).join('')}</span>}<div><small>{d.specialty}</small><h3>{d.name}</h3></div></header><p><Building2 size={16}/>{d.hospital || d.city}</p>{d.rating != null && <p><Star size={15}/>{Number(d.rating).toFixed(1)}{d.reviews_count != null && ` (${d.reviews_count} đánh giá)`}</p>}<Link to={'/doctors/'+d.id}>Đặt lịch khám <ArrowRight size={16}/></Link></article>)}</div>}</section>
    <section><div className="med-heading"><h2>Khám tại bệnh viện</h2><Link to="/dat-kham/benh-vien">Tất cả bệnh viện <ArrowRight size={16}/></Link></div>
      <div className="home-facilities">{initialHospitals.filter(h=>!/phòng khám/i.test(h.name)).slice(0,3).map(h=>
        <Link key={h.id} to={'/dat-lich/benh-vien?id='+h.id}>
          <img loading="lazy" src={'/media/directory/hospital-'+h.id+'.jpg'} alt=""/>
          <div><small>{h.city} · {h.exam_types.length} dịch vụ mẫu</small><h3>{h.name}</h3><p>{h.address}</p><strong>Chọn dịch vụ khám <ArrowRight size={15}/></strong></div>
        </Link>)}</div>
    </section>
  </div></div>
}
