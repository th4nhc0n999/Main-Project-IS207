import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, HeartPulse, LockKeyhole, Mail, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <div>
        <div style={{ display: 'inline-block', background: 'white', padding: '6px 12px', borderRadius: '8px', marginBottom: '14px' }}>
          <img src="/logo.png" alt="MedSi" style={{ height: '32px', width: 'auto', display: 'block' }} />
        </div>
        <h2>Lịch khám của bạn</h2>
        <p>Xem lại giờ hẹn, mở phiếu khám và quản lý hồ sơ cho cả gia đình.</p>
      </div>
    </aside>
    <div className="login-panel">
      <Link to="/" style={{ display: 'inline-block', marginBottom: '16px' }}>
        <img src="/logo.png" alt="MedSi" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
      </Link>
      <h1 id="login-title">Đăng nhập MedSi</h1><p>Sử dụng email đã đăng ký để tiếp tục.</p>
      <form onSubmit={submit} onChange={()=>setError('')}>
        <label htmlFor="email">Email</label><div className="login-field"><Mail size={18}/><input id="email" name="email" type="email" autoComplete="username" required placeholder="ban@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
        <label htmlFor="password">Mật khẩu</label><div className="login-field"><LockKeyhole size={18}/><input id="password" name="password" type={visible?'text':'password'} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={visible?'Ẩn mật khẩu':'Hiện mật khẩu'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
        {error && <p role="alert">{error}</p>}
        <button className="login-submit" disabled={busy}>{busy?'Đang đăng nhập…':'Đăng nhập'}<ArrowRight size={17}/></button>
      </form>
      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 500 }}>Điền nhanh tài khoản test:</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => { setEmail('patient1@medsi.vn'); setPassword('Patient@123456'); }}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
          >
            👤 Bệnh nhân
          </button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => { setEmail('doctor1@medsi.vn'); setPassword('Doctor@123456'); setError(''); }}
            className="min-h-11 border-sage-200 bg-sage-100 px-3 text-xs text-sage-700 hover:bg-sage-200"
          >
            <Stethoscope size={15} aria-hidden="true"/> Bác sĩ
          </Button>
          <button
            type="button"
            onClick={() => { setEmail('staff.choray@medsi.vn'); setPassword('Staff@123456'); }}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', cursor: 'pointer', fontWeight: 500 }}
          >
            🏥 Staff (BV Chợ Rẫy)
          </button>
          <button
            type="button"
            onClick={() => { setEmail('admin@medsi.vn'); setPassword('Admin@123456'); }}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e', cursor: 'pointer', fontWeight: 500 }}
          >
            🛡️ Admin
          </button>
        </div>
      </div>
      <p className="login-register">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
    </div>
  </section>
}
