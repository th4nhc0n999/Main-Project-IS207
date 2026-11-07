import {useState} from 'react'
import client from '@/api/axiosClient'

export default function ProfileCreator({onCreated}){
  const [open,setOpen]=useState(false)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  async function save(e){
    e.preventDefault()
    const fields=Object.fromEntries(new FormData(e.currentTarget))
    setBusy(true);setError('')
    try {
      const {data}=await client.post('/patient-profiles',{...fields,consent_agreed:true})
      onCreated(data);setOpen(false)
    } catch(err){setError(Object.values(err.errors || {}).flat().join(' ') || err.message)}
    finally {setBusy(false)}
  }
  return <div><button type="button" onClick={()=>setOpen(!open)}>{open?'Đóng biểu mẫu':'Tạo hồ sơ mới'}</button>
    {open && <form className="profile-form" onSubmit={save}><label>Họ tên người khám<input name="full_name" maxLength={150} required/></label>
    <label>Ngày sinh<input type="date" name="dob" required/></label><label>Giới tính<select name="gender"><option value="female">Nữ</option><option value="male">Nam</option><option value="other">Khác</option></select></label>
    <label>Quan hệ với chủ tài khoản<select name="relationship">{['Bản thân','Cha','Mẹ','Con','Vợ','Chồng','Khác'].map(r=><option key={r}>{r}</option>)}</select></label>
    <details><summary>Người giám hộ (bắt buộc cho trẻ dưới 16 tuổi)</summary><label>Tên người giám hộ<input name="guardian_name"/></label><label>Điện thoại người giám hộ<input type="tel" name="guardian_phone"/></label><label>Quan hệ với trẻ<input name="guardian_relationship"/></label></details>
    <label><input type="checkbox" required/> Tôi đồng ý cho MedSi xử lý dữ liệu hồ sơ để đặt và quản lý lịch khám.</label>
    {error && <p role="alert">{error}</p>}<button disabled={busy}>Lưu hồ sơ</button></form>}</div>
}