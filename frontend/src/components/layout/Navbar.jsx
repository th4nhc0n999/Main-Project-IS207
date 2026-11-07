import { useEffect, useRef, useState } from 'react'
import { CalendarDays, CalendarPlus, Check, ChevronDown, HeartPulse, Hospital, Search, Stethoscope } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import './navbar.css'

const bookingLinks = [
  { to: '/dat-kham/bac-si', title: 'Đặt khám bác sĩ', Icon: Stethoscope, matches: /^\/(?:dat-(?:kham|lich)\/bac-si\/?$|doctors\/[^/]+|booking\/confirm)/ },
  { to: '/dat-kham/benh-vien', title: 'Đặt khám bệnh viện', Icon: Hospital, matches: /^\/(?:dat-(?:kham|lich)\/benh-vien\/?$|hospital-booking|hospitals\/)/ },
]

function BookingSwitch({ pathname }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)
  useEffect(() => {
    if (!open) return
    function dismiss(event) {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])
  return <div className="booking-switch" ref={root}
    onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false) }}
    onKeyDown={e => {
      if (open && e.key === 'Escape') {
        setOpen(false)
        trigger.current.focus()
      }
    }}>
    <button ref={trigger} aria-expanded={open} aria-controls="booking-links" onClick={() => setOpen(!open)}>
      <CalendarPlus size={18}/> Đặt lịch <ChevronDown size={15}/>
    </button>
    <div id="booking-links" className="booking-links" hidden={!open}>
      {bookingLinks.map(({ to, title, Icon, matches }) =>
        <Link key={to} to={to} aria-current={matches.test(pathname) ? 'location' : undefined} onClick={() => setOpen(false)}>
          <Icon size={19}/>{title}{matches.test(pathname) && <Check size={16}/>}
        </Link>)}
    </div>
  </div>
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  return <header className="med-header print:hidden"><nav aria-label="Điều hướng chính">
    <Link className="med-brand" to="/"><HeartPulse size={32}/>MedSi</Link>
    <form action="/doctors" role="search"><Search size={17}/><input name="q" type="search" maxLength={150} placeholder="Tìm nơi khám…" aria-label="Tìm nơi khám"/></form>
    <div className="header-actions">
      <Link className="browse-link" to="/doctors">Tìm nơi khám</Link>
      <BookingSwitch key={location.key} pathname={location.pathname}/>
      <Link to="/my-bookings"><CalendarDays size={17}/> Lịch khám</Link>
      {user && <Link to="/my-bookings?tab=profiles">Hồ sơ</Link>}
      {user?.role === 'doctor' && <Link to="/doctor/appointments">Lịch tiếp khám</Link>}
      {user?.role === 'admin' && <><Link to="/admin/bookings">Quản lý lịch</Link><Link to="/admin/catalog">Danh mục</Link></>}
      {['staff','admin'].includes(user?.role) && <Link to="/check-in">Tiếp nhận</Link>}
      {user ? <button className="header-account" onClick={logout}>Đăng xuất</button> : <Link className="header-account" to="/login">Đăng nhập</Link>}
    </div>
  </nav></header>
}
