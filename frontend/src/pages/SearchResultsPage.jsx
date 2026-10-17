import { useState, useMemo, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { 
  Search, 
  MapPin, 
  Stethoscope, 
  Building2, 
  Star, 
  ChevronRight, 
  Award, 
  Phone,
  CheckCircle2,
  Calendar,
  Navigation,
  Compass,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
  MapPinOff,
  Crosshair,
  Info
} from "lucide-react"
import { 
  getStoredDoctors, 
  getStoredSpecialties, 
  getStoredHospitals,
  formatCurrency 
} from "@/lib/mockData"
import { 
  calculateHaversineDistance, 
  formatDistance, 
  estimateTravelTime,
  POPULAR_DISTRICTS,
  RADIUS_OPTIONS,
  getBrowserGeolocation
} from "@/lib/geoUtils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogContent, 
  DialogFooter 
} from "@/components/ui/dialog"

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const isClinic = searchParams.get("type") === "hospital"
  const nearParam = searchParams.get("near") === "true"

  const doctors = useMemo(() => getStoredDoctors(), [])
  const specialties = useMemo(() => getStoredSpecialties(), [])
  const hospitals = useMemo(() => getStoredHospitals(), [])

  // Standard filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get("specialty") || "all")
  const [selectedCity, setSelectedCity] = useState("all")

  // ==========================================
  // GPS & NEAR-ME STATE (ACT-UI-01, BR-UI-08..10)
  // ==========================================
  const [isNearMeActive, setIsNearMeActive] = useState(nearParam)
  const [selectedRadius, setSelectedRadius] = useState(Number(searchParams.get("radius")) || 5) // Mặc định 5km
  const [userLocation, setUserLocation] = useState(null) // { lat, lng, name, type: 'gps' | 'district' }
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState(null)
  
  // Fallback Modal (EX-UI-01)
  const [showFallbackModal, setShowFallbackModal] = useState(false)
  const [selectedFallbackDistrict, setSelectedFallbackDistrict] = useState("q1")

  // Kích hoạt Geolocation khi bấm nút hoặc có param ?near=true
  const requestLocation = async (manualFallback = false) => {
    if (manualFallback) {
      setShowFallbackModal(true)
      return
    }

    setIsLocating(true)
    setLocationError(null)

    const geoResult = await getBrowserGeolocation()

    if (geoResult.success) {
      setUserLocation({
        lat: geoResult.lat,
        lng: geoResult.lng,
        name: "Vị trí GPS của bạn (Tự động)",
        type: "gps",
      })
      setIsNearMeActive(true)
      setIsLocating(false)
    } else {
      // EX-UI-01: Quyền bị từ chối hoặc lỗi GPS -> Bật Fallback chọn Quận/Huyện thủ công
      setLocationError(geoResult.error || "Không thể lấy vị trí GPS tự động")
      setIsLocating(false)
      setShowFallbackModal(true)
    }
  }

  // Tự động kích hoạt khi có query ?near=true trên URL
  useEffect(() => {
    if (nearParam && !userLocation && !isLocating) {
      requestLocation()
    }
  }, [nearParam])

  // Xử lý xác nhận chọn Quận/Huyện thủ công (Fallback EX-UI-01)
  const handleApplyDistrictFallback = () => {
    const district = POPULAR_DISTRICTS.find((d) => d.id === selectedFallbackDistrict) || POPULAR_DISTRICTS[0]
    setUserLocation({
      lat: district.lat,
      lng: district.lng,
      name: district.name,
      type: "district",
    })
    setIsNearMeActive(true)
    setShowFallbackModal(false)
  }

  // Tắt tính năng Near-me
  const handleDisableNearMe = () => {
    setIsNearMeActive(false)
    const newParams = new URLSearchParams(searchParams)
    newParams.delete("near")
    newParams.delete("radius")
    setSearchParams(newParams)
  }

  // Tính toán khoảng cách và lọc danh sách Bác sĩ
  const processedDoctors = useMemo(() => {
    // 1. Gắn khoảng cách Haversine nếu có tọa độ người dùng
    const listWithDistance = doctors.map((doc) => {
      let distanceKm = null
      let distanceStr = ""
      let travelTime = ""

      if (userLocation && doc.lat != null && doc.lng != null) {
        distanceKm = calculateHaversineDistance(userLocation.lat, userLocation.lng, doc.lat, doc.lng)
        distanceStr = formatDistance(distanceKm)
        travelTime = estimateTravelTime(distanceKm)
      }

      return {
        ...doc,
        distanceKm,
        distanceStr,
        travelTime,
      }
    })

    // 2. Lọc theo từ khóa, chuyên khoa, thành phố
    let filtered = listWithDistance.filter((doc) => {
      const matchSearch = 
        !searchTerm || 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialty_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.address.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchSpecialty = 
        selectedSpecialty === "all" || 
        doc.specialty_name === selectedSpecialty ||
        doc.specialty_id === Number(selectedSpecialty)

      const matchCity = 
        selectedCity === "all" || 
        doc.city.toLowerCase().includes(selectedCity.toLowerCase())

      return matchSearch && matchSpecialty && matchCity
    })

    // 3. Nếu bật Near-me: Lọc theo bán kính và sắp xếp tăng dần cự ly (BR-UI-08, BR-UI-10)
    if (isNearMeActive && userLocation) {
      filtered = filtered.filter((doc) => {
        if (doc.distanceKm == null) return false
        return doc.distanceKm <= selectedRadius
      })

      // Sắp xếp tăng dần theo khoảng cách (gần nhất lên đầu)
      filtered.sort((a, b) => a.distanceKm - b.distanceKm)
    }

    return filtered
  }, [doctors, searchTerm, selectedSpecialty, selectedCity, isNearMeActive, userLocation, selectedRadius])

  // Tính toán khoảng cách và lọc danh sách Bệnh viện / Phòng khám
  const processedHospitals = useMemo(() => {
    const listWithDistance = hospitals.map((hosp) => {
      let distanceKm = null
      let distanceStr = ""
      let travelTime = ""

      if (userLocation && hosp.lat != null && hosp.lng != null) {
        distanceKm = calculateHaversineDistance(userLocation.lat, userLocation.lng, hosp.lat, hosp.lng)
        distanceStr = formatDistance(distanceKm)
        travelTime = estimateTravelTime(distanceKm)
      }

      return {
        ...hosp,
        distanceKm,
        distanceStr,
        travelTime,
      }
    })

    let filtered = listWithDistance.filter((hosp) => {
      const matchSearch = 
        !searchTerm || 
        hosp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hosp.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hosp.exam_types.some((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchCity = 
        selectedCity === "all" || 
        hosp.city.toLowerCase().includes(selectedCity.toLowerCase())

      return matchSearch && matchCity
    })

    if (isNearMeActive && userLocation) {
      filtered = filtered.filter((hosp) => {
        if (hosp.distanceKm == null) return false
        return hosp.distanceKm <= selectedRadius
      })
      filtered.sort((a, b) => a.distanceKm - b.distanceKm)
    }

    return filtered
  }, [hospitals, searchTerm, selectedCity, isNearMeActive, userLocation, selectedRadius])

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-900 text-white py-10 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-sky-100 text-xs font-semibold mb-2">
                {isClinic ? <Building2 className="w-3.5 h-3.5" /> : <Stethoscope className="w-3.5 h-3.5" />}
                {isClinic ? "Mạng lưới Bệnh viện & Phòng khám" : "Danh mục Bác sĩ chuyên khoa"}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {isClinic ? "Tra cứu Phòng Khám & Bệnh Viện Uy Tín" : "Tìm & Đặt Khám Bác Sĩ Chuyên Khoa"}
              </h1>
              <p className="text-sm text-sky-100 mt-1 max-w-2xl">
                Định vị thông minh theo công thức Haversine mặt cầu chuẩn WGS84, tìm bác sĩ giỏi gần bạn nhất chỉ với 1 chạm.
              </p>
            </div>

            {/* View Switcher Pill */}
            <div className="flex items-center bg-black/25 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-sm">
              <button
                type="button"
                onClick={() => setSearchParams({ type: "doctor" })}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  !isClinic ? "bg-white text-sky-800 shadow" : "text-sky-100 hover:text-white"
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Bác Sĩ</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchParams({ type: "hospital" })}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  isClinic ? "bg-white text-sky-800 shadow" : "text-sky-100 hover:text-white"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Phòng Khám / BV</span>
              </button>
            </div>
          </div>

          {/* Search bar & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isClinic ? "Tìm tên bệnh viện, gói khám, địa chỉ..." : "Tìm tên bác sĩ, chuyên khoa, triệu chứng..."}
                className="pl-10 h-12 bg-white text-slate-900 border-0 shadow-md text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-sky-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* City Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full h-12 bg-white text-slate-800 text-sm font-medium rounded-xl px-3 border-0 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
              >
                <option value="all">📍 Toàn quốc (Tất cả khu vực)</option>
                <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
              </select>
            </div>

            {/* Specialty Filter for Doctors */}
            {!isClinic && (
              <div className="md:col-span-3">
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full h-12 bg-white text-slate-800 text-sm font-medium rounded-xl px-3 border-0 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                >
                  <option value="all">🩺 Tất cả chuyên khoa</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.doctorCount} BS)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* ============================================================== */}
        {/* GPS NEAR-ME CONTROL PANEL (TUÂN THỦ ACT-UI-01 & BR-UI-08..10)  */}
        {/* ============================================================== */}
        <div className="mb-6 bg-white rounded-2xl border border-sky-200/80 shadow-sm p-4 sm:p-5 transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Status / Trigger */}
            <div className="flex items-start sm:items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isNearMeActive 
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 animate-pulse" 
                  : "bg-sky-50 text-sky-600 border border-sky-100"
              }`}>
                {isLocating ? (
                  <Crosshair className="w-5 h-5 animate-spin" />
                ) : isNearMeActive ? (
                  <Navigation className="w-5 h-5" />
                ) : (
                  <Compass className="w-5 h-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                    <span>Định vị Cơ sở Y tế Gần tôi</span>
                    <Badge variant={isNearMeActive ? "success" : "secondary"} className="text-[10px] px-2 py-0.5">
                      {isNearMeActive ? "Đang bật" : "Sẵn sàng"}
                    </Badge>
                  </h3>
                </div>

                <p className="text-xs text-slate-500 mt-0.5">
                  {isLocating ? (
                    <span className="text-sky-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-ping"></span>
                      Đang kết nối GPS trình duyệt và tính toán khoảng cách...
                    </span>
                  ) : isNearMeActive && userLocation ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1.5 flex-wrap">
                      <span>Mốc cự ly: <strong>{userLocation.name}</strong></span>
                      <button 
                        onClick={() => setShowFallbackModal(true)}
                        className="text-[11px] text-sky-600 hover:text-sky-800 underline font-semibold ml-1"
                      >
                        (Đổi vị trí Quận)
                      </button>
                    </span>
                  ) : (
                    "Bật định vị để đo khoảng cách thực tế (km) và sắp xếp cơ sở y tế gần bạn nhất."
                  )}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {!isNearMeActive ? (
                <>
                  <Button
                    onClick={() => requestLocation(false)}
                    disabled={isLocating}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 px-4 py-2.5 h-10 rounded-xl flex items-center gap-2"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Lấy GPS tự động</span>
                  </Button>
                  <Button
                    onClick={() => setShowFallbackModal(true)}
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold h-10 rounded-xl"
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    <span>Chọn Quận/Huyện</span>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => requestLocation(false)}
                    disabled={isLocating}
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold border-slate-200 h-9 rounded-lg"
                    title="Làm mới tọa độ GPS"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 mr-1 ${isLocating ? "animate-spin" : ""}`} />
                    <span>Làm mới GPS</span>
                  </Button>
                  <Button
                    onClick={handleDisableNearMe}
                    variant="ghost"
                    size="sm"
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-9 rounded-lg"
                  >
                    Tắt Near-me
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Radius Selector Pills (Hiển thị khi Near-me đang bật) */}
          {isNearMeActive && (
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Chọn bán kính tìm kiếm:</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {RADIUS_OPTIONS.map((opt) => {
                  const isActive = selectedRadius === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedRadius(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        isActive
                          ? "bg-sky-600 text-white shadow-sm ring-2 ring-sky-300"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {opt.value === 5 && !isActive && (
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-1 rounded">Gợi ý</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Specialty Quick Chips (When viewing Doctors & not strictly near-me filtered) */}
        {!isClinic && (
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedSpecialty("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedSpecialty === "all"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Tất cả ({doctors.length})
              </button>
              {specialties.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSpecialty(s.name)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedSpecialty === s.name
                      ? "bg-sky-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Header: Count & Sort badge */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-600">
              Tìm thấy <strong className="text-slate-900 font-bold">{isClinic ? processedHospitals.length : processedDoctors.length}</strong> {isClinic ? "cơ sở y tế" : "bác sĩ"}
              {isNearMeActive && selectedRadius < 9999 && (
                <span className="text-sky-700 font-semibold"> (trong bán kính &lt; {selectedRadius} km)</span>
              )}
            </p>
            {isNearMeActive && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                Sắp xếp: Gần bạn nhất trước
              </Badge>
            )}
          </div>

          {(searchTerm || selectedSpecialty !== "all" || selectedCity !== "all" || isNearMeActive) && (
            <button
              onClick={() => {
                setSearchTerm("")
                setSelectedSpecialty("all")
                setSelectedCity("all")
                setIsNearMeActive(false)
              }}
              className="text-xs text-sky-600 hover:text-sky-800 font-medium underline"
            >
              Đặt lại toàn bộ bộ lọc
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* DOCTORS VIEW                                                   */}
        {/* ============================================================== */}
        {!isClinic && (
          <div className="space-y-4">
            {processedDoctors.length === 0 ? (
              /* EX-UI-02: Empty state khi không có bác sĩ trong bán kính */
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                  <MapPinOff className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {isNearMeActive
                      ? `Không tìm thấy bác sĩ nào trong bán kính < ${selectedRadius} km`
                      : "Không tìm thấy bác sĩ phù hợp"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    {isNearMeActive
                      ? `Hiện chưa có bác sĩ nào thuộc phạm vi ${selectedRadius} km từ ${userLocation?.name || "vị trí của bạn"}. Hãy thử mở rộng bán kính tìm kiếm.`
                      : "Vui lòng thử tìm kiếm bằng từ khóa khác hoặc xóa bớt tiêu chí lọc chuyên khoa / khu vực."}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  {isNearMeActive && selectedRadius < 10 && (
                    <Button
                      onClick={() => setSelectedRadius(10)}
                      className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
                    >
                      Mở rộng lên 10 km
                    </Button>
                  )}
                  {isNearMeActive && selectedRadius < 20 && (
                    <Button
                      onClick={() => setSelectedRadius(20)}
                      variant="outline"
                      className="text-xs font-semibold"
                    >
                      Mở rộng lên 20 km
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedSpecialty("all")
                      setSelectedCity("all")
                      setSelectedRadius(9999)
                    }}
                    className="text-xs text-slate-600"
                  >
                    Xem tất cả bác sĩ
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {processedDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-400 hover:shadow-medical transition-all p-5 flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top banner if Near-me active with distance */}
                    {doc.distanceKm != null && (
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/70">
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Cách bạn {doc.distanceStr}</span>
                          <span className="text-emerald-500">•</span>
                          <span className="font-normal text-emerald-600">{doc.travelTime}</span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-400">
                          {doc.district ? `Khu vực: ${doc.district}` : doc.city}
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Doctor Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="info" className="text-[11px] font-semibold">
                            {doc.specialty_name}
                          </Badge>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            {doc.experience_years} năm KN
                          </span>
                        </div>

                        <Link to={`/doctors/${doc.id}`} className="block">
                          <h3 className="font-bold text-slate-900 text-base hover:text-sky-600 transition-colors truncate">
                            {doc.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                          {doc.title}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center gap-1.5 mt-2 text-xs">
                          <div className="flex items-center text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                            {doc.rating}
                          </div>
                          <span className="text-slate-400">({doc.reviews_count} đánh giá)</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600 font-medium">{doc.city}</span>
                        </div>
                      </div>
                    </div>

                    {/* Workplace & Fee */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-1.5 text-xs text-slate-500 max-w-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{doc.address}</span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block leading-tight">Giá khám</span>
                          <strong className="text-sm font-bold text-sky-600">
                            {formatCurrency(doc.fee)}
                          </strong>
                        </div>
                        <Button asChild size="sm" className="bg-sky-600 hover:bg-sky-700 text-white font-semibold">
                          <Link to={`/doctors/${doc.id}`} className="flex items-center gap-1">
                            <span>Đặt khám</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* HOSPITALS / CLINICS VIEW                                       */}
        {/* ============================================================== */}
        {isClinic && (
          <div className="space-y-4">
            {processedHospitals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {isNearMeActive
                      ? `Không tìm thấy cơ sở y tế nào trong bán kính < ${selectedRadius} km`
                      : "Không tìm thấy cơ sở y tế phù hợp"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Vui lòng mở rộng bán kính tìm kiếm hoặc kiểm tra lại từ khóa.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  {isNearMeActive && (
                    <Button
                      onClick={() => setSelectedRadius(20)}
                      className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
                    >
                      Mở rộng lên 20 km
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedCity("all")
                      setSelectedRadius(9999)
                    }}
                  >
                    Xem tất cả cơ sở y tế
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {processedHospitals.map((hosp) => (
                  <div
                    key={hosp.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-medical transition-all p-5 flex flex-col md:flex-row gap-5"
                  >
                    {/* Hospital Image */}
                    <div className="md:w-64 h-48 rounded-xl overflow-hidden shrink-0 relative">
                      <img
                        src={hosp.image}
                        alt={hosp.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <Badge className="bg-slate-900/80 text-white text-[10px] backdrop-blur-sm">
                          📍 {hosp.city}
                        </Badge>
                        {hosp.distanceKm != null && (
                          <Badge className="bg-emerald-600 text-white text-[10px] font-bold shadow-sm">
                            Cách {hosp.distanceStr}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Hospital Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-bold text-slate-900 text-lg hover:text-sky-600 transition-colors">
                            {hosp.name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{hosp.rating}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{hosp.address}</span>
                          </p>
                          {hosp.distanceKm != null && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              📍 Cách {hosp.distanceStr} ({hosp.travelTime})
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                          {hosp.description}
                        </p>

                        {/* Exam Types */}
                        <div>
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Dịch vụ & Gói khám tiêu biểu:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {hosp.exam_types.map((exam) => (
                              <div
                                key={exam.id}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                              >
                                <span className="font-medium text-slate-800">{exam.name}</span>
                                <span className="font-bold text-sky-600">{formatCurrency(exam.price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-sky-600" />
                          <span>Hotline: <strong className="text-slate-900 font-bold">{hosp.hotline}</strong></span>
                        </div>

                        <Button asChild className="bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm">
                          <Link to={`/doctors/1?hospitalId=${hosp.id}`} className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>Xem Lịch Khám & Đặt Chỗ</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* FALLBACK MODAL CHỌN QUẬN/HUYỆN (EX-UI-01 THEO ACT-UI-01)      */}
      {/* ============================================================== */}
      <Dialog open={showFallbackModal} onClose={() => setShowFallbackModal(false)}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-sky-700">
            <MapPin className="w-5 h-5 text-sky-600" />
            <DialogTitle>Chọn Khu Vực Của Bạn (Fallback EX-UI-01)</DialogTitle>
          </div>
          <DialogDescription>
            {locationError ? (
              <span className="text-amber-700 font-medium block mt-1">
                ⚠️ {locationError}. Bạn có thể chọn Quận / Huyện gần mình nhất để MedSi tính khoảng cách chính xác:
              </span>
            ) : (
              "Chọn Quận / Huyện làm mốc để tìm kiếm bác sĩ và phòng khám gần bạn nhất."
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
              Danh sách Quận / Huyện trọng điểm:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
              {POPULAR_DISTRICTS.map((dist) => {
                const isSelected = selectedFallbackDistrict === dist.id
                return (
                  <button
                    key={dist.id}
                    type="button"
                    onClick={() => setSelectedFallbackDistrict(dist.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? "border-sky-500 bg-sky-50 text-sky-900 font-bold shadow-sm"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-3.5 h-3.5 ${isSelected ? "text-sky-600" : "text-slate-400"}`} />
                      <span>{dist.name}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-100 flex items-start gap-2 text-xs text-sky-800">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <p>
              Hệ thống sẽ lấy tọa độ trung tâm của Quận/Huyện đã chọn để đo khoảng cách Haversine mặt cầu đến từng phòng khám.
            </p>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowFallbackModal(false)}
            className="text-xs font-semibold"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleApplyDistrictFallback}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-5"
          >
            Áp dụng vị trí này
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
