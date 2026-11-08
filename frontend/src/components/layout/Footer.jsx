import { Link } from 'react-router-dom'

export default function Footer() {
  return <footer className="med-footer print:hidden">
    <nav className="med-wrap" aria-label="Liên kết cuối trang">
      <Link to="/" className="inline-flex items-center no-underline">
        <img src="/logo.png" alt="MedSi" style={{ height: '30px', width: 'auto', objectFit: 'contain' }} />
      </Link>
      <Link to="/doctors?type=doctor">Đặt khám bác sĩ</Link>
      <Link to="/hospital-booking">Đặt khám bệnh viện</Link>
      <Link to="/my-bookings">Lịch khám của tôi</Link>
    </nav>
  </footer>
}
