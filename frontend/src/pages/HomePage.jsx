import { Link } from "react-router-dom"
import { 
  Search, 
  Calendar, 
  UserCheck, 
  Shield, 
  ChevronRight, 
  Stethoscope, 
  Star, 
  Building2,
  Navigation,
  Compass
} from "lucide-react"
import { 
  getStoredSpecialties, 
  getStoredDoctors, 
  formatCurrency 
} from "@/lib/mockData"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const specialties = getStoredSpecialties()
  const featuredDoctors = getStoredDoctors().slice(0, 4)

  return (
    <div className="flex-1 pb-16 bg-slate-50/50">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50 py-16 lg:py-20 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold tracking-wide uppercase shadow-sm">
              <Stethoscope className="w-4 h-4 text-sky-600" />
              Nền tảng Đặt Khám Y Tế Thông Minh MedSi
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Đặt lịch khám bệnh <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-sky-500">
                nhanh chóng & chuẩn xác
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Chủ động chọn bác sĩ giỏi, cơ sở y tế uy tín và khung giờ khám mong muốn. Loại bỏ cảnh xếp hàng bốc số mệt mỏi với cơ chế giữ chỗ tức thì.
            </p>

            {/* Quick CTAs */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/25 px-7 font-bold text-sm">
                <Link to="/doctors">
                  <Search className="w-4 h-4 mr-2" />
                  Tìm bác sĩ & Đặt khám
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 px-6 font-bold text-sm">
                <Link to="/doctors?near=true">
                  <Navigation className="w-4 h-4 mr-2" />
                  Bác sĩ gần tôi (GPS)
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm">
                <Link to="/doctors?type=hospital">
                  <Building2 className="w-4 h-4 mr-2 text-sky-600" />
                  Phòng khám / BV
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Specialties Section */}
      <section className="py-14 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                Đa Dạng Chuyên Khoa
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Chuyên Khoa Y Tế Phổ Biến
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Lựa chọn chuyên khoa phù hợp với tình trạng sức khỏe của bạn và người thân.
              </p>
            </div>
            <Link
              to="/doctors"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 group shrink-0"
            >
              <span>Xem tất cả chuyên khoa</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
            {specialties.map((s) => (
              <Link
                key={s.id}
                to={`/doctors?specialty=${encodeURIComponent(s.name)}`}
                className="group bg-slate-50/70 hover:bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-sky-300 hover:shadow-medical transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-base group-hover:scale-110 transition-transform">
                    {s.name.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {s.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-sky-600">
                  <span>{s.doctorCount || 8} bác sĩ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Doctors */}
      <section className="py-14 bg-slate-50/60 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                Bác Sĩ Nổi Bật
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Bác Sĩ Giàu Kinh Nghiệm & Đánh Giá Cao
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Các chuyên gia đầu ngành tại các bệnh viện lớn tại TP.HCM, Hà Nội và Đà Nẵng.
              </p>
            </div>
            <Link
              to="/doctors"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 group shrink-0"
            >
              <span>Xem toàn bộ bác sĩ</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-medical transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative mb-3.5">
                    <img
                      src={doc.avatar}
                      alt={doc.name}
                      className="w-full h-44 rounded-xl object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                    <Badge variant="info" className="absolute top-2.5 left-2.5 shadow-sm text-[10px]">
                      {doc.specialty_name}
                    </Badge>
                  </div>

                  <Link to={`/doctors/${doc.id}`}>
                    <h3 className="font-bold text-slate-900 text-sm hover:text-sky-600 transition-colors line-clamp-1">
                      {doc.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{doc.title}</p>

                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <div className="flex items-center text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                      {doc.rating}
                    </div>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{doc.experience_years} năm KN</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Giá khám</span>
                    <strong className="text-xs font-bold text-sky-600">
                      {formatCurrency(doc.fee)}
                    </strong>
                  </div>
                  <Button asChild size="sm" className="bg-sky-600 hover:bg-sky-700 text-white text-xs h-8">
                    <Link to={`/doctors/${doc.id}`}>Đặt khám</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Feature Highlights */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-medical transition-all">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Bác sĩ chuyên khoa giỏi</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Thông tin chuyên môn, số năm kinh nghiệm, học hàm học vị minh bạch và đánh giá thực tế từ người bệnh.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-medical transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Chọn khung giờ theo ý muốn</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Xem trực tiếp các slot khám sáng/chiều còn trống theo ngày, giữ chỗ tức thì với thuật toán chống trùng lịch.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-medical transition-all">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Bảo mật hồ sơ y tế</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Thông tin bệnh án và lịch sử khám bệnh cá nhân được bảo mật an toàn theo tiêu chuẩn Bộ Y Tế.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
