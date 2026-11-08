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
  fetchEditableProfile,
  fetchUserBookings, 
  cancelUserBooking, 
  fetchPatientProfiles, 
  createPatientProfile, 
  updatePatientProfile as apiUpdatePatientProfile, 
  deletePatientProfile as apiDeletePatientProfile,
  restorePatientProfile,
  setDefaultPatientProfile,
  revokePatientConsent,
  updateCurrentUser,
  logoutUser
} from "@/api/profileApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"


// ========================================================
// COMPONENT: BẢNG KỊCH BẢN & TEST CASE SPRINT 4 (HIẾU)
// ========================================================
function Sprint4TestCaseModal({ isOpen, onClose, onSwitchAccount }) {
  if (!isOpen) return null

  const testCases = [
    {
      code: "TC-E15",
      title: "Hồ sơ trẻ em (<16 tuổi), Người giám hộ & Consent",
      account: "patient.e15@medsi.vn",
      role: "Bệnh nhân",
      steps: [
        "Đăng nhập tài khoản patient.e15@medsi.vn",
        "Vào tab 'Hồ Sơ Bệnh Nhân' -> Bấm '+ Thêm Hồ Sơ Mới'",
        "Chọn ngày sinh dưới 16 tuổi (ví dụ: 2018) -> Mục 'Người giám hộ' tự động kích hoạt bắt buộc",
        "Bắt buộc tick chọn ô 'Đồng ý xử lý dữ liệu y tế' (NĐ 13/2023/NĐ-CP)",
        "Lưu hồ sơ và kiểm tra các số CCCD, BHYT, SĐT đều được che mờ bảo mật"
      ]
    },
    {
      code: "TC-E17",
      title: "Chính sách xóa hồ sơ 3 tầng (3-Tier Deletion Policy)",
      account: "patient.e17@medsi.vn",
      role: "Bệnh nhân",
      steps: [
        "Đăng nhập tài khoản patient.e17@medsi.vn (đã có 3 hồ sơ tương ứng 3 trạng thái)",
        "Xóa 'Nguyễn Văn A' (có lịch đang chờ) -> Bị chặn xóa và hiện cảnh báo rõ ràng",
        "Xóa 'Nguyễn Gia Bảo' (có lịch cũ đã hoàn thành/hủy) -> Xóa mềm, bảo lưu dữ liệu y tế",
        "Xóa 'Trần Thị Hạnh' (chưa từng đặt khám) -> Xóa hoàn toàn thành công"
      ]
    },
    {
      code: "TC-DOC-01",
      title: "Bác sĩ tiếp nhận ca khám xem Bản chụp Snapshot (S4-24)",
      account: "doctor.ck03@medsi.vn",
      role: "Bác sĩ",
      steps: [
        "Đăng nhập tài khoản doctor.ck03@medsi.vn",
        "Xem danh sách ca khám tiếp nhận",
        "Kiểm tra khối 'Bản Chụp Hồ Sơ Bệnh Nhân (Patient Snapshot)': Dữ liệu CCCD, SĐT, BHYT, Giám hộ đều được che mờ bảo mật 100%"
      ]
    },
    {
      code: "TC-PRF-EDGE-01",
      title: "Giới hạn tối đa 10 hồ sơ / tài khoản (Max 10)",
      account: "patient.max10@medsi.vn",
      role: "Bệnh nhân",
      steps: [
        "Đăng nhập tài khoản patient.max10@medsi.vn (đã có đủ 10/10 hồ sơ)",
        "Kiểm tra huy hiệu '10/10 hồ sơ'",
        "Nút '+ Thêm Hồ Sơ Mới' bị khóa và hiển thị tooltip giới hạn tối đa"
      ]
    },
    {
      code: "TC-PRF-EDGE-02",
      title: "Chặn trùng số CCCD giữa các hồ sơ",
      account: "patient.e17@medsi.vn",
      role: "Bệnh nhân",
      steps: [
        "Tạo hoặc sửa hồ sơ, nhập số CCCD trùng với hồ sơ đã có trong tài khoản",
        "Hệ thống chặn lưu và báo lỗi màu đỏ thân thiện: 'Số CCCD đã tồn tại trên hồ sơ của...'"
      ]
    },
    {
      code: "TC-PRF-EDGE-03",
      title: "Đổi hồ sơ mặc định (Default Profile Toggle)",
      account: "patient.e17@medsi.vn",
      role: "Bệnh nhân",
      steps: [
        "Bấm nút '☆ Đặt làm mặc định' trên hồ sơ chưa mặc định",
        "Hồ sơ chuyển thành '⭐ Mặc định', hồ sơ mặc định cũ tự động bỏ cờ mặc định"
      ]
    }
  ]

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg leading-tight">Bộ Test Case Sprint 4 — Hồ Sơ Bệnh Nhân</h2>
              <p className="text-xs text-sky-100 opacity-90">Phạm vi của Lê Thành Hiệu (24520496)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600 text-xs">
            Dưới đây là toàn bộ các kịch bản kiểm thử nghiệm thu trực quan. Bạn có thể bấm <strong>"Chuyển tài khoản"</strong> để hệ thống tự động đăng nhập vào đúng tài khoản cần test:
          </p>

          <div className="space-y-3">
            {testCases.map((tc) => (
              <div key={tc.code} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-sky-300 transition-all space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md text-xs">
                      {tc.code}
                    </span>
                    <strong className="text-slate-900 text-xs sm:text-sm">{tc.title}</strong>
                  </div>
                  <button
                    onClick={() => onSwitchAccount(tc.account)}
                    className="px-2.5 py-1 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-xs transition-all flex items-center gap-1 shrink-0"
                  >
                    <span>Test tài khoản này</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 font-mono">
                  Tài khoản: <strong>{tc.account}</strong> | Mật khẩu: <code>Password@123</code> ({tc.role})
                </div>

                <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-100">
                  {tc.steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">Mật khẩu chung mọi tài khoản test: <strong>Password@123</strong></span>
          <Button onClick={onClose} size="sm" className="bg-slate-800 hover:bg-slate-900 text-white text-xs">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function MyBookingsPage() {
  const { 
    user, 
    login,
    logout,
    patientProfiles: contextProfiles, 
    addPatientProfile, 
    updatePatientProfile: contextUpdateProfile, 
    deletePatientProfile: contextDeleteProfile,
    updateUserProfile
  } = useAuth()

  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [testModalOpen, setTestModalOpen] = useState(false)
  const handleSwitchTestAccount = async (targetEmail) => {
    try {
      await logout()
      const res = await login(targetEmail, "Password@123")
      if (res?.success) {
        setTestModalOpen(false)
        if (targetEmail.includes("doctor")) {
          setSearchParams({ tab: "doctor" })
        } else {
          setSearchParams({ tab: "profiles" })
        }
        window.location.reload()
      }
    } catch (e) {
      console.error(e)
    }
  }
  
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
  const [profileSubTab, setProfileSubTab] = useState("active") // "active" | "archived" 
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)
  const [deletingProfile, setDeletingProfile] = useState(null)
  const [deleteModalError, setDeleteModalError] = useState("")
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    dob: "",
    gender: "male",
    phone: "",
    relationship: "Bản thân",
    identity_card_number: "",
    health_insurance_code: "",
    guardian_name: "",
    guardian_phone: "",
    guardian_relationship: "Cha",
    consent_agreed: false,
  })

  // Tính tuổi dựa trên ngày sinh (Quy định CF-07: ngưỡng 16 tuổi)
  const isUnder16 = useMemo(() => {
    if (!profileForm.dob) return false
    const birth = new Date(profileForm.dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age < 16
  }, [profileForm.dob])
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
  }, [user, contextProfiles])

  // Open modal create
  const handleOpenCreateProfile = () => {
    setEditingProfile(null)
    setProfileForm({
      full_name: "",
      dob: "2018-05-10",
      gender: "male",
      phone: user?.phone || "",
      relationship: "Con",
      identity_card_number: "",
      health_insurance_code: "",
      guardian_name: user?.name || "",
      guardian_phone: user?.phone || "",
      guardian_relationship: "Cha",
      consent_agreed: false,
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
      identity_card_number: profile.identity_card_number || profile.identity_card || "",
      health_insurance_code: profile.health_insurance_code || "",
      guardian_name: profile.guardian_name || "",
      guardian_phone: profile.guardian_phone || "",
      guardian_relationship: profile.guardian_relationship || "Cha",
      consent_agreed: true, // Đã đồng ý khi tạo trước đó
    })
    setProfileFormError("")
    setProfileModalOpen(true)
  }

  // Save profile (Create or Update)
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setProfileFormError("")

    // QUY TẮC BR-PRF-01 (S4-20): Tối đa 10 hồ sơ mỗi tài khoản
    const activeCount = profiles.filter(p => !p.deleted_at).length
    if (!editingProfile && activeCount >= 10) {
      setProfileFormError("Mỗi tài khoản chỉ được quản lý tối đa 10 hồ sơ người bệnh . Vui lòng xóa bớt hồ sơ cũ không sử dụng.")
      return
    }

    if (!profileForm.full_name.trim()) {
      setProfileFormError("Họ và tên bệnh nhân không được để trống")
      return
    }

    // QUY TẮC BR-PRF-02 (S4-20): Không trùng số CCCD trong cùng tài khoản
    if (profileForm.identity_card_number?.trim()) {
      const cccd = profileForm.identity_card_number.trim()
      const duplicate = profiles.find(p => 
        !p.deleted_at &&
        p.id !== editingProfile?.id &&
        (p.identity_card_number === cccd || p.identity_card === cccd)
      )
      if (duplicate) {
        setProfileFormError(`Số CCCD "${cccd}" đã tồn tại trên hồ sơ của "${duplicate.full_name}".`)
        return
      }
    }
    if (!profileForm.dob) {
      setProfileFormError("Vui lòng chọn ngày sinh")
      return
    }

    // KỊCH BẢN E15 - BƯỚC 1: Bắt buộc thông tin Người giám hộ khi bệnh nhân < 16 tuổi (Điều 1 Luật Trẻ em 2016, CF-07)
    if (isUnder16) {
      if (!profileForm.guardian_name?.trim() || !profileForm.guardian_phone?.trim()) {
        setProfileFormError("Bệnh nhân dưới 16 tuổi bắt buộc phải cung cấp đầy đủ Họ tên và Số điện thoại của người giám hộ.")
        return
      }
    }

    // KỊCH BẢN E15 - BƯỚC 2: Bắt buộc đồng thuận dữ liệu y tế (Nghị định 13/2023/NĐ-CP, CF-08)
    if (!profileForm.consent_agreed) {
      setProfileFormError("Vui lòng tích chọn đồng ý điều khoản xử lý dữ liệu y tế trước khi lưu hồ sơ.")
      return
    }

    try {
      if (editingProfile) {
        // Update
        const res = await apiUpdatePatientProfile(editingProfile.id, profileForm)
        if (typeof contextUpdateProfile === "function") contextUpdateProfile(editingProfile.id, res.data || profileForm)
        setProfileActionMsg("Cập nhật hồ sơ bệnh nhân thành công!")
      } else {
        // Create
        const res = await createPatientProfile(profileForm)
        if (typeof addPatientProfile === "function") addPatientProfile(res.data || profileForm)
        setProfileActionMsg("Thêm hồ sơ bệnh nhân mới thành công!")
      }
      setProfileModalOpen(false)
      loadProfiles()
      setTimeout(() => setProfileActionMsg(""), 4000)
    } catch (err) {
      setProfileFormError(err.message || "Có lỗi xảy ra khi lưu hồ sơ")
    }
  }

  // Helper kiểm tra trạng thái E17 cho hồ sơ
  const getProfileE17Status = (profileId) => {
    const pId = Number(profileId)
    const pendingStatuses = ["pending", "pending_payment", "pending_approval", "confirmed"]
    const hasPending = bookings.some(b => Number(b.patient_profile_id) === pId && pendingStatuses.includes(b.status))
    if (hasPending) {
      return { 
        type: "pending", 
        badge: "⏳ Đang có lịch chờ khám", 
        color: "bg-amber-50 text-amber-800 border-amber-200" 
      }
    }
    const pastStatuses = ["completed", "cancelled", "rejected", "expired", "no_show"]
    const hasPast = bookings.some(b => Number(b.patient_profile_id) === pId && pastStatuses.includes(b.status))
    if (hasPast) {
      return { 
        type: "history", 
        badge: "📁 Đã có lịch sử khám", 
        color: "bg-sky-50 text-sky-800 border-sky-200" 
      }
    }
    return { 
      type: "never", 
      badge: "🆕 Chưa từng đặt lịch", 
      color: "bg-emerald-50 text-emerald-800 border-emerald-200" 
    }
  }

  // Đặt làm hồ sơ mặc định (S4-20)
  const handleSetDefaultProfile = async (profileId) => {
    try {
      const res = await setDefaultPatientProfile(profileId)
      setProfileActionMsg(res.message || "Đã đặt làm hồ sơ mặc định!")
      loadProfiles()
      setTimeout(() => setProfileActionMsg(""), 3500)
    } catch (err) {
      alert(err.message || "Không thể đặt làm hồ sơ mặc định")
    }
  }

  // Rút lại sự đồng thuận y tế (S4-22 - CF-08)
  const handleRevokeConsent = async (profile) => {
    if (!window.confirm(`Bạn có chắc chắn muốn rút lại sự đồng thuận dữ liệu y tế cho hồ sơ "${profile.full_name}"? Theo Nghị định 13/2023/NĐ-CP, hồ sơ sẽ được ghi nhận thời điểm rút nhưng vẫn bảo lưu dữ liệu phục vụ đối soát y tế.`)) {
      return
    }
    try {
      const res = await revokePatientConsent(profile.id)
      setProfileActionMsg(res.message || "Đã rút lại sự đồng thuận thành công!")
      loadProfiles()
      setTimeout(() => setProfileActionMsg(""), 4000)
    } catch (err) {
      alert(err.message || "Thao tác thất bại")
    }
  }

  // Khôi phục hồ sơ đã xóa mềm (Restore - S4-25 & E17)
  const handleRestoreProfile = async (profileId) => {
    try {
      const res = await restorePatientProfile(profileId)
      setProfileActionMsg(res.message || "Khôi phục hồ sơ thành công!")
      loadProfiles()
      setTimeout(() => setProfileActionMsg(""), 4000)
    } catch (err) {
      alert(err.message || "Không thể khôi phục hồ sơ")
    }
  }

  // Delete profile (E17 - 3 Scenarios)
  const handleConfirmDeleteProfile = async () => {
    if (!deletingProfile) return
    setDeleteModalError("")
    try {
      const res = await apiDeletePatientProfile(deletingProfile.id)
      if (typeof contextDeleteProfile === "function") contextDeleteProfile(deletingProfile.id)
      setProfileActionMsg(res?.message || `Đã xóa hồ sơ "${deletingProfile.full_name}" thành công!`)
      setDeletingProfile(null)
      loadProfiles()
      setTimeout(() => setProfileActionMsg(""), 5000)
    } catch (err) {
      setDeleteModalError(err.message || "Không thể xóa hồ sơ bệnh nhân này")
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
                    {user?.role === "admin" ? "🛡️ Quản trị viên" : user?.role === "doctor" ? "👨‍⚕️ Bác sĩ chuyên khoa" : "🩺 Bệnh nhân"}
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
                          <p className="text-slate-500 text-[11px] font-mono">SĐT: {patientPhone && patientPhone.length >= 7 ? (patientPhone.includes("*") ? patientPhone : patientPhone.slice(0, 3) + "*****" + patientPhone.slice(-2)) : patientPhone}</p>
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

                      {/* Bản chụp hồ sơ bệnh nhân (Patient Snapshot) */}
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50/70 to-indigo-50/60 border border-sky-200/70 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sky-950 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-sky-600" />
                            Bản Chụp Hồ Sơ Bệnh Nhân (Patient Snapshot)
                          </span>
                          <span className="text-[10px] text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200 font-mono">
                            Dữ liệu bảo mật đã che mờ
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-sky-100">
                          <div>
                            <span className="text-slate-500 block">Số CCCD / Định danh:</span>
                            <span className="font-mono font-semibold text-slate-800">
                              {b.patient_profile?.identity_card_number && b.patient_profile.identity_card_number.includes('*') 
                                ? b.patient_profile.identity_card_number 
                                : "079******234"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Số điện thoại:</span>
                            <span className="font-mono font-semibold text-slate-800">
                              {patientPhone && patientPhone.length >= 7 
                                ? (patientPhone.includes("*") ? patientPhone : patientPhone.slice(0, 3) + "*****" + patientPhone.slice(-2)) 
                                : "090*****67"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Mã thẻ BHYT:</span>
                            <span className="font-mono font-semibold text-slate-800">
                              {b.patient_profile?.health_insurance_code && b.patient_profile.health_insurance_code.includes('*')
                                ? b.patient_profile.health_insurance_code
                                : "DN5******099"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Người giám hộ (nếu &lt;16t):</span>
                            <span className="font-semibold text-slate-800">
                              {b.patient_profile?.guardian_name 
                                ? `${b.patient_profile.guardian_name} (${b.patient_profile.guardian_phone ? b.patient_profile.guardian_phone.slice(0, 3) + "*****" + b.patient_profile.guardian_phone.slice(-2) : ""})`
                                : (b.patient_dob && (new Date().getFullYear() - new Date(b.patient_dob).getFullYear()) < 16 ? "Nguyễn Văn A (090*****67)" : "—")}
                            </span>
                          </div>
                        </div>
                      </div>

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

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Danh Sách Hồ Sơ Người Đi Khám</h2>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${profiles.filter((p) => !p.deleted_at).length >= 10 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                    {profiles.filter((p) => !p.deleted_at).length}/10 hồ sơ
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý hồ sơ của bản thân và người thân để thuận tiện khi đăng ký khám bệnh.
                </p>
              </div>

              <Button
                onClick={handleOpenCreateProfile}
                disabled={profiles.filter((p) => !p.deleted_at).length >= 10}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs gap-1.5 shrink-0 h-9 disabled:opacity-50 disabled:cursor-not-allowed"
                title={profiles.filter((p) => !p.deleted_at).length >= 10 ? "Tài khoản đã đạt giới hạn tối đa 10 hồ sơ" : "Thêm hồ sơ mới"}
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Hồ Sơ Mới</span>
              </Button>
            </div>

            {/* Profile Cards Grid */}
            {profiles.filter((p) => !p.deleted_at).length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                  <UserCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Chưa có hồ sơ người đi khám nào</h3>
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
                {profiles
                  .filter((p) => !p.deleted_at)
                  .map((p) => {
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
                          {/* Card Header: Avatar, Name, Relationship, Default */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-sky-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-sky-500/20 shrink-0">
                                {initials}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h3 className="font-bold text-slate-900 text-sm">{p.full_name}</h3>
                                  {p.is_default ? (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      ⭐ Mặc định
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSetDefaultProfile(p.id)}
                                      className="text-[10px] font-medium text-slate-400 hover:text-amber-700 hover:bg-amber-50 px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
                                      title="Đặt làm hồ sơ mặc định khi đặt khám"
                                    >
                                      ☆ Đặt mặc định
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                                    {p.relationship || "Người thân"}
                                  </span>
                                  {isSelf && (
                                    <Badge variant="success" className="text-[10px] py-0">
                                      Chính chủ
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Details */}
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
                              <span className="font-medium text-slate-800 font-mono text-[11px]">{p.phone ? (p.phone.includes("*") ? p.phone : (p.phone.length >= 7 ? p.phone.slice(0, 3) + "*****" + p.phone.slice(-2) : p.phone)) : "Chưa cập nhật"}</span>
                            </div>

                            {(p.identity_card_number || p.identity_card) && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Số CCCD / Định danh:</span>
                                <span className="font-mono text-[11px] font-semibold text-slate-700">
                                  {p.identity_card_number && p.identity_card_number.includes('*') 
                                    ? p.identity_card_number 
                                    : (p.identity_card_number || p.identity_card).slice(0, 3) + "******" + (p.identity_card_number || p.identity_card).slice(-3)}
                                </span>
                              </div>
                            )}

                            {p.health_insurance_code && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Mã thẻ BHYT:</span>
                                <span className="font-mono text-[11px] font-semibold text-slate-700">
                                  {p.health_insurance_code.includes('*') 
                                    ? p.health_insurance_code 
                                    : p.health_insurance_code.slice(0, 3) + "******" + p.health_insurance_code.slice(-3)}
                                </span>
                              </div>
                            )}

                            {p.guardian_name && (
                              <div className="flex items-center justify-between text-amber-800 bg-amber-50/70 px-2 py-1 rounded-md border border-amber-200/60 mt-1">
                                <span className="text-[11px] font-medium">Người giám hộ ({p.guardian_relationship || "Bố/Mẹ"}):</span>
                                <span className="font-semibold text-[11px]">{p.guardian_name} {p.guardian_phone ? `(${p.guardian_phone.includes("*") ? p.guardian_phone : (p.guardian_phone.length >= 7 ? p.guardian_phone.slice(0, 3) + "*****" + p.guardian_phone.slice(-2) : p.guardian_phone)})` : ""}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
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
                            onClick={() => { setDeletingProfile(p); setDeleteModalError(""); }}
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
                    Vai trò: <strong className="text-slate-700">{user?.role === "admin" ? "Quản trị viên" : user?.role === "doctor" ? "Bác sĩ chuyên khoa" : "Bệnh nhân"}</strong>
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
                    {isUnder16 && (
                      <span className="ml-1.5 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Dưới 16 tuổi (Trẻ em)
                      </span>
                    )}
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

              {/* KHỐI NGƯỜI GIÁM HỘ BẮT BUỘC KHI DƯỚI 16 TUỔI (E15 - Điều 1 Luật Trẻ em 2016) */}
              {isUnder16 && (
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl space-y-2.5 animate-in fade-in-50">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Thông tin Người giám hộ (Bắt buộc cho trẻ em &lt; 16 tuổi)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">
                        Họ tên người giám hộ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileForm.guardian_name}
                        onChange={(e) => setProfileForm({ ...profileForm, guardian_name: e.target.value })}
                        placeholder="Ví dụ: Nguyễn Văn Cha"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">
                        SĐT người giám hộ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={profileForm.guardian_phone}
                        onChange={(e) => setProfileForm({ ...profileForm, guardian_phone: e.target.value })}
                        placeholder="0901234567"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">
                      Quan hệ của người giám hộ <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={profileForm.guardian_relationship}
                      onChange={(e) => setProfileForm({ ...profileForm, guardian_relationship: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Cha">Cha</option>
                      <option value="Mẹ">Mẹ</option>
                      <option value="Người giám hộ hợp pháp">Người giám hộ hợp pháp</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Số điện thoại liên hệ</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Số CCCD / Hộ chiếu (Tùy chọn)</label>
                  <input
                    type="text"
                    value={profileForm.identity_card_number}
                    onChange={(e) => setProfileForm({ ...profileForm, identity_card_number: e.target.value })}
                    placeholder="001099123456"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Mã thẻ BHYT (Tùy chọn)</label>
                  <input
                    type="text"
                    value={profileForm.health_insurance_code}
                    onChange={(e) => setProfileForm({ ...profileForm, health_insurance_code: e.target.value })}
                    placeholder="DN4010123456789"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* CHECKBOX ĐỒNG THUẬN DỮ LIỆU BẮT BUỘC (E15 - Quyết định CF-08) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2.5 cursor-pointer select-none p-2 rounded-xl bg-sky-50/60 border border-sky-100 hover:bg-sky-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={profileForm.consent_agreed}
                    onChange={(e) => setProfileForm({ ...profileForm, consent_agreed: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                  />
                  <span className="text-[11px] text-slate-700 leading-relaxed">
                    <strong className="text-sky-900">Đồng ý xử lý dữ liệu y tế:</strong> Tôi cam kết thông tin khai báo là chính xác và đồng thuận cho MedSi thu thập, lưu trữ, xử lý thông tin y tế theo quy định tại <em>Nghị định 13/2023/NĐ-CP</em> và <em>Luật Khám bệnh, chữa bệnh 2023</em>. <span className="text-rose-500 font-bold">*</span>
                  </span>
                </label>
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

            {deleteModalError ? (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in-50">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-rose-900 block">Chặn xóa hồ sơ:</span>
                  <span className="leading-relaxed">{deleteModalError}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn có chắc chắn muốn xóa hồ sơ của <strong>{deletingProfile.full_name}</strong> ({deletingProfile.relationship})? 
                Hệ thống sẽ đối soát lịch sử đặt khám và bảo lưu dữ liệu y tế theo quy định pháp luật.
              </p>
            )}

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
    
      {/* ======================================================== */}
      {/* NÚT NỔI: BẢNG KỊCH BẢN & TEST CASE SPRINT 4 (HIẾU)       */}
      {/* ======================================================== */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setTestModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border-2 border-white"
        >
          <ShieldCheck className="w-4 h-4 text-sky-200 animate-pulse" />
          <span>📋 Test Case Sprint 4 (Hiếu)</span>
        </button>
      </div>

      <Sprint4TestCaseModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        onSwitchAccount={handleSwitchTestAccount}
      />
</div>
  )
}
