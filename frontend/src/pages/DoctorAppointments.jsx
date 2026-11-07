import {useState} from 'react'
import useApi from '@/api/useApi'
import client from '@/api/axiosClient'
export default function DoctorAppointments(){
  const [revision,refresh]=useState(0)
  const [issue,setIssue]=useState('')
  const [busy,setBusy]=useState(false)
  const {data,error}=useApi('/doctor/appointments',revision)
  async function change(id,action){
    setIssue('');setBusy(true)
    try {await client.post('/doctor/appointments/'+id+'/'+action);refresh(v=>v+1)}
    catch(err){setIssue(err.message)} finally {setBusy(false)}
  }
  return <section className="clinic"><h1>Lịch tiếp khám</h1><button onClick={()=>refresh(v=>v+1)}>Cập nhật lịch</button>
  <p role="alert">{error || issue}</p>{!data && !error && <p>Đang tải…</p>}{data?.data.length===0 && <p>Chưa có lịch chờ tiếp khám.</p>}
  {data?.data.map(b=><article key={b.id}><h2>{b.code}</h2><p>{b.work_date} · {b.start_time}</p>
    {b.status==='confirmed'?<p>Đã duyệt · Chờ tiếp nhận</p>:<button disabled={busy} onClick={()=>change(b.id,b.status==='checked_in'?'complete':'approve')}>{b.status==='checked_in'?'Hoàn tất khám':'Duyệt lịch'}</button>}</article>)}</section>
}