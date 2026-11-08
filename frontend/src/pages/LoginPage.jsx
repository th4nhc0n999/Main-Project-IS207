import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, HeartPulse, LockKeyhole, Mail, ShieldAlert, Sparkles, UserCheck, Stethoscope, Trash2, Users } from 'lucide-react'
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

  async function executeLogin(targetEmail, targetPassword) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await login(targetEmail.trim(), targetPassword)
      if (!result.success) {
        setError(result.message || 'Đăng nhập chưa thành công. Vui lòng thử lại.')
        return
      }
      const back = state?.returnTo
      const target = typeof back === 'string' && back.startsWith('/') && !back.startsWith('//') ? back : '/'
      if (result.user.role === 'admin') {
        navigate('/admin/bookings', { replace: true })
      } else if (result.user.role === 'doctor') {
        navigate('/my-bookings?tab=doctor', { replace: true })
      } else {
        navigate(target, { replace: true })
      }
    } catch {
      setError('Chưa thể kết nối. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    await executeLogin(email, password)
  }

  const testAccounts = [
    {
      id: "e15",
      title: "👶 Test E15: Hồ sơ trẻ em & Consent",
      email: "patient.e15@medsi.vn",
      desc: "Kiểm thử trẻ em <16t bắt buộc Người giám hộ, Consent NĐ 13/2023 & che mờ dữ liệu",
      badge: "Kịch bản E15",
      color: "border-sky-200 hover:border-sky-400 hover:bg-sky-50/50 text-sky-800"
    },
    {
      id: "e17",
      title: "🗑️ Test E17: Chính sách xóa 3 tầng",
      email: "patient.e17@medsi.vn",
      desc: "Chặn xóa lịch hẹn đang chờ, xóa mềm lưu trữ lịch cũ, xóa cứng hồ sơ trắng",
      badge: "Kịch bản E17",
      color: "border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 text-amber-800"
    },
    {
      id: "max10",
      title: "🚫 Test Giới hạn 10 hồ sơ (Max 10)",
      email: "patient.max10@medsi.vn",
      desc: "Đã có sẵn 10/10 hồ sơ, kiểm thử chặn tạo thêm hồ sơ thứ 11",
      badge: "Edge Case",
      color: "border-purple-200 hover:border-purple-400 hover:bg-purple-50/50 text-purple-800"
    },
    {
      id: "doctor",
      title: "👨‍⚕️ Test Bác sĩ (Task S4-24)",
      email: "doctor.ck03@medsi.vn",
      desc: "Tiếp nhận ca khám & kiểm tra Bản chụp hồ sơ Snapshot che mờ bảo mật",
      badge: "Bác sĩ Snapshot",
      color: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-emerald-800"
    }
  ]

  function handleQuickLogin(acc) {
    setEmail(acc.email)
    setPassword("Password@123")
    executeLogin(acc.email, "Password@123")
  }

  return (
    <section className="login-shell" aria-labelledby="login-title">
      <aside className="login-cover">
        <img src={consultation} alt="" />
        <div>
          <HeartPulse size={32} />
          <h2>Lịch khám của bạn</h2>
          <p>Xem lại giờ hẹn, mở phiếu khám và quản lý hồ sơ cho cả gia đình.</p>
        </div>
      </aside>

      <div className="login-panel">
        <h1 id="login-title">Đăng nhập MedSi</h1>
        <p>Sử dụng email đã đăng ký hoặc chọn tài khoản kiểm thử Sprint 4 bên dưới.</p>

        <form onSubmit={submit} onChange={() => setError('')}>
          <label htmlFor="email">Email</label>
          <div className="login-field">
            <Mail size={18} />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="ban@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label htmlFor="password">Mật khẩu</label>
          <div className="login-field">
            <LockKeyhole size={18} />
            <input
              id="password"
              name="password"
              type={visible ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p role="alert" className="text-rose-600 text-xs mt-1.5">{error}</p>}

          <button className="login-submit" disabled={busy}>
            {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
            <ArrowRight size={17} />
          </button>
        </form>

        {/* BỘ TEST CASE & TÀI KHOẢN KIỂM THỬ SPRINT 4 */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Tài khoản kiểm thử nhanh (Sprint 4)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Bấm vào bất kỳ tài khoản nào để tự động điền mật khẩu <code>Password@123</code> và đăng nhập ngay:
          </p>

          <div className="space-y-2">
            {testAccounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                disabled={busy}
                onClick={() => handleQuickLogin(acc)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between gap-2 shadow-xs ${acc.color}`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <span>{acc.title}</span>
                  </div>
                  <div className="text-[11px] opacity-80 truncate font-mono mt-0.5">
                    {acc.email}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border shadow-2xs">
                  {acc.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="login-register mt-4">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </section>
  )
}
