import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarDays, Check, Clock3, Hospital, Stethoscope } from 'lucide-react'
import { initialDoctors, initialHospitals } from '@/lib/mockData'

const hours = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '13:30', '14:00']
const fee = value => value.toLocaleString('vi-VN') + ' ₫'
function nextDays() {
  return Array.from({length: 7}, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i + 1)
    return date
  })
}

export default function AppointmentPreview({ hospital = false }) {
  const [params] = useSearchParams()
  const providers = hospital ? initialHospitals.filter(h => !/phòng khám/i.test(h.name)) : initialDoctors
  const [providerId, setProviderId] = useState(Number(params.get('id')))
  const provider = providers.find(p => p.id === providerId) || providers[0]
  const [examId, setExamId] = useState(null)
  const exam = provider.exam_types?.find(item => item.id === examId) || provider.exam_types?.[0]
  const [days] = useState(nextDays)
  const [day, setDay] = useState(0)
  const [time, setTime] = useState('')
  const [step, setStep] = useState(1)
  const [patient, setPatient] = useState('')
  const Icon = hospital ? Hospital : Stethoscope
  const title = hospital ? 'Đặt lịch bệnh viện' : 'Đặt lịch bác sĩ'
  const dateLabel = days[day].toLocaleDateString('vi-VN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const amount = exam?.price ?? provider.fee
  const labels = ['Chọn lịch khám', 'Người khám', 'Xác nhận']
  return <section className="clinic preview-booking">
    <Link to={hospital ? '/dat-kham/benh-vien' : '/dat-kham/bac-si'}>← {hospital ? 'Danh sách bệnh viện' : 'Danh sách bác sĩ'}</Link>
    <h1>{title}</h1>
    <p className="preview-note">Bản xem thử · Dữ liệu minh họa, không tạo lịch khám thật.</p>
    <ol className="booking-steps" aria-label="Tiến trình đặt lịch">{labels.map((label, i) =>
      <li key={label} aria-current={step === i+1 ? 'step' : undefined} data-complete={step > i+1}><span>{step > i+1 ? <Check size={16}/> : i+1}</span>{label}</li>
    )}</ol>
    <div className="booking-columns">
      <aside className="booking-summary">
        <Icon size={30}/><h2>Thông tin lịch khám</h2>
        <strong>{provider.name}</strong><p>{hospital ? provider.address : provider.workplace}</p>
        <dl>{[[hospital ? 'Dịch vụ' : 'Chuyên khoa', exam?.name || provider.specialty_name], ['Ngày khám', dateLabel], ['Giờ khám', time || 'Chưa chọn'], ['Phí khám', fee(amount)]].map(([label,value]) =>
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        )}</dl>
      </aside>
      <article>
        {step === 1 && <>
          <h2><Icon size={21}/> {hospital ? 'Chọn bệnh viện và dịch vụ' : 'Chọn bác sĩ'}</h2>
          <label>{hospital ? 'Bệnh viện' : 'Bác sĩ'}<select value={provider.id} onChange={e=>{setProviderId(Number(e.target.value));setExamId(null);setTime('')}}>{providers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          {hospital && <label>Dịch vụ khám<select value={exam.id} onChange={e=>{setExamId(Number(e.target.value));setTime('')}}>{provider.exam_types.map(e=><option value={e.id} key={e.id}>{e.name}</option>)}</select></label>}
          <fieldset><legend><CalendarDays size={18}/> Ngày khám</legend><div className="preview-options">{days.map((d,i)=>
            <button key={i} aria-pressed={day===i} onClick={()=>{setDay(i);setTime('')}}><small>{d.toLocaleDateString('vi-VN',{weekday:'short'})}</small>{d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})}</button>
          )}</div></fieldset>
          <fieldset><legend><Clock3 size={18}/> Giờ khám</legend><div className="preview-options">{hours.map(h=><button key={h} aria-pressed={time===h} onClick={()=>setTime(h)}>{h}</button>)}</div></fieldset>
          <button disabled={!time} onClick={()=>setStep(2)}>Tiếp tục chọn người khám →</button>
        </>}
        {step === 2 && <form onSubmit={e=>{e.preventDefault();setStep(3)}}>
          <h2>Thông tin người khám</h2><label>Họ tên minh họa<input required maxLength={100} value={patient} placeholder="Ví dụ: Nguyễn Minh An" onChange={e=>setPatient(e.target.value)}/></label>
          <div className="preview-actions"><button type="button" onClick={()=>setStep(1)}>Đổi ca khám</button><button disabled={!patient.trim()}>Kiểm tra lịch khám</button></div>
        </form>}
        {step === 3 && <><h2>Xác nhận thông tin</h2><p>Người khám: <strong>{patient}</strong></p><p>{provider.name}<br/>{time} · {dateLabel}</p>
          <div className="preview-actions"><button type="button" onClick={()=>setStep(2)}>Chỉnh sửa</button><button onClick={()=>setStep(4)}>Xác nhận lịch mẫu</button></div></>}
        {step === 4 && <div role="status"><Check size={32}/><h2>Đã hoàn tất lịch mẫu</h2><p>{patient} · {provider.name}<br/>{time} · {dateLabel}</p><Link to="/">Về trang chủ</Link></div>}
      </article>
    </div>
  </section>
}
