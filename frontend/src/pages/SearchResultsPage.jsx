import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useApi from '@/api/useApi'

export default function SearchResultsPage() {
  const [initial] = useSearchParams()
  const [query,setQuery] = useState(initial.get('q') || '')
  const [city,setCity] = useState('')
  const [specialty,setSpecialty] = useState(initial.get('specialty') || '')
  const [radius,setRadius] = useState('5')
  const [coords,setCoords] = useState(null)
  const [notice,setNotice] = useState('')
  const [locating,setLocating] = useState(false)
  const params = new URLSearchParams()
  if (query.trim()) params.set('q',query.trim())
  if (specialty) params.set('specialty',specialty)
  if (city) params.set('city',city)
  if (coords) {
    params.set('lat',coords.latitude)
    params.set('lng',coords.longitude)
    params.set('radius',radius)
  }
  const {data,error} = useApi('/directory?' + params)
  const type = initial.get('type')
  const rows = (data?.data || []).filter(row => {
    if (type === 'doctor') return row.kind === 'doctor'
    const clinic = /phòng khám|clinic/i.test(row.name)
    if (type === 'clinic') return row.kind === 'hospital' && clinic
    if (type === 'hospital') return row.kind === 'hospital' && !clinic
    return true
  })
  function nearby() {
    const fallback = () => {
      setCoords(null)
      setLocating(false)
      setNotice('Hãy chọn tỉnh/thành để tìm nơi khám.')
    }
    if (!navigator.geolocation) return fallback()
    setLocating(true)
    navigator.geolocation.getCurrentPosition(position => {
      setCity('')
      setCoords(position.coords)
      setLocating(false)
      setNotice('')
    }, fallback, {timeout:10000})
  }
  return <section className="clinic"><h1>Tìm nơi khám</h1>
    <div className="filters"><label>Tên bác sĩ hoặc bệnh viện<input value={query} maxLength={150} onChange={e=>setQuery(e.target.value)}/></label>
    <label>Chuyên khoa<select value={specialty} onChange={e=>setSpecialty(e.target.value)}><option value="">Tất cả chuyên khoa</option>{data?.specialties.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
    <label>Tỉnh/thành<select value={city} onChange={e=>{setCity(e.target.value);setCoords(null)}}><option value="">Tất cả tỉnh/thành</option>{data?.cities.map(c=><option key={c}>{c}</option>)}</select></label>
    <button disabled={locating} onClick={nearby}>{locating?'Đang lấy vị trí…':'Gần tôi'}</button>
    {coords && <label>Bán kính<select value={radius} onChange={e=>setRadius(e.target.value)}>{[2,5,10,20].map(r=><option key={r} value={r}>{r} km</option>)}</select></label>}</div>
    <p role="status">{notice}</p>
    {coords && <iframe title="Bản đồ OpenStreetMap quanh vị trí của bạn" className="map" src={'https://www.openstreetmap.org/export/embed.html?' + new URLSearchParams({bbox:[coords.longitude-radius/(111*Math.max(0.01,Math.cos(coords.latitude*Math.PI/180))),coords.latitude-radius/111,coords.longitude+radius/(111*Math.max(0.01,Math.cos(coords.latitude*Math.PI/180))),coords.latitude+radius/111].join(','),marker:[coords.latitude,coords.longitude].join(','),layer:'mapnik'})}/>}
    {error ? <p role="alert">{error}</p> : !data ? <p>Đang tải danh mục…</p> : <><p>{rows.length ? rows.length + ' kết quả' : 'Chưa tìm thấy nơi khám phù hợp. Hãy thử đổi bộ lọc.'}</p><div className="results">{rows.map(r=><article key={r.kind+r.id}><small>{r.specialty || 'Bệnh viện'}</small>
      <h2><Link to={r.kind==='doctor'?'/doctors/'+r.id:'/hospitals/'+r.id+'/book'}>{[r.title,r.name].filter(Boolean).join(' ')}</Link></h2>
      <p>{[r.hospital,r.address,r.city].filter(Boolean).join(' · ')}</p>
      {r.years_experience!=null && <p>{r.years_experience} năm kinh nghiệm</p>}
      {r.km!=null && <p>{r.km.toFixed(1)} km · <a href={'https://www.openstreetmap.org/?mlat='+r.latitude+'&mlon='+r.longitude}>Vị trí trên bản đồ</a></p>}
      <Link className="result-action" to={r.kind==='doctor'?'/doctors/'+r.id:'/hospitals/'+r.id+'/book'}>Chọn ca khám →</Link>
    </article>)}</div></>}
  </section>
}
