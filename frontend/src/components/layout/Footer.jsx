import { Link } from "react-router-dom"
import { Stethoscope, ShieldCheck, Mail, Phone, MapPin, ChevronRight } from "lucide-react"

export default function Footer() {
  return (
    <footer className="print:hidden bg-slate-900 text-slate-300 pt-14 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-800/80">
          {/* Col 1: Brand & Intro */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Med<span className="text-sky-400">Si</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Nền tảng công nghệ y tế hàng đầu kết nối người bệnh với bác sĩ chuyên khoa và bệnh viện uy tín. Đặt lịch khám nhanh chóng, không phải chờ đợi.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-400 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Hệ thống đạt chuẩn an toàn y tế
              </span>
            </div>
          </div>

          {/* Col 2: Services for patients */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider">
              Dành Cho Bệnh Nhân
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/doctors" className="hover:text-sky-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  Đặt khám bác sĩ
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="hover:text-sky-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  Đặt khám bệnh viện
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-sky-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  Tra cứu lịch khám
                </Link>
              </li>
              <li>
                <span className="text-slate-500 flex items-center gap-1 cursor-default">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  Hướng dẫn quy trình
                </span>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Specialties */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider">
              Chuyên Khoa
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/doctors" className="hover:text-sky-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  Chuyên khoa Nhi
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="hover:text-sky-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  Chuyên khoa Da liễu
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="hover:text-sky-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  Cơ Xương Khớp
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="hover:text-sky-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  Sản Phụ Khoa
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Hotline */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider">
              Hỗ Trợ 24/7
            </h4>
            <div className="space-y-2.5 text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-white font-semibold">1900-2805</div>
                  <div className="text-xs text-slate-500">Cước gọi 1.000đ/phút</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                <span>support@medsi.vn</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                <span className="text-xs">Khu Công Nghệ Phần Mềm ĐHQG-HCM, TP. Thủ Đức</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 MedSi Platform — Hệ thống y tế số chuẩn mực theo mô hình YouMed. Mọi quyền được bảo lưu.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Chính sách bảo mật</span>
            <span className="hover:text-slate-400 cursor-pointer">Quy chế hoạt động</span>
            <span className="hover:text-slate-400 cursor-pointer">Giải quyết khiếu nại</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
