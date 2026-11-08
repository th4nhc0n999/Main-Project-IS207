import { Link } from 'react-router-dom'
import {
  PhoneCall,
  Mail,
  MapPin,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  HeartHandshake,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import './footer.css'

export default function Footer() {
  return (
    <footer className="med-footer print:hidden">
      <div className="footer-container">
        {/* Main 4-Column Grid */}
        <div className="footer-grid">
          {/* Cột 1: Về MedSi & Liên hệ */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-logo-wrap" aria-label="MedSi Home">
              <img src="/logo.png" alt="MedSi - Đặt lịch y tế trực tuyến" className="footer-logo-img" />
            </Link>

            <p className="footer-slogan">
              Nền tảng công nghệ y tế hàng đầu kết nối người bệnh với mạng lưới bệnh viện, phòng khám và bác sĩ chuyên khoa uy tín trên toàn quốc.
            </p>

            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <PhoneCall size={16} />
                <div>
                  <span>Tổng đài CSKH &amp; Đặt lịch:</span>{' '}
                  <a href="tel:19002805" className="footer-hotline-highlight">
                    1900 2805
                  </a>{' '}
                  <span className="text-xs text-slate-400">(08:00 - 20:00)</span>
                </div>
              </div>

              <div className="footer-contact-item">
                <Mail size={16} />
                <div>
                  <span>Hỗ trợ kỹ thuật &amp; Hợp tác:</span>{' '}
                  <a href="mailto:hotro@medsi.vn">hotro@medsi.vn</a>
                </div>
              </div>

              <div className="footer-contact-item">
                <MapPin size={16} />
                <span>250 Nguyễn Xí, Phường 13, Quận Bình Thạnh, TP. Hồ Chí Minh</span>
              </div>
            </div>
          </div>

          {/* Cột 2: Dịch vụ đặt khám */}
          <div>
            <h3 className="footer-col-title">Dịch vụ đặt khám</h3>
            <ul className="footer-links-list">
              <li>
                <Link to="/dat-kham/bac-si">
                  <ChevronRight size={13} /> Đặt khám Bác sĩ chuyên khoa
                </Link>
              </li>
              <li>
                <Link to="/dat-kham/benh-vien">
                  <ChevronRight size={13} /> Đặt khám Bệnh viện công &amp; tư
                </Link>
              </li>
              <li>
                <Link to="/doctors">
                  <ChevronRight size={13} /> Tra cứu Bác sĩ &amp; Cơ sở y tế
                </Link>
              </li>
              <li>
                <Link to="/my-bookings">
                  <ChevronRight size={13} /> Quản lý lịch hẹn &amp; Phiếu khám
                </Link>
              </li>
              <li>
                <Link to="/my-bookings?tab=profiles">
                  <ChevronRight size={13} /> Quản lý hồ sơ bệnh nhân
                </Link>
              </li>
              <li>
                <Link to="/check-in">
                  <ChevronRight size={13} /> Quầy tiếp nhận &amp; Quét vé QR
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hướng dẫn & Chính sách */}
          <div>
            <h3 className="footer-col-title">Quy định &amp; Chính sách</h3>
            <ul className="footer-links-list">
              <li>
                <Link to="/my-bookings">
                  <ChevronRight size={13} /> Quy trình khám &amp; Nhận số thứ tự
                </Link>
              </li>
              <li>
                <Link to="/my-bookings">
                  <ChevronRight size={13} /> Chính sách hoàn tiền &amp; Đổi lịch
                </Link>
              </li>
              <li>
                <a href="#terms" onClick={e => e.preventDefault()}>
                  <ChevronRight size={13} /> Điều khoản sử dụng dịch vụ
                </a>
              </li>
              <li>
                <a href="#privacy" onClick={e => e.preventDefault()}>
                  <ChevronRight size={13} /> Chính sách bảo vệ dữ liệu y tế
                </a>
              </li>
              <li>
                <a href="#complaints" onClick={e => e.preventDefault()}>
                  <ChevronRight size={13} /> Quy trình giải quyết khiếu nại
                </a>
              </li>
              <li>
                <a href="#faq" onClick={e => e.preventDefault()}>
                  <ChevronRight size={13} /> Câu hỏi thường gặp (FAQ)
                </a>
              </li>
            </ul>
          </div>

          {/* Cột 4: Ứng dụng & Chứng nhận */}
          <div>
            <h3 className="footer-col-title">Tải ứng dụng MedSi</h3>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Đặt lịch nhanh hơn và nhận thông báo nhắc lịch tự động trên điện thoại.
            </p>

            <div className="footer-app-badges">
              <a
                href="#app-store"
                onClick={e => e.preventDefault()}
                className="app-badge-btn"
                title="Tải MedSi trên App Store"
              >
                <Smartphone size={22} className="text-emerald-400" />
                <div>
                  <span className="text-[10px] text-slate-300 uppercase block">Download on</span>
                  <strong>App Store</strong>
                </div>
              </a>

              <a
                href="#google-play"
                onClick={e => e.preventDefault()}
                className="app-badge-btn"
                title="Tải MedSi trên Google Play"
              >
                <Smartphone size={22} className="text-amber-400" />
                <div>
                  <span className="text-[10px] text-slate-300 uppercase block">GET IT ON</span>
                  <strong>Google Play</strong>
                </div>
              </a>
            </div>

            {/* Chứng nhận an toàn */}
            <div className="space-y-2 pt-1">
              <div className="footer-trust-badge">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <span>Bảo mật dữ liệu y tế chuẩn HIPAA &amp; ISO</span>
              </div>
              <div className="footer-trust-badge">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Đã đăng ký sàn y tế điện tử Bộ Công Thương</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-bottom-legal">
            <p className="m-0 mb-1">
              <strong>Tuyên bố miễn trừ trách nhiệm y khoa:</strong> Các thông tin bác sĩ, chuyên khoa, lịch khám và bài viết trên website MedSi chỉ mang tính chất hỗ trợ đặt hẹn và tham khảo y tế. MedSi không cung cấp dịch vụ khám chữa bệnh trực tiếp hay chẩn đoán y khoa thay thế bác sĩ. Bệnh nhân luôn phải đến cơ sở y tế để được thăm khám lâm sàng.
            </p>
          </div>

          <div className="footer-bottom-copy">
            <div>
              © {new Date().getFullYear()} <strong>MedSi Healthcare Platform</strong>. Toàn bộ bản quyền được bảo lưu.
            </div>
            <div className="text-xs text-slate-400">
              Giấy phép hoạt động kết nối y tế số: 0316892842/GP-SYT do Sở Y Tế cấp.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
