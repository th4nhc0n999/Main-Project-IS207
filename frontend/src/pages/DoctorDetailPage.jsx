import { useState, useMemo } from "react"
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom"
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Award, 
  CheckCircle2, 
  Clock, 
  Calendar as CalendarIcon, 
  Stethoscope, 
  ChevronRight,
  Info,
  Navigation
} from "lucide-react"
import { 
  getStoredDoctors, 
  getStoredSlots, 
  getStoredHospitals, 
  formatCurrency, 
  formatDateVN 
} from "@/lib/mockData"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DoctorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hospitalId = searchParams.get("hospitalId")

  const doctors = useMemo(() => getStoredDoctors(), [])
  const allSlots = useMemo(() => getStoredSlots(), [])
  const hospitals = useMemo(() => getStoredHospitals(), [])

  // Find doctor or fallback to first doctor
  const doctor = useMemo(() => {
    const found = doctors.find((d) => d.id === Number(id))
    return found || doctors[0]
  }, [doctors, id])

  const hospital = useMemo(() => {
    if (hospitalId) {
      return hospitals.find(h => h.id === Number(hospitalId))
    }
    return null
  }, [hospitals, hospitalId])

  // Get list of next 7 dates
  const next7Days = useMemo(() => {
    const dates = []
    const today = new Date()
    const daysOfWeek = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      const label = i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : daysOfWeek[d.getDay()]
      const formatted = `${d.getDate()}/${d.getMonth() + 1}`

      dates.push({
        dateStr,
        label,
        formatted,
        dayName: daysOfWeek[d.getDay()],
      })
    }
    return dates
  }, [])

  const [selectedDate, setSelectedDate] = useState(next7Days[0].dateStr)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedExamType] = useState(
    hospital ? hospital.exam_types[0] : null
  )

  // Filter slots for this doctor/hospital on selected date
  const daySlots = useMemo(() => {
    return allSlots.filter((s) => {
      if (hospitalId) {
        return s.owner_type === "hospital" && s.owner_id === Number(hospitalId) && s.work_date === selectedDate
      }
      return s.owner_type === "doctor" && s.owner_id === doctor.id && s.work_date === selectedDate
    })
  }, [allSlots, doctor.id, hospitalId, selectedDate])

  const morningSlots = daySlots.filter((s) => s.period === "morning" || s.start_time < "12:00")
  const afternoonSlots = daySlots.filter((s) => s.period === "afternoon" || s.start_time >= "12:00")

  // Helper to check if a slot has already passed in real-time (Fix BUG-BOOKING-01)
  const isPastSlot = (slot) => {
    if (!slot || !slot.work_date || !slot.start_time) return false

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const todayStr = `${year}-${month}-${day}`
    const todayIso = now.toISOString().split("T")[0]

    // If slot date is in the past
    if (slot.work_date < todayStr && slot.work_date < todayIso) {
      return true
    }

    // If slot date is today, compare start_time with current time (HH:mm)
    if (slot.work_date === todayStr || slot.work_date === todayIso) {
      const currentHours = String(now.getHours()).padStart(2, "0")
      const currentMinutes = String(now.getMinutes()).padStart(2, "0")
      const currentTime = `${currentHours}:${currentMinutes}`
      return slot.start_time <= currentTime
    }

    return false
  }

  // Handle Proceed to Booking
  const handleProceedToBooking = () => {
    if (!selectedSlot) return

    if (isPastSlot(selectedSlot)) {
      alert("Khung giờ khám đã qua hạn đặt. Vui lòng chọn khung giờ khác.")
      setSelectedSlot(null)
      return
    }

    // Save selected booking context in sessionStorage or state
    const bookingContext = {
      booking_type: hospitalId ? "hospital" : "doctor",
      doctor_id: doctor.id,
      doctor_name: doctor.name,
      doctor_title: doctor.title,
      specialty_name: doctor.specialty_name,
      hospital_id: hospital ? hospital.id : null,
      hospital_name: hospital ? hospital.name : doctor.workplace,
      exam_type_id: selectedExamType ? selectedExamType.id : null,
      exam_type_name: selectedExamType ? selectedExamType.name : "Khám chuyên khoa",
      slot_id: selectedSlot.id,
      work_date: selectedSlot.work_date,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      exam_fee: selectedExamType ? selectedExamType.price : doctor.fee,
      service_fee: 20000,
    }
    sessionStorage.setItem("medsi_pending_booking", JSON.stringify(bookingContext))
    navigate("/booking/confirm")
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Back Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link
            to="/doctors"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-sky-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Quay lại danh sách {hospitalId ? "phòng khám" : "bác sĩ"}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Doctor / Hospital Information */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="relative shrink-0 mx-auto sm:mx-0">
                  <img
                    src={doctor.avatar}
                    alt={doctor.name}
                    className="w-28 h-28 rounded-2xl object-cover border-2 border-slate-100 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <Badge variant="info" className="font-semibold text-xs">
                      {doctor.specialty_name}
                    </Badge>
                    <Badge variant="secondary" className="text-slate-600 text-xs">
                      📍 {doctor.city}
                    </Badge>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {doctor.name}
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-500">
                    {doctor.title}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs">
                    <div className="flex items-center text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                      <span>{doctor.rating}</span>
                      <span className="text-slate-400 font-normal ml-1">({doctor.reviews_count} đánh giá)</span>
                    </div>
                    <div className="flex items-center text-slate-600 font-medium">
                      <Award className="w-4 h-4 text-sky-600 mr-1" />
                      <span>{doctor.experience_years} năm kinh nghiệm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultation Fee & Location box */}
              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100">
                  <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider block">
                    Giá khám niêm yết
                  </span>
                  <div className="text-lg font-extrabold text-sky-700 mt-0.5">
                    {formatCurrency(doctor.fee)}
                  </div>
                  <span className="text-[10px] text-sky-600">Đã bao gồm phí tư vấn chuyên gia</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Nơi công tác & Khám bệnh
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                      {doctor.workplace}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {doctor.address}
                    </p>
                  </div>
                  {doctor.lat && doctor.lng && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Đã xác thực tọa độ GPS
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${doctor.lat},${doctor.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 hover:underline"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Chỉ đường</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Biography & Achievements Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-sky-600" />
                <span>Tiểu sử & Quá trình đào tạo</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {doctor.bio}
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Quy trình thăm khám:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Khám lâm sàng, đo chỉ số sinh hiệu và hỏi tiền sử bệnh lý.</li>
                  <li>Chỉ định xét nghiệm/chẩn đoán hình ảnh chuyên sâu khi cần thiết.</li>
                  <li>Kê đơn thuốc điều trị và tư vấn chế độ dinh dưỡng, sinh hoạt.</li>
                  <li>Hẹn tái khám và hướng dẫn theo dõi phản ứng sau khám.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Slot Booking System */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-sky-600" />
                  <span>Chọn Lịch Khám</span>
                </h2>
                <span className="text-xs text-slate-400 font-medium">Bảo mật & Chuẩn xác</span>
              </div>

              {/* Date Selection Carousel / Tabs */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  1. Chọn ngày khám
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {next7Days.map((item) => {
                    const isSelected = selectedDate === item.dateStr
                    return (
                      <button
                        key={item.dateStr}
                        type="button"
                        onClick={() => {
                          setSelectedDate(item.dateStr)
                          setSelectedSlot(null)
                        }}
                        className={`p-2 rounded-xl text-center transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? "bg-sky-600 text-white font-bold shadow-md shadow-sky-600/20 scale-105"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <span className="text-[10px] block leading-tight">{item.label}</span>
                        <span className="text-xs font-bold mt-0.5">{item.formatted}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Slots Selection Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    2. Chọn khung giờ (Slot)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Ngày: <strong>{formatDateVN(selectedDate)}</strong>
                  </span>
                </div>

                {/* Morning Slots */}
                <div>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Ca Sáng (08:00 - 11:00)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {morningSlots.map((slot) => {
                      const isPast = isPastSlot(slot)
                      const isFull = slot.status === "full" || slot.booked_count >= slot.capacity
                      const isDisabled = isPast || isFull
                      const isSelected = selectedSlot?.id === slot.id
                      const remaining = slot.capacity - slot.booked_count

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl border text-center transition-all text-xs relative ${
                            isPast
                              ? "bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed select-none"
                              : isFull
                              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                              : isSelected
                              ? "bg-sky-50 border-sky-600 text-sky-700 font-bold ring-2 ring-sky-500/20"
                              : "bg-white border-slate-200 text-slate-800 hover:border-sky-300 hover:bg-sky-50/40"
                          }`}
                        >
                          <div className={`font-semibold ${isPast ? "text-slate-400" : ""}`}>
                            {slot.start_time} - {slot.end_time}
                          </div>
                          <div className="text-[10px] mt-0.5">
                            {isPast ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-200 text-slate-500">
                                Đã qua giờ
                              </span>
                            ) : isFull ? (
                              <span className="text-rose-500 font-medium">Hết chỗ</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">Còn {remaining} chỗ</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Afternoon Slots */}
                <div>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-2">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    Ca Chiều (13:30 - 16:30)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {afternoonSlots.map((slot) => {
                      const isPast = isPastSlot(slot)
                      const isFull = slot.status === "full" || slot.booked_count >= slot.capacity
                      const isDisabled = isPast || isFull
                      const isSelected = selectedSlot?.id === slot.id
                      const remaining = slot.capacity - slot.booked_count

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl border text-center transition-all text-xs relative ${
                            isPast
                              ? "bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed select-none"
                              : isFull
                              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                              : isSelected
                              ? "bg-sky-50 border-sky-600 text-sky-700 font-bold ring-2 ring-sky-500/20"
                              : "bg-white border-slate-200 text-slate-800 hover:border-sky-300 hover:bg-sky-50/40"
                          }`}
                        >
                          <div className={`font-semibold ${isPast ? "text-slate-400" : ""}`}>
                            {slot.start_time} - {slot.end_time}
                          </div>
                          <div className="text-[10px] mt-0.5">
                            {isPast ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-200 text-slate-500">
                                Đã qua giờ
                              </span>
                            ) : isFull ? (
                              <span className="text-rose-500 font-medium">Hết chỗ</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">Còn {remaining} chỗ</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Selected Slot Summary Box */}
              {selectedSlot ? (
                <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200 space-y-2 animate-in fade-in-50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Khung giờ đã chọn:</span>
                    <strong className="text-sky-800 font-bold">
                      {selectedSlot.start_time} — {selectedSlot.end_time} ({formatDateVN(selectedSlot.work_date)})
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Phí khám tạm tính:</span>
                    <strong className="text-slate-900 font-bold">
                      {formatCurrency(doctor.fee)}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Vui lòng chọn 1 khung giờ khám còn trống để tiếp tục.</span>
                </div>
              )}

              {/* CTA Button */}
              <Button
                type="button"
                onClick={handleProceedToBooking}
                disabled={!selectedSlot}
                className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-lg shadow-sky-600/20 text-sm transition-all"
              >
                <span>Tiến hành xác nhận đặt hẹn</span>
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>

              <p className="text-[11px] text-center text-slate-400">
                ⚡ Giữ chỗ tức thì — Cơ chế chống đặt trùng (Race Condition Safe)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
