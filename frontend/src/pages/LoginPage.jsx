import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, HeartPulse, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import consultation from '@/assets/consultation.jpg'
import './login.css'

export default function LoginPage() {
  const { login } = useAuth()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await login(email.trim(), password)
      if (!result.success) {
        setError(result.message || 'Đăng nhập chưa thành công. Vui lòng thử lại.')
        return
      }
      const back = state?.returnTo
      const target = typeof back === 'string' && back.startsWith('/') && !back.startsWith('//') ? back : '/'
      navigate(result.user.role === 'admin' ? '/admin/bookings' : target, { replace:true })
    } catch {
      setError('Chưa thể kết nối. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="login-shell" aria-labelledby="login-title">
    <aside className="login-cover">
      <img src={consultation} alt=""/>
      <div><HeartPulse size={32}/><h2>Lịch khám của bạn</h2><p>Xem lại giờ hẹn, mở phiếu khám và quản lý hồ sơ cho cả gia đình.</p></div>
    </aside>
    <div className="login-panel">
      <h1 id="login-title">Đăng nhập MedSi</h1><p>Sử dụng email đã đăng ký để tiếp tục.</p>
      <form onSubmit={submit} onChange={()=>setError('')}>
        <label htmlFor="email">Email</label><div className="login-field"><Mail size={18}/><input id="email" name="email" type="email" autoComplete="username" required placeholder="ban@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
        <label htmlFor="password">Mật khẩu</label><div className="login-field"><LockKeyhole size={18}/><input id="password" name="password" type={visible?'text':'password'} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={visible?'Ẩn mật khẩu':'Hiện mật khẩu'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
        {error && <p role="alert">{error}</p>}
        <button className="login-submit" disabled={busy}>{busy?'Đang đăng nhập…':'Đăng nhập'}<ArrowRight size={17}/></button>
      </form>
      <p className="login-register">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
    </div>
  </section>
}
