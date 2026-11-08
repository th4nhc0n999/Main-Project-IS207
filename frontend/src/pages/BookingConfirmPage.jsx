import BookingSteps from '@/components/BookingSteps'
import BookingSignIn from '@/components/BookingSignIn'
import {useState,useRef} from 'react'
import {Link,useSearchParams,useNavigate} from 'react-router-dom'
import {useAuth} from '@/context/AuthContext'
import useApi from '@/api/useApi'
import client from '@/api/axiosClient'
import ProfileCreator from '@/components/ProfileCreator'

export default function BookingConfirmPage(){
  const [params]=useSearchParams()
  const doctor=params.get('doctor'),slot=params.get('slot')
  const {user,loading}=useAuth()
  const [revision,refresh]=useState(0)
  const profiles=useApi(user?'/patient-profiles':null,revision)
  const detail=useApi(doctor?'/doctors/'+doctor:null)
  const [profile,setProfile]=useState('')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const key=useRef(null)
  const navigate=useNavigate()
  async function submit(e){
    e.preventDefault();setBusy(true);setError('')
    key.current ||= crypto.randomUUID()
    try {
      const {data}=await client.post('/doctors/'+doctor+'/bookings',{slot_id:slot,patient_profile_id:profile,request_key:key.current})
      navigate('/payment?booking_id='+data.id,{replace:true})
    } catch(err){setError(err.message)} finally {setBusy(false)}
  }
  if (loading) return <p className="clinic">Đang kiểm tra tài khoản…</p>
  if (!user) return <BookingSignIn title="Chọn hồ sơ người khám"/>
  const chosen=detail.data?.slots.find(s=>String(s.id)===slot)
  return <section className="clinic"><h1>Chọn hồ sơ người khám</h1><BookingSteps current={2}/><div className="booking-columns"><aside className="booking-summary"><h2>Lịch đã chọn</h2><strong>{detail.data?.data.name}</strong><p>{detail.data?.data.hospital}</p><p>{chosen?.work_date} · {chosen?.start_time}</p><Link to={'/doctors/'+doctor}>Đổi ca khám</Link></aside><article><h2>Hồ sơ người khám</h2>
    <ProfileCreator onCreated={p=>{setProfile(p.id);refresh(v=>v+1);key.current=null}}/>
    <form onSubmit={submit}><label>Hồ sơ bệnh nhân<select required value={profile} onChange={e=>{setProfile(e.target.value);key.current=null}}><option value="">Chọn hồ sơ</option>{profiles.data?.data.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label>
    {detail.data && !chosen && <p>Ca đã hết chỗ. <Link to={'/doctors/'+doctor}>Chọn ca khác</Link></p>}
    <button disabled={busy || !chosen || !profile || !profiles.data}>Giữ chỗ và thanh toán</button></form><p role="alert">{error || profiles.error || detail.error}</p></article></div></section>
}