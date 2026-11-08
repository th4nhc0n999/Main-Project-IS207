import DoctorAvatar from '@/components/DoctorAvatar'
import { useState } from "react"
import { Link } from "react-router-dom"
import { 
  Database, 
  Layers, 
  Stethoscope, 
  Clock, 
  Building2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ArrowLeft 
} from "lucide-react"
import { 
  getStoredSpecialties, 
  saveSpecialties, 
  getStoredDoctors, 
  saveDoctors, 
  getStoredHospitals, 
  getStoredSlots, 
  saveSlots,
  formatCurrency,
  formatDateVN 
} from "@/lib/mockData"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState("specialties") // specialties | doctors | hospitals | slots

  const [specialties, setSpecialties] = useState(() => getStoredSpecialties())
  const [doctors, setDoctors] = useState(() => getStoredDoctors())
  const [hospitals] = useState(() => getStoredHospitals())
  const [slots, setSlots] = useState(() => getStoredSlots())

  // Modal states
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false)
  const [newSpecialty, setNewSpecialty] = useState({ name: "", description: "" })

  const [showDoctorModal, setShowDoctorModal] = useState(false)
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    title: "Bác sĩ Chuyên khoa I",
    specialty_id: 1,
    experience_years: 10,
    fee: 350000,
    city: "Hồ Chí Minh",
    address: "Phòng khám MedSi Quận 1",
    workplace: "Bệnh viện ĐHYD & MedSi Clinic",
    bio: "Bác sĩ có nhiều năm kinh nghiệm trong lĩnh vực khám và điều trị chuyên sâu.",
  })

  // Batch slot generator state
  const [slotGenData, setSlotGenData] = useState(() => ({
    owner_type: "doctor",
    doctor_id: 1,
    work_date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    start_time: "08:00",
    end_time: "09:00",
    capacity: 10,
    period: "morning",
  }))
  const [slotSuccessMsg, setSlotSuccessMsg] = useState("")

  // 1. ADD SPECIALTY
  const handleAddSpecialty = (e) => {
    e.preventDefault()
    if (!newSpecialty.name) return
    const created = {
      id: Date.now(),
      name: newSpecialty.name,
      description: newSpecialty.description || "Chuyên khoa khám và điều trị chuyên sâu",
      doctorCount: 0,
      image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&auto=format&fit=crop&q=80",
    }
    const updated = [...specialties, created]
    setSpecialties(updated)
    saveSpecialties(updated)
    setShowSpecialtyModal(false)
    setNewSpecialty({ name: "", description: "" })
  }

  // 2. DELETE SPECIALTY
  const handleDeleteSpecialty = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa chuyên khoa này?")) {
      const updated = specialties.filter(s => s.id !== id)
      setSpecialties(updated)
      saveSpecialties(updated)
    }
  }

  // 3. ADD DOCTOR
  const handleAddDoctor = (e) => {
    e.preventDefault()
    if (!newDoctor.name) return
    const targetSpec = specialties.find(s => s.id === Number(newDoctor.specialty_id))
    const created = {
      ...newDoctor,
      id: Date.now(),
      specialty_id: Number(newDoctor.specialty_id),
      specialty_name: targetSpec?.name || "Đa khoa",
      experience_years: Number(newDoctor.experience_years),
      fee: Number(newDoctor.fee),
      rating: 5.0,
      reviews_count: 0,
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
    }
    const updated = [created, ...doctors]
    setDoctors(updated)
    saveDoctors(updated)
    setShowDoctorModal(false)
  }

  // 4. DELETE DOCTOR
  const handleDeleteDoctor = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa hồ sơ bác sĩ này?")) {
      const updated = doctors.filter(d => d.id !== id)
      setDoctors(updated)
      saveDoctors(updated)
    }
  }

  // 5. GENERATE SLOT
  const handleGenerateSlot = (e) => {
    e.preventDefault()
    const newSlot = {
      id: Date.now(),
      owner_type: slotGenData.owner_type,
      owner_id: Number(slotGenData.doctor_id),
      work_date: slotGenData.work_date,
      start_time: slotGenData.start_time,
      end_time: slotGenData.end_time,
      period: slotGenData.period,
      capacity: Number(slotGenData.capacity),
      booked_count: 0,
      status: "available",
    }
    const updated = [newSlot, ...slots]
    setSlots(updated)
    saveSlots(updated)
    setSlotSuccessMsg(`Khởi tạo khung giờ ${slotGenData.start_time} - ${slotGenData.end_time} (${formatDateVN(slotGenData.work_date)}) thành công!`)
    setTimeout(() => setSlotSuccessMsg(""), 4000)
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Banner */}
      <div className="bg-sage-900 text-white py-8 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>Quản Trị Danh Mục & Dữ Liệu</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Quản Lý Danh Mục, Bác Sĩ & Khung Giờ (Catalog CRUD)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Cấu hình chuyên khoa, thêm bác sĩ mới, quản lý bệnh viện và tạo slots khám bệnh.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-white px-3 py-1.5 rounded-lg shadow-xs">
              <img src="/logo.png" alt="MedSi" className="h-8 w-auto object-contain" />
            </div>
            <Button asChild variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold">
              <Link to="/admin/bookings">
                <ArrowLeft className="w-4 h-4 mr-1.5 text-amber-400" />
                <span>Quay Lại Quản Lý Lịch Hẹn</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("specialties")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "specialties"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Layers className="w-4 h-4 text-sage-400" />
            <span>Chuyên Khoa ({specialties.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("doctors")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "doctors"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Stethoscope className="w-4 h-4 text-sage-400" />
            <span>Hồ Sơ Bác Sĩ ({doctors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("hospitals")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "hospitals"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Building2 className="w-4 h-4 text-sage-400" />
            <span>Bệnh Viện & Gói Khám ({hospitals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("slots")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "slots"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Clock className="w-4 h-4 text-sage-400" />
            <span>Khởi Tạo Khung Giờ (Slots)</span>
          </button>
        </div>

        {/* TAB 1: SPECIALTIES */}
        {activeTab === "specialties" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Danh Sách Chuyên Khoa</h2>
              <Button
                onClick={() => setShowSpecialtyModal(true)}
                size="sm"
                className="bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4 mr-1" />
                Thêm Chuyên Khoa Mới
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {specialties.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-sage-100 text-sage-600 flex items-center justify-center font-bold">
                        {s.name.substring(0, 2).toUpperCase()}
                      </div>
                      <Badge variant="info" className="text-[10px]">
                        {s.doctorCount || 0} Bác sĩ
                      </Badge>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{s.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSpecialty(s.id)}
                      className="h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DOCTORS */}
        {activeTab === "doctors" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Danh Sách Bác Sĩ Chuyên Khoa</h2>
              <Button
                onClick={() => setShowDoctorModal(true)}
                size="sm"
                className="bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4 mr-1" />
                Thêm Hồ Sơ Bác Sĩ Mới
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="p-4">Bác Sĩ</th>
                    <th className="p-4">Chuyên Khoa</th>
                    <th className="p-4">Khu Vực</th>
                    <th className="p-4">Giá Khám</th>
                    <th className="p-4">Kinh Nghiệm</th>
                    <th className="p-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <DoctorAvatar src={d.avatar} name={d.name}/>
                          <div>
                            <p className="font-bold text-slate-900">{d.name}</p>
                            <p className="text-[11px] text-slate-500">{d.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="info">{d.specialty_name}</Badge>
                      </td>
                      <td className="p-4 text-slate-600">{d.city}</td>
                      <td className="p-4 font-bold text-sage-600">{formatCurrency(d.fee)}</td>
                      <td className="p-4 text-slate-600">{d.experience_years} năm</td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDoctor(d.id)}
                          className="h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: HOSPITALS & EXAM TYPES */}
        {activeTab === "hospitals" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Bệnh Viện & Gói Khám Cung Cấp</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {hospitals.map((hosp) => (
                <div key={hosp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-start gap-4">
                    <img src={hosp.image} alt={hosp.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{hosp.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{hosp.address}</p>
                      <p className="text-xs text-sage-600 font-semibold mt-1">Hotline: {hosp.hotline}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-700 mb-2">Bảng giá dịch vụ khám:</p>
                    <div className="space-y-1.5">
                      {hosp.exam_types.map((e) => (
                        <div key={e.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50">
                          <span className="text-slate-700 font-medium">{e.name}</span>
                          <strong className="text-sage-600 font-bold">{formatCurrency(e.price)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SLOT GENERATOR */}
        {activeTab === "slots" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Slot Generator */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sage-600" />
                  <span>Tạo Khung Giờ Khám Mới (Slot Generator)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Khởi tạo khung giờ làm việc theo ca sáng/chiều và giới hạn sức chứa (capacity).
                </p>
              </div>

              {slotSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{slotSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleGenerateSlot} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Chọn Bác Sĩ đảm nhận</Label>
                  <select
                    value={slotGenData.doctor_id}
                    onChange={(e) => setSlotGenData({ ...slotGenData, doctor_id: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.specialty_name} ({d.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Ngày làm việc (work_date)</Label>
                    <Input
                      type="date"
                      required
                      value={slotGenData.work_date}
                      onChange={(e) => setSlotGenData({ ...slotGenData, work_date: e.target.value })}
                      className="h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Sức chứa tối đa (Capacity)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={slotGenData.capacity}
                      onChange={(e) => setSlotGenData({ ...slotGenData, capacity: e.target.value })}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Giờ bắt đầu (start_time)</Label>
                    <Input
                      type="time"
                      required
                      value={slotGenData.start_time}
                      onChange={(e) => setSlotGenData({ ...slotGenData, start_time: e.target.value })}
                      className="h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Giờ kết thúc (end_time)</Label>
                    <Input
                      type="time"
                      required
                      value={slotGenData.end_time}
                      onChange={(e) => setSlotGenData({ ...slotGenData, end_time: e.target.value })}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 bg-sage-600 hover:bg-sage-700 text-white font-bold text-xs mt-2">
                  <Plus className="w-4 h-4 mr-1" />
                  Khởi Tạo Khung Giờ Ngay
                </Button>
              </form>
            </div>

            {/* Slots Preview list */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
                Tổng quan khung giờ ({slots.length} slots hiện có)
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {slots.slice(0, 15).map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800">
                        {s.start_time} - {s.end_time}
                      </span>
                      <span className="text-slate-500 ml-2">({formatDateVN(s.work_date)})</span>
                    </div>
                    <Badge variant={s.status === "full" ? "danger" : "success"} className="text-[10px]">
                      {s.booked_count} / {s.capacity} chỗ ({s.status === "full" ? "Đầy" : "Còn trống"})
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD SPECIALTY */}
      {showSpecialtyModal && (
        <div className="med-dialog-overlay fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Thêm Chuyên Khoa Mới</h3>
            <form onSubmit={handleAddSpecialty} className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Tên chuyên khoa <span className="text-rose-500">*</span></Label>
                <Input
                  required
                  placeholder="Ví dụ: Nội Thần Kinh, Dị Ứng Miễn Dịch..."
                  value={newSpecialty.name}
                  onChange={(e) => setNewSpecialty({ ...newSpecialty, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mô tả tóm tắt</Label>
                <textarea
                  rows={3}
                  placeholder="Mô tả phạm vi khám và chẩn đoán..."
                  value={newSpecialty.description}
                  onChange={(e) => setNewSpecialty({ ...newSpecialty, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowSpecialtyModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" size="sm" className="bg-sage-600 text-white">
                  Thêm Chuyên Khoa
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DOCTOR */}
      {showDoctorModal && (
        <div className="med-dialog-overlay fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Thêm Hồ Sơ Bác Sĩ Mới</h3>
            <form onSubmit={handleAddDoctor} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Họ và tên <span className="text-rose-500">*</span></Label>
                  <Input
                    required
                    placeholder="BS. CKI Trần Văn X"
                    value={newDoctor.name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Học hàm / Học vị</Label>
                  <Input
                    value={newDoctor.title}
                    onChange={(e) => setNewDoctor({ ...newDoctor, title: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Chuyên khoa phụ trách</Label>
                  <select
                    value={newDoctor.specialty_id}
                    onChange={(e) => setNewDoctor({ ...newDoctor, specialty_id: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-xs"
                  >
                    {specialties.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Giá khám (VND)</Label>
                  <Input
                    type="number"
                    value={newDoctor.fee}
                    onChange={(e) => setNewDoctor({ ...newDoctor, fee: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Số năm kinh nghiệm</Label>
                  <Input
                    type="number"
                    value={newDoctor.experience_years}
                    onChange={(e) => setNewDoctor({ ...newDoctor, experience_years: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Khu vực / Thành phố</Label>
                  <select
                    value={newDoctor.city}
                    onChange={(e) => setNewDoctor({ ...newDoctor, city: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-xs"
                  >
                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Tiểu sử & Quá trình công tác</Label>
                <textarea
                  rows={2}
                  value={newDoctor.bio}
                  onChange={(e) => setNewDoctor({ ...newDoctor, bio: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDoctorModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" size="sm" className="bg-sage-600 text-white">
                  Lưu Bác Sĩ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
