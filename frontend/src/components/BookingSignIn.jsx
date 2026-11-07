import { Link, useLocation } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'

export default function BookingSignIn({ title }) {
  const location = useLocation()
  return <section className="clinic access-panel">
    <CalendarDays size={32} aria-hidden="true"/>
    <h1>{title}</h1>
    <p>Đăng nhập để sử dụng hồ sơ người khám của bạn.</p>
    <Link className="action-link" state={{returnTo: location.pathname + location.search}} to="/login">Đăng nhập</Link>
  </section>
}
