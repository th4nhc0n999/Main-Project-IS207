import { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { 
  Stethoscope, 
  Calendar, 
  User, 
  LogIn, 
  LogOut,
  Menu, 
  X, 
  PhoneCall, 
  Clock,
  Building2,
  Shield,
  Layers,
  ChevronDown,
  ClipboardList
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Navbar() {
  const { user, isPatient, isAdmin, isGuest, logout, switchRole } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef(null)

  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Determine active doctor/clinic toggle derived directly
  const currentType = searchParams.get("type") || "doctor"
  const isDoctorOrClinicRoute = location.pathname.startsWith("/doctors")
  const activeToggle = (isDoctorOrClinicRoute && currentType === "hospital") || location.pathname === '/hospital-booking' || location.pathname.startsWith('/hospitals/') ? "clinic" : "doctor"

  const handleToggle = (type) => {
    if (type === "clinic") {
      navigate("/hospital-booking")
    } else {
      navigate("/doctors?type=doctor")
    }
  }

  const isHomeActive = location.pathname === "/"
  const isMyBookingsActive = location.pathname.startsWith("/my-bookings")
  const isAdminBookingsActive = location.pathname.startsWith("/admin/bookings")
  const isAdminCatalogActive = location.pathname.startsWith("/admin/catalog")

  return (
    <header className="print:hidden sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all shadow-sm">
      {/* Top Banner: Hotline, Demo Role Switcher & Admin Portal Link */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Hotline & Working hours */}
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-sky-400 font-medium">
              <PhoneCall className="w-3.5 h-3.5" />
              Tổng đài đặt khám: <strong className="text-white font-semibold">1900-2805</strong>
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              Hỗ trợ 24/7 từ Thứ 2 — Chủ nhật
            </span>
          </div>

          {/* Right: Quick Role Switcher for Testing/Demo & Portal Link */}
          <div className="flex items-center gap-3">
            {['staff', 'admin'].includes(user?.role) && (
              <Link to="/check-in" className="text-sky-300 hover:underline font-medium text-[11px]">
                Tiếp nhận bệnh nhân
              </Link>
            )}
            {/* Quick Demo Role Switcher */}
            <div className="flex items-center gap-1 bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
              <span className="text-[10px] text-slate-400 px-1.5 hidden lg:inline-block font-medium">
                Chuyển Role test:
              </span>
              <button
                type="button"
                onClick={() => switchRole("guest")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  isGuest 
                    ? "bg-slate-600 text-white shadow-sm" 
                    : "text-slate-400 hover:text-white"
                }`}
                title="Chế độ Khách (Chưa đăng nhập)"
              >
                Khách
              </button>
              <button
                type="button"
                onClick={() => switchRole("patient")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  isPatient 
                    ? "bg-sky-600 text-white shadow-sm font-semibold" 
                    : "text-slate-400 hover:text-white"
                }`}
                title="Chế độ Bệnh nhân"
              >
                Bệnh nhân
              </button>
              <button
                type="button"
                onClick={() => {
                  switchRole("staff")
                  navigate("/check-in")
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  user?.role === "staff"
                    ? "bg-emerald-600 text-white shadow-sm font-semibold" 
                    : "text-slate-400 hover:text-white"
                }`}
                title="Chế độ Nhân viên tiếp đón (BV Mẫu)"
              >
                Staff (BV Mẫu)
              </button>
              <button
                type="button"
                onClick={() => {
                  switchRole("admin")
                  navigate("/admin/bookings")
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  isAdmin 
                    ? "bg-amber-600 text-white shadow-sm font-semibold" 
                    : "text-slate-400 hover:text-white"
                }`}
                title="Chế độ Quản trị viên"
              >
                Admin
              </button>
            </div>

            {/* Portal shortcut */}
            {isAdmin ? (
              <Link 
                to="/" 
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors text-xs flex items-center gap-1"
              >
                <span>Xem Cổng Bệnh Nhân &rarr;</span>
              </Link>
            ) : (
              <Link 
                to="/admin/bookings" 
                onClick={() => {
                  if (!isAdmin) switchRole("admin")
                }}
                className="text-slate-400 hover:text-white transition-colors underline decoration-slate-600 underline-offset-2"
              >
                Cổng Quản Trị
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to={isAdmin ? "/admin/bookings" : "/"} className="flex items-center gap-2.5 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105 ${
              isAdmin 
                ? "bg-gradient-to-tr from-amber-600 to-amber-400 shadow-amber-500/20" 
                : "bg-gradient-to-tr from-sky-600 to-sky-400 shadow-sky-500/20"
            }`}>
              {isAdmin ? <Shield className="w-5 h-5" /> : <Stethoscope className="w-5 h-5" />}
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                Med<span className={isAdmin ? "text-amber-600" : "text-sky-600"}>Si</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                {isAdmin ? "Admin Portal" : "Y tế thông minh"}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (Role-specific) */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3">
            {isAdmin ? (
              /* ================= ADMIN MENU ================= */
              <>
                <Link
                  to="/admin/bookings"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isAdminBookingsActive
                      ? "text-amber-700 bg-amber-50 font-semibold"
                      : "text-slate-600 hover:text-amber-700 hover:bg-slate-50"
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Quản lý Lịch Hẹn</span>
                </Link>

                <Link
                  to="/admin/catalog"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isAdminCatalogActive
                      ? "text-amber-700 bg-amber-50 font-semibold"
                      : "text-slate-600 hover:text-amber-700 hover:bg-slate-50"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Danh mục & Slots</span>
                </Link>

                <div className="h-5 w-px bg-slate-200 mx-1" />

                <Link
                  to="/doctors"
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-1"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                  <span>Xem DS Bác sĩ</span>
                </Link>
              </>
            ) : (
              /* ================= PATIENT / GUEST MENU ================= */
              <>
                {/* 1. Trang chủ */}
                <Link
                  to="/"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isHomeActive
                      ? "text-sky-600 bg-sky-50 font-semibold"
                      : "text-slate-600 hover:text-sky-600 hover:bg-slate-50"
                  }`}
                >
                  Trang chủ
                </Link>

                {/* 2. Toggle Switch: Bác sĩ <-> Phòng khám */}
                <div className="relative flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 shadow-inner h-10 w-[240px]">
                  <div 
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm border border-slate-200/60 transition-transform duration-300 ease-out pointer-events-none ${
                      activeToggle === "clinic" ? "translate-x-[114px]" : "translate-x-0"
                    }`}
                    style={{ left: "4px" }}
                  />

                  {/* Option 1: Bác sĩ */}
                  <button
                    type="button"
                    onClick={() => handleToggle("doctor")}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 h-full text-xs font-semibold rounded-lg transition-colors duration-200 cursor-pointer ${
                      activeToggle === "doctor" && isDoctorOrClinicRoute
                        ? "text-sky-600"
                        : activeToggle === "doctor"
                        ? "text-slate-800"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Stethoscope className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeToggle === "doctor" ? "scale-110 text-sky-600" : "text-slate-400"
                    }`} />
                    <span>Bác sĩ</span>
                  </button>

                  {/* Option 2: Phòng khám */}
                  <button
                    type="button"
                    onClick={() => handleToggle("clinic")}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 h-full text-xs font-semibold rounded-lg transition-colors duration-200 cursor-pointer ${
                      activeToggle === "clinic" && isDoctorOrClinicRoute
                        ? "text-sky-600"
                        : activeToggle === "clinic"
                        ? "text-slate-800"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Building2 className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeToggle === "clinic" ? "scale-110 text-sky-600" : "text-slate-400"
                    }`} />
                    <span>Phòng khám</span>
                  </button>
                </div>

                {/* 3. Lịch hẹn của tôi */}
                <Link
                  to="/my-bookings"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isMyBookingsActive
                      ? "text-sky-600 bg-sky-50 font-semibold"
                      : "text-slate-600 hover:text-sky-600 hover:bg-slate-50"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Lịch hẹn của tôi</span>
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Right Actions (Role-based) */}
          <div className="hidden md:flex items-center gap-3">
            {isGuest ? (
              /* GUEST: Login & Register buttons */
              <>
                <Button asChild variant="ghost" size="sm" className="text-slate-700 hover:text-sky-600 hover:bg-sky-50">
                  <Link to="/login" className="flex items-center gap-1.5">
                    <LogIn className="w-4 h-4 text-slate-500" />
                    <span>Đăng nhập</span>
                  </Link>
                </Button>
                <Button asChild size="sm" className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm hover:shadow transition-all">
                  <Link to="/register" className="flex items-center gap-1.5 font-medium">
                    <User className="w-4 h-4" />
                    <span>Đăng ký</span>
                  </Link>
                </Button>
              </>
            ) : (
              /* LOGGED IN (PATIENT OR ADMIN): User Profile Menu */
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <img
                    src={user?.avatar}
                    alt={user?.name || "User"}
                    className="w-8 h-8 rounded-full object-cover border border-white shadow-inner"
                  />
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {isAdmin ? "🛡️ Quản trị viên" : "🩺 Bệnh nhân"}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 zoom-in-95">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                      <img
                        src={user?.avatar}
                        alt={user?.name || "User"}
                        className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
                      />
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <Badge variant={isAdmin ? "warning" : "info"} className="mt-1 text-[10px] py-0 px-2">
                          {isAdmin ? "Admin Portal" : "Bệnh nhân MedSi"}
                        </Badge>
                      </div>
                    </div>

                    {/* Navigation items */}
                    <div className="py-1">
                      {isAdmin ? (
                        <>
                          <Link
                            to="/admin/bookings"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                          >
                            <ClipboardList className="w-4 h-4 text-amber-600" />
                            <span>Quản lý lịch hẹn</span>
                          </Link>
                          <Link
                            to="/admin/catalog"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                          >
                            <Layers className="w-4 h-4 text-amber-600" />
                            <span>Quản lý danh mục & Slots</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/my-bookings"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                          >
                            <Calendar className="w-4 h-4 text-sky-600" />
                            <span>Lịch hẹn của tôi</span>
                          </Link>
                          <Link
                            to="/doctors"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                          >
                            <Stethoscope className="w-4 h-4 text-sky-600" />
                            <span>Đặt khám bác sĩ mới</span>
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Logout button */}
                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          logout()
                          setUserDropdownOpen(false)
                          navigate("/")
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            {!isGuest && (
              <Badge variant={isAdmin ? "warning" : "info"} className="text-[10px]">
                {isAdmin ? "Admin" : "Patient"}
              </Badge>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (Role-based) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {!isGuest && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <img src={user?.avatar} alt={user?.name || "User"} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
              <Badge variant={isAdmin ? "warning" : "info"} className="text-[10px]">
                {isAdmin ? "Admin" : "Bệnh nhân"}
              </Badge>
            </div>
          )}

          <div className="flex flex-col space-y-1">
            {isAdmin ? (
              <>
                <Link
                  to="/admin/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-base font-medium flex items-center gap-2 transition-colors ${
                    isAdminBookingsActive ? "text-amber-800 bg-amber-50 font-semibold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                  <span>Quản lý Lịch Hẹn</span>
                </Link>

                <Link
                  to="/admin/catalog"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-base font-medium flex items-center gap-2 transition-colors ${
                    isAdminCatalogActive ? "text-amber-800 bg-amber-50 font-semibold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Layers className="w-5 h-5 text-amber-600" />
                  <span>Danh mục & Slots</span>
                </Link>

                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-base font-medium flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Stethoscope className="w-5 h-5 text-sky-600" />
                  <span>Cổng Bệnh Nhân (Trang chủ)</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isHomeActive ? "text-sky-600 bg-sky-50 font-semibold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Trang chủ
                </Link>

                {/* Mobile Segmented Toggle */}
                <div className="py-2 px-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tìm kiếm theo</p>
                  <div className="relative flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-inner h-11 w-full">
                    <div 
                      className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm border border-slate-200/70 transition-transform duration-300 ease-out pointer-events-none ${
                        activeToggle === "clinic" ? "translate-x-[calc(100%+0px)]" : "translate-x-0"
                      }`}
                      style={{ left: "4px" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleToggle("doctor")
                        setMobileMenuOpen(false)
                      }}
                      className={`relative z-10 flex-1 flex items-center justify-center gap-2 h-full text-sm font-semibold rounded-lg transition-colors duration-200 ${
                        activeToggle === "doctor" ? "text-sky-600" : "text-slate-600"
                      }`}
                    >
                      <Stethoscope className="w-4 h-4 text-sky-600" />
                      <span>Bác sĩ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleToggle("clinic")
                        setMobileMenuOpen(false)
                      }}
                      className={`relative z-10 flex-1 flex items-center justify-center gap-2 h-full text-sm font-semibold rounded-lg transition-colors duration-200 ${
                        activeToggle === "clinic" ? "text-sky-600" : "text-slate-600"
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-sky-600" />
                      <span>Phòng khám</span>
                    </button>
                  </div>
                </div>

                <Link
                  to="/my-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-base font-medium flex items-center gap-2 transition-colors ${
                    isMyBookingsActive ? "text-sky-600 bg-sky-50 font-semibold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Calendar className="w-5 h-5 text-sky-600" />
                  <span>Lịch hẹn của tôi</span>
                </Link>
              </>
            )}
          </div>

          {/* Quick Role Switch in Mobile Menu */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Chuyển vai trò thử nghiệm</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  switchRole("guest")
                  setMobileMenuOpen(false)
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center ${
                  isGuest ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Khách
              </button>
              <button
                type="button"
                onClick={() => {
                  switchRole("patient")
                  setMobileMenuOpen(false)
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center ${
                  isPatient ? "bg-sky-600 text-white border-sky-600" : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Bệnh nhân
              </button>
              <button
                type="button"
                onClick={() => {
                  switchRole("admin")
                  navigate("/admin/bookings")
                  setMobileMenuOpen(false)
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center ${
                  isAdmin ? "bg-amber-600 text-white border-amber-600" : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Auth Actions in Mobile Menu */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isGuest ? (
              <>
                <Button asChild variant="outline" className="w-full justify-center">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Đăng nhập
                  </Link>
                </Button>
                <Button asChild className="w-full justify-center bg-sky-600 hover:bg-sky-700 text-white">
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <User className="w-4 h-4 mr-2" />
                    Đăng ký tài khoản
                  </Link>
                </Button>
              </>
            ) : (
              <Button
                variant="destructive"
                className="w-full justify-center"
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                  navigate("/")
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất ({user?.name})
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
