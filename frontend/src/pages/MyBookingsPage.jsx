import { useState, useEffect, useMemo } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Search, 
  Printer, 
  RotateCcw, 
  Plus, 
  Pencil, 
  Trash2, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  Phone, 
  X,
  Loader2,
  Check,
  Building2
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { 
  formatCurrency, 
  formatDateVN 
} from "@/lib/mockData"
import { 
  fetchUserBookings, 
  cancelUserBooking, 
  fetchPatientProfiles, 
  createPatientProfile, 
  updatePatientProfile as apiUpdatePatientProfile, 
  deletePatientProfile as apiDeletePatientProfile,
  updateCurrentUser,
  logoutUser
} from "@/api/profileApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function MyBookingsPage() {
  const { 
    user, 
    patientProfiles: contextProfiles, 
    addPatientProfile, 
    updatePatientProfile: contextUpdateProfile, 
    deletePatientProfile: contextDeleteProfile,
    updateUserProfile,
    logout 
  } = useAuth()
  
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Active main tab: 'bookings' | 'profiles' | 'account'
  const activeMainTab = searchParams.get("tab") || "bookings"
  const setMainTab = (tab) => {
    setSearchParams({ tab })
  }

  // ==========================================
  // STATE: BOOKINGS
  // ==========================================
  const [bookings, setBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all") // all | pending | confirmed | completed | cancelled
  const [searchQuery, setSearchQuery] = useState("")
  const [cancellingBooking, setCancellingBooking] = useState(null)
  const [cancelReason, setCancelReason] = useState("")
  const [bookingActionMsg, setBookingActionMsg] = useState("")

  // Load Bookings
  const loadBookings = async () => {
    setLoadingBookings(true)
    try {
      const res = await fetchUserBookings({ status: statusFilter, q: searchQuery })
      setBookings(res.data || [])
    } catch (err) {
      console.error("Lỗi tải danh sách bookings:", err)
    } finally {
      setLoadingBookings(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [statusFilter, searchQuery])

  // Status counts based on all bookings
  const counts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    }
  }, [bookings])

  // Filtered Bookings for display
  const displayedBookings = useMemo(() => {
    let result = bookings
    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((b) => {
        return (
          b.code?.toLowerCase().includes(q) ||
          b.doctor_name?.toLowerCase().includes(q) ||
          b.doctor?.name?.toLowerCase().includes(q) ||
          b.hospital_name?.toLowerCase().includes(q) ||
          b.hospital?.name?.toLowerCase().includes(q) ||
          b.patient_name?.toLowerCase().includes(q) ||
          b.patient_profile?.full_name?.toLowerCase().includes(q) ||
          b.specialty_name?.toLowerCase().includes(q)
        )
      })
    }
    return result
  }, [bookings, statusFilter, searchQuery])

  // Handle Cancel Booking
  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return
    try {
      await cancelUserBooking(cancellingBooking.id, cancelReason)
      setBookingActionMsg(`Đã hủy thành công phiếu hẹn ${cancellingBooking.code}`)
      setCancellingBooking(null)
      setCancelReason("")
      loadBookings()
      setTimeout(() => setBookingActionMsg(""), 4000)
    } catch (err) {
      alert(err.message || "Hủy lịch khám thất bại")
    }
  }

  // ==========================================
  // STATE: PATIENT PROFILES (CRUD)
  // ==========================================
  const [profiles, setProfiles] = useState(contextProfiles || [])
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)
  const [deletingProfile, setDeletingProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    dob: "",
    gender: "male",
    phone: "",
    relationship: "Bản thân",
  })
  const [profileFormError, setProfileFormError] = useState("")
  const [profileActionMsg, setProfileActionMsg] = useState("")

  // Fetch patient profiles
  const loadProfiles = async () => {
    try {
      const res = await fetchPatientProfiles()
      if (res.data) {
        setProfiles(res.data)
      }
    } catch (err) {
      console.error("Lỗi tải hồ sơ bệnh nhân:", err)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  // Open modal create
  const handleOpenCreateProfile = () => {
    setEditingProfile(null)
    setProfileForm({
      full_name: "",
      dob: "1995-01-01",
      gender: "male",
      phone: user?.phone || "",
      relationship: "Bản thân",
    })
    setProfileFormError("")
    setProfileModalOpen(true)
  }

  // Open modal edit
  const handleOpenEditProfile = (profile) => {
    setEditingProfile(profile)
    setProfileForm({
      full_name: profile.full_name || "",
      dob: profile.dob ? profile.dob.split("T")[0] : "1995-01-01",
      gender: profile.gender || "male",
      phone: profile.phone || "",
      relationship: profile.relationship || "Bản thân",
    })
    setProfileFormError("")
    setProfileModalOpen(true)
  }

  // Save profile (Create or Update)
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setProfileFormError("")

    if (!profileForm.full_name.trim()) {
      setProfileFormError("Họ và tên bệnh nhân không được để trống")
      return
    }
    if (!profileForm.dob) {
      setProfileFormError("Vui lòng chọn ngày sinh")
      return
    }

    try {
      if (editingProfile) {
        // Update
        const res = await apiUpdatePatientProfile(editingProfile.id, profileForm)
        contextUpdateProfile(editingProfile.id, res.data || profileForm)
        setProfileActionMsg("Cập nhật hồ sơ bệnh nhân thành công!")
      } else {
        // Create
        const res = await createPatientProfile(profileForm)
        addPatientProfile(res.data || profileForm)
        setProfileActionMsg("Thêm hồ sơ bệnh nhân mới thành công!")
      }
      setProfileModalOpen(false)
      loadProfiles()
      setTimeout(() => setProfileActionMsg(""), 4000)
    } catch (err) {
      setProfileFormError(err.message || "Có lỗi xảy ra khi lưu hồ sơ")
    }
  }

  // Delete profile
  const handleConfirmDeleteProfile = async () => {
    if (!deletingProfile) return
    try {
      await apiDeletePatientProfile(deletingProfile.id)
      contextDeleteProfile(deletingProfile.id)
      setProfileActionMsg(`Đã xóa hồ sơ "${deletingProfile.full_name}" thành công!`)
      setDeletingProfile(null)
      loadProfiles()
      setTimeout(() => setProfileActionMsg(""), 4000)
    } catch (err) {
      alert(err.message || "Không thể xóa hồ sơ bệnh nhân này")
      setDeletingProfile(null)
    }
  }

  // ==========================================
  // STATE: USER ACCOUNT INFO (Edit)
  // ==========================================
  const [accountForm, setAccountForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
  })
  const [savingAccount, setSavingAccount] = useState(false)
  const [accountSuccessMsg, setAccountSuccessMsg] = useState("")
  const [accountErrorMsg, setAccountErrorMsg] = useState("")

  useEffect(() => {
    if (user) {
      setAccountForm({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
      })
    }
  }, [user])

  const handleSaveAccount = async (e) => {
    e.preventDefault()
    setSavingAccount(true)
    setAccountSuccessMsg("")
    setAccountErrorMsg("")

    try {
      const res = await updateCurrentUser({
        name: accountForm.name,
        phone: accountForm.phone,
      })
      updateUserProfile({
        name: accountForm.name,
        phone: accountForm.phone,
      })
      setAccountSuccessMsg(res.message || "Cập nhật thông tin tài khoản thành công!")
      setTimeout(() => setAccountSuccessMsg(""), 4000)
    } catch (err) {
      setAccountErrorMsg(err.message || "Cập nhật tài khoản thất bại")
    } finally {
      setSavingAccount(false)
    }
  }

  // ==========================================
  // STATE: LOGOUT MODAL
  // ==========================================
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  const handleConfirmLogout = async () => {
    await logoutUser()
    logout()
    setLogoutModalOpen(false)
    navigate("/login")
  }

  // Status Badge UI helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning" className="gap-1 font-semibold"><Clock className="w-3 h-3" /> Chờ Duyệt</Badge>
      case "confirmed":
        return <Badge variant="success" className="gap-1 font-semibold"><CheckCircle2 className="w-3 h-3" /> Đã Xác Nhận</Badge>
      case "completed":
        return <Badge variant="purple" className="gap-1 font-semibold"><CheckCircle2 className="w-3 h-3" /> Đã Hoàn Thành</Badge>
      case "cancelled":
        return <Badge variant="danger" className="gap-1 font-semibold"><XCircle className="w-3 h-3" /> Đã Hủy</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Banner & User Summary */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                  alt={user?.name || "User"}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-sky-100"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                    {user?.name || "Người dùng MedSi"}
                  </h1>
                  <Badge variant="info" className="text-[10px] py-0.5">
                    {user?.role === "admin" ? "🛡️ Quản trị viên" : "🩺 Bệnh nhân"}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {user?.email || "Chưa cập nhật email"} • {user?.phone || "Chưa cập nhật SĐT"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button asChild className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm font-semibold text-xs sm:text-sm">
                <Link to="/doctors" className="flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4" />
                  <span>Đặt Lịch Khám Mới</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogoutModalOpen(true)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-xs sm:text-sm font-medium gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            </div>
          </div>

          {/* Navigation Tabs (All on the same page) */}
          <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-slate-100 mt-6 scrollbar-none">
            <button
              onClick={() => setMainTab("bookings")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeMainTab === "bookings"
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Lịch Khám Của Tôi</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeMainTab === "bookings" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {bookings.length}
              </span>
            </button>

            <button
              onClick={() => setMainTab("profiles")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeMainTab === "profiles"
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Hồ Sơ Bệnh Nhân</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeMainTab === "profiles" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {profiles.length}
              </span>
            </button>

            <button
              onClick={() => setMainTab("account")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeMainTab === "account"
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Thông Tin Tài Khoản</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ======================================================== */}
        {/* TAB 1: DANH SÁCH LỊCH KHÁM CỦA TÔI + SEARCH + BADGES    */}
        {/* ======================================================== */}
        {activeMainTab === "bookings" && (
          <div className="space-y-6 animate-in fade-in-50">
            {bookingActionMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bookingActionMsg}</span>
              </div>
            )}

            {/* Controls: Search Input + Status Tabs */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên bác sĩ, bệnh viện, mã phiếu hoặc tên người khám..."
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === "all"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Tất cả ({counts.all})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === "pending"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100/70 border border-amber-200/60"
                  }`}
                >
                  Chờ duyệt ({counts.pending})
                </button>
                <button
                  onClick={() => setStatusFilter("confirmed")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === "confirmed"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 border border-emerald-200/60"
                  }`}
                >
                  Đã xác nhận ({counts.confirmed})
                </button>
                <button
                  onClick={() => setStatusFilter("completed")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === "completed"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-purple-50 text-purple-800 hover:bg-purple-100/70 border border-purple-200/60"
                  }`}
                >
                  Đã hoàn thành ({counts.completed})
                </button>
                <button
                  onClick={() => setStatusFilter("cancelled")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === "cancelled"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-rose-50 text-rose-800 hover:bg-rose-100/70 border border-rose-200/60"
                  }`}
                >
                  Đã hủy ({counts.cancelled})
                </button>
              </div>
            </div>

            {/* Bookings List */}
            {loadingBookings ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Đang tải danh sách lịch khám...</p>
              </div>
            ) : displayedBookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base sm:text-lg">Không tìm thấy lịch hẹn phù hợp</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {searchQuery
                      ? `Không có kết quả nào khớp với từ khóa "${searchQuery}".`
                      : "Bạn chưa có lịch khám nào trong danh mục này."}
                  </p>
                </div>
                <Button asChild className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs">
                  <Link to="/doctors">
                    <Search className="w-4 h-4 mr-1.5" />
                    Khám phá Bác sĩ & Đặt lịch
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedBookings.map((b) => {
                  const canCancel = b.status === "pending" || b.status === "confirmed"
                  const doctorName = b.doctor?.name || b.doctor_name || "Bác sĩ chuyên khoa"
                  const hospitalName = b.hospital?.name || b.hospital_name || "Cơ sở Y tế MedSi"
                  const patientName = b.patient_profile?.full_name || b.patient_name || "Bệnh nhân"
                  const patientPhone = b.patient_profile?.phone || b.patient_phone || user?.phone || "—"
                  const relationship = b.patient_profile?.relationship || b.relationship || "Bản thân"
                  const workDate = b.slot?.work_date || b.work_date
                  const startTime = b.slot?.start_time || b.start_time || "08:00"
                  const endTime = b.slot?.end_time || b.end_time || "09:00"

                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm p-5 transition-all space-y-4"
                    >
                      {/* Top Bar: Code, Status & Date */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs sm:text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {b.code}
                          </span>
                          {getStatusBadge(b.status)}
                        </div>

                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Ngày tạo: {formatDateVN(b.created_at?.split("T")[0])}</span>
                        </div>
                      </div>

                      {/* Main Grid Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Col 1: Doctor / Hospital */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Bác sĩ / Cơ sở khám
                          </span>
                          <p className="font-bold text-slate-900 text-sm">
                            {doctorName}
                          </p>
                          <p className="text-sky-700 font-medium flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Chuyên khoa: {b.specialty_name || b.doctor?.specialty?.name || b.exam_type_name || "Đa khoa"}</span>
                          </p>
                          <p className="text-slate-500 text-[11px] flex items-center gap-1 truncate">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{hospitalName}</span>
                          </p>
                        </div>

                        {/* Col 2: Appointment Time & Patient */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Thời gian & Người đi khám
                          </span>
                          <div className="flex items-center gap-1.5 text-sky-700 font-bold">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{startTime} - {endTime}, ngày {formatDateVN(workDate)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold">{patientName}</span>
                            <span className="text-slate-400">({relationship})</span>
                          </div>
                          <p className="text-slate-500 text-[11px]">SĐT: {patientPhone}</p>
                        </div>

                        {/* Col 3: Fee & Payment */}
                        <div className="space-y-1.5 md:text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Tổng tiền & Thanh toán
                          </span>
                          <p className="text-base font-black text-sky-600">
                            {formatCurrency(b.payment?.total_amount || 420000)}
                          </p>
                          <div className="flex items-center md:justify-end gap-1.5">
                            <span className="text-[11px] text-slate-500">
                              {b.payment?.method === "cash" ? "Tại CSYT" : (b.payment?.method || "TIỀN MẶT").toUpperCase()}:
                            </span>
                            <Badge
                              variant={b.payment?.status === "paid" ? "success" : "warning"}
                              className="text-[10px] py-0"
                            >
                              {b.payment?.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Symptoms & Notes preview */}
                      {b.symptoms && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600">
                          <span className="font-bold text-slate-800">Triệu chứng: </span>
                          {b.symptoms}
                          {b.note && <span className="text-slate-500 ml-2">({b.note})</span>}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                        <div className="text-[11px] text-slate-400">
                          {b.status === "confirmed" && "✅ Vui lòng có mặt trước 15 phút tại quầy tiếp đón"}
                          {b.status === "pending" && "⏳ Đang chờ nhân viên y tế kiểm tra và xác nhận"}
                          {b.status === "completed" && "🎉 Ca khám đã hoàn tất thành công"}
                          {b.status === "cancelled" && "❌ Phiếu khám đã được hủy"}
                        </div>

                        <div className="flex items-center gap-2">
                          {canCancel && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCancellingBooking(b)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs h-8"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Hủy lịch hẹn
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="text-slate-600 hover:text-slate-900 text-xs h-8"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" />
                            In phiếu
                          </Button>

                          {b.status === "completed" && (
                            <Button asChild size="sm" className="bg-sky-600 text-white text-xs h-8">
                              <Link to={`/doctors/${b.doctor_id || 1}`}>
                                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                Đặt tái khám
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: QUẢN LÝ HỒ SƠ BỆNH NHÂN (CRUD)                     */}
        {/* ======================================================== */}
        {activeMainTab === "profiles" && (
          <div className="space-y-6 animate-in fade-in-50">
            {profileActionMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileActionMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Danh Sách Hồ Sơ Người Đi Khám</h2>
                <p className="text-xs text-slate-500">
                  Quản lý hồ sơ bản thân và người thân trong gia đình để thuận tiện khi đặt lịch hẹn.
                </p>
              </div>

              <Button
                onClick={handleOpenCreateProfile}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Hồ Sơ Mới</span>
              </Button>
            </div>

            {profiles.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                  <UserCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Chưa có hồ sơ bệnh nhân nào</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Hãy tạo hồ sơ đầu tiên để sẵn sàng cho các lần đặt lịch khám bệnh.
                  </p>
                </div>
                <Button onClick={handleOpenCreateProfile} className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Thêm hồ sơ ngay
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map((p) => {
                  const initials = p.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "BN"

                  const isSelf = p.relationship?.toLowerCase().includes("bản thân") || p.relationship === "self"

                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm p-5 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-sky-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-sky-500/20">
                              {initials}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm">{p.full_name}</h3>
                              <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                                {p.relationship || "Người thân"}
                              </span>
                            </div>
                          </div>

                          {isSelf && (
                            <Badge variant="success" className="text-[10px] py-0">
                              Chính chủ
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Ngày sinh:</span>
                            <span className="font-medium text-slate-800">{formatDateVN(p.dob?.split("T")[0])}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Giới tính:</span>
                            <span className="font-medium text-slate-800">
                              {p.gender === "male" ? "Nam" : p.gender === "female" ? "Nữ" : "Khác"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Số điện thoại:</span>
                            <span className="font-medium text-slate-800">{p.phone || "Chưa cập nhật"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Profile Card Actions */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditProfile(p)}
                          className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 border-sky-200 text-xs h-8"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          Sửa
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingProfile(p)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs h-8"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: THÔNG TIN TÀI KHOẢN (SỬA ĐƯỢC)                   */}
        {/* ======================================================== */}
        {activeMainTab === "account" && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in-50">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Thông Tin Tài Khoản MedSi</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cập nhật họ tên và thông tin liên hệ của chủ tài khoản.
                </p>
              </div>

              {accountSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{accountSuccessMsg}</span>
                </div>
              )}

              {accountErrorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{accountErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Địa chỉ Email (Định danh đăng nhập)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={accountForm.email}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-100/80 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400">Email được bảo mật và liên kết với tài khoản hệ thống.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    placeholder="Ví dụ: 0901234567"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    Vai trò: <strong className="text-slate-700">{user?.role === "admin" ? "Quản trị viên" : "Bệnh nhân"}</strong>
                  </span>

                  <Button
                    type="submit"
                    disabled={savingAccount}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm"
                  >
                    {savingAccount ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1.5" />
                        Lưu Thay Đổi
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: THÊM / SỬA HỒ SƠ BỆNH NHÂN (CRUD)                 */}
      {/* ======================================================== */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingProfile ? "Chỉnh Sửa Hồ Sơ Bệnh Nhân" : "Thêm Hồ Sơ Bệnh Nhân Mới"}
              </h3>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Họ và tên bệnh nhân <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Ngày sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={profileForm.dob}
                    onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Giới tính <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Số điện thoại</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="0901234567"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Mối quan hệ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={profileForm.relationship}
                    onChange={(e) => setProfileForm({ ...profileForm, relationship: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Bản thân">Bản thân</option>
                    <option value="Con trai">Con trai</option>
                    <option value="Con gái">Con gái</option>
                    <option value="Cha ruột">Cha ruột</option>
                    <option value="Mẹ ruột">Mẹ ruột</option>
                    <option value="Vợ chồng">Vợ chồng</option>
                    <option value="Người thân khác">Người thân khác</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProfileModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                >
                  {editingProfile ? "Cập Nhật Hồ Sơ" : "Tạo Hồ Sơ Mới"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: XÁC NHẬN XÓA HỒ SƠ BỆNH NHÂN                     */}
      {/* ======================================================== */}
      {deletingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Xóa Hồ Sơ Bệnh Nhân</h3>
                <p className="text-xs text-slate-500">{deletingProfile.full_name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn xóa hồ sơ của <strong>{deletingProfile.full_name}</strong> ({deletingProfile.relationship})? 
              Hành động này không thể hoàn tác.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingProfile(null)}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDeleteProfile}
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: XÁC NHẬN HỦY LỊCH HẸN (CANCEL BOOKING)            */}
      {/* ======================================================== */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Xác Nhận Hủy Lịch Hẹn</h3>
                <p className="text-xs text-slate-500">Mã phiếu: {cancellingBooking.code}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn hủy lịch khám với <strong>{cancellingBooking.doctor_name || cancellingBooking.doctor?.name || "Bác sĩ"}</strong> vào ngày <strong>{formatDateVN(cancellingBooking.work_date || cancellingBooking.slot?.work_date)}</strong>? Khung giờ này sẽ được giải phóng cho bệnh nhân khác.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Lý do hủy lịch:</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Có lịch bận đột xuất, đã hết triệu chứng..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancellingBooking(null)}
              >
                Không hủy
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmCancel}
              >
                Xác nhận hủy lịch
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: XÁC NHẬN ĐĂNG XUẤT                                */}
      {/* ======================================================== */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Đăng Xuất Tài Khoản</h3>
                <p className="text-xs text-slate-500">Phiên làm việc hiện tại</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản <strong>{user?.name}</strong> trên hệ thống MedSi?
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogoutModalOpen(false)}
              >
                Ở lại
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmLogout}
              >
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
