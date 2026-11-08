import { Link, NavLink, useSearchParams } from 'react-router-dom'
import { ArrowRight, Building2, ChevronRight, MapPin, Search, Star, Stethoscope } from 'lucide-react'
import { initialHospitals } from '@/lib/mockData'
import useApi from '@/api/useApi'
import SpecialtyImage from '@/components/SpecialtyImage'
import consultation from '@/assets/consultation.jpg'
import './directory.css'

const hospitals = initialHospitals.filter(item => !/phòng khám/i.test(item.name))
const normalize = value => value.toLocaleLowerCase('vi').normalize('NFD').replace(/\p{M}/gu, '').replaceAll('đ', 'd')

function ProviderCard({ provider, hospital }) {
  const p = provider
  return <article className={'provider-card' + (hospital ? ' facility' : '')}>
    {hospital && <img className="facility-image" src={'/media/directory/hospital-'+p.id+'.jpg'} alt=""/>}
    <div className="provider-body">
      <header>
        {!hospital && (p.avatar
          ? <img className="provider-avatar" src={p.avatar} alt=""/>
          : <span className="provider-avatar initials">{p.name.split(' ').slice(-2).map(word=>word[0]).join('')}</span>)}
        <div>{!hospital && <small>{p.specialty_name}</small>}<h3>{p.name}</h3></div>
      </header>
      <p className="provider-location"><MapPin size={16}/>{hospital ? p.address : p.workplace}</p>
      {hospital ? <p>{p.exam_types.length} dịch vụ khám</p> :
        p.rating != null && <p className="provider-rating"><Star size={15}/> <strong>{Number(p.rating).toLocaleString('vi-VN')}</strong>{p.reviews_count != null && ` (${p.reviews_count} đánh giá)`}</p>}
      <div className="provider-action">
        <span>{hospital ? 'Phí khám từ' : 'Phí khám'}<strong>{(hospital ? Math.min(...p.exam_types.map(e=>e.price)) : p.fee).toLocaleString('vi-VN')} ₫</strong></span>
        <Link to={hospital ? '/dat-lich/benh-vien?id='+p.id : '/doctors/'+p.id}>Đặt lịch khám <ArrowRight size={15}/></Link>
      </div>
    </div>
  </article>
}

export default function ProviderDirectory({ hospital = false }) {
  const [params,setParams] = useSearchParams()
  const {data,error} = useApi(hospital ? null : '/directory')
  const query = params.get('q') || ''
  const specialty = params.get('specialty') || ''
  const doctors = (data?.data || []).filter(item=>item.kind==='doctor').map(item=>({
    ...item,
    specialty_name: item.specialty,
    workplace: [item.hospital,item.address,item.city].filter(Boolean).join(' · '),
    fee: Number(item.consultation_fee),
  }))
  const providers = hospital ? hospitals : doctors
  const title = hospital ? 'Đặt khám bệnh viện' : 'Đặt khám bác sĩ'
  const specialties = [...new Set(doctors.map(p=>p.specialty_name).filter(Boolean))]
  const selectedSpecialty = doctors.find(p=>String(p.specialty_id)===specialty)?.specialty_name || specialty
  const loading = !hospital && !data && !error
  const filtered = providers.filter(p => {
    const fields = [p.name,p.address,p.city,p.workplace,p.specialty_name,...(p.exam_types || []).map(e=>e.name)]
    return (hospital || !specialty || selectedSpecialty === p.specialty_name) && normalize(fields.filter(Boolean).join(' ')).includes(normalize(query.trim()))
  })
  function update(key,value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key,value)
    else next.delete(key)
    setParams(next,{replace:true,preventScrollReset:true})
  }
  return <div className="directory">
    <nav aria-label="Đường dẫn" className="directory-crumb"><Link to="/">Trang chủ</Link><ChevronRight size={14}/>{title}</nav>
    <header className="directory-hero">
      <div><h1>{title}</h1><p>{hospital ? 'Tìm cơ sở phù hợp, xem dịch vụ và chọn ca khám.' : 'Tìm bác sĩ theo chuyên khoa và chọn giờ khám phù hợp.'}</p>
        <label className="directory-search"><Search size={20}/><input type="search" aria-label={hospital?'Tìm bệnh viện':'Tìm bác sĩ'} placeholder={hospital?'Tên bệnh viện, dịch vụ hoặc địa chỉ…':'Tên bác sĩ, chuyên khoa hoặc nơi khám…'} value={query} onChange={e=>update('q',e.target.value)}/></label>
      </div><img src={hospital ? '/media/directory/hospital-1.jpg' : consultation} alt=""/>
    </header>
    <nav className="directory-tabs" aria-label="Danh mục đặt khám">
      <NavLink to="/dat-kham/bac-si"><Stethoscope size={18}/>Bác sĩ</NavLink>
      <NavLink to="/dat-kham/benh-vien"><Building2 size={18}/>Bệnh viện</NavLink>
    </nav>
    {!hospital && <section className="specialty-picker"><h2>Khám theo chuyên khoa</h2>
      <div>{['',...specialties].map(s=><button key={s} aria-pressed={selectedSpecialty===s} onClick={()=>update('specialty',s)}>{s && <SpecialtyImage name={s} size={24}/>} {s || 'Tất cả'}</button>)}</div>
    </section>}
    <div className="directory-heading"><h2>{hospital?'Danh sách bệnh viện':'Danh sách bác sĩ'}</h2><span role="status">{loading ? 'Đang tải bác sĩ…' : !hospital && error ? 'Không tải được danh sách bác sĩ' : `${filtered.length} ${hospital ? 'bệnh viện · Dữ liệu mẫu' : 'bác sĩ'}`}</span></div>
    {loading ? <p role="status">Đang tải danh sách bác sĩ…</p> : !hospital && error ?
      <div className="directory-empty" role="alert"><p>Không tải được danh sách bác sĩ: {error}</p></div> :
      !hospital && doctors.length === 0 ? <div className="directory-empty"><p role="status">Hiện chưa có bác sĩ trong danh mục.</p></div> :
      filtered.length ? <div className="provider-grid">{filtered.map(p=><ProviderCard key={p.id} provider={p} hospital={hospital}/>)}</div> :
      <div className="directory-empty"><p>Chưa có kết quả phù hợp.</p><button onClick={()=>setParams({})}>Xóa bộ lọc</button></div>}
  </div>
}
