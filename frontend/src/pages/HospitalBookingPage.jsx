import BookingSignIn from '@/components/BookingSignIn'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { hospitalBookingApi as api } from '@/api/hospitalBookingApi'
import AttachmentUploader from '@/components/AttachmentUploader'
import ProfileModal from '@/components/ProfileModal'
import { useAuth } from '@/context/AuthContext'
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Sun,
  Sunset,
  Plus,
  Upload,
  ArrowRight,
  ShieldCheck,
  Building2,
  Camera,
} from 'lucide-react'
import './booking-modern.css'

const money = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

export default function HospitalBookingPage() {
  const { hospitalId } = useParams()
  const [searchParams] = useSearchParams()
  const queryHospitalId =
    hospitalId ||
    searchParams.get('id') ||
    searchParams.get('hospitalId') ||
    searchParams.get('hospital_id') ||
    ''
  const { user, loading: authLoading } = useAuth()
  const [hospitals, setHospitals] = useState([])
  const [hospital, setHospital] = useState(queryHospitalId)
  const [options, setOptions] = useState(null)
  const [slots, setSlots] = useState([])
  const [attachments, setAttachments] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)
  const [form, setForm] = useState({
    specialty_id: '',
    exam_type_id: '',
    slot_id: '',
    patient_profile_id: '',
    symptoms: '',
  })
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Thời gian & ca khám, 2: Bệnh nhân
  const [selectedDate, setSelectedDate] = useState('')
  const [summaryCollapsed, setSummaryCollapsed] = useState(false)
  const requestKey = useRef(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    if (queryHospitalId && String(hospital) !== String(queryHospitalId)) {
      setHospital(String(queryHospitalId))
    }
  }, [queryHospitalId])

  useEffect(() => {
    let active = true
    api
      .hospitals()
      .then((res) => {
        if (active) {
          setHospitals(res.data)
          if (!hospital && res.data.length > 0) {
            setHospital(String(res.data[0].id))
          }
        }
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!hospital || !user) return
    let active = true
    api
      .options(hospital)
      .then((res) => {
        if (active) {
          setOptions(res.data)
          if (res.data.specialties?.length > 0 && !form.specialty_id) {
            setForm((prev) => ({
              ...prev,
              specialty_id: String(res.data.specialties[0].id),
            }))
          }
        }
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [hospital, user])

  useEffect(() => {
    if (!hospital || !form.specialty_id) return
    let active = true
    api
      .slots(hospital, { specialty_id: form.specialty_id })
      .then((res) => {
        if (active) {
          setSlots(res.data)
          if (res.data.length > 0) {
            setSelectedDate(res.data[0].work_date)
          }
        }
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [hospital, form.specialty_id])

  // Current hospital record
  const currentHospital = hospitals.find((h) => String(h.id) === String(hospital)) || hospitals[0]

  // Exams available
  const exams =
    options?.exam_types.filter(
      (exam) => exam.specialty_id === null || String(exam.specialty_id) === form.specialty_id
    ) || []
  const selectedExam = exams.find((item) => String(item.id) === form.exam_type_id) || exams[0]

  // Group slots by work_date (Carousel Ảnh 1)
  const groupedDates = useMemo(() => {
    const map = new Map()
    for (const slot of slots) {
      if (!map.has(slot.work_date)) {
        map.set(slot.work_date, [])
      }
      map.get(slot.work_date).push(slot)
    }
    return Array.from(map.entries()).map(([date, items]) => {
      const d = new Date(date + 'T00:00:00')
      const weekday = d.toLocaleDateString('vi-VN', { weekday: 'short' })
      const dayMonth = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
      return {
        date,
        label: `${weekday}, ${dayMonth}`,
        fullDate: d.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        count: items.length,
        slots: items,
      }
    })
  }, [slots])

  const activeDate = selectedDate || (groupedDates.length > 0 ? groupedDates[0].date : '')
  const currentDayData = groupedDates.find((g) => g.date === activeDate)

  const { morningSlots, afternoonSlots } = useMemo(() => {
    const list = currentDayData?.slots || []
    const morning = []
    const afternoon = []
    for (const s of list) {
      const hour = parseInt(s.start_time.slice(0, 2), 10)
      if (hour < 12) {
        morning.push(s)
      } else {
        afternoon.push(s)
      }
    }
    return { morningSlots: morning, afternoonSlots: afternoon }
  }, [currentDayData])

  const selectedSlot = slots.find((item) => String(item.id) === String(form.slot_id))

  // Profiles
  const profileList = options?.profiles || []
  const selectedProfile = useMemo(() => {
    if (form.patient_profile_id) {
      return profileList.find((p) => String(p.id) === String(form.patient_profile_id))
    }
    if (profileList.length > 0) {
      return profileList[0]
    }
    return null
  }, [form.patient_profile_id, profileList])

  const activeProfileId = selectedProfile?.id || ''

  function change(name, value) {
    requestKey.current = null
    setError('')
    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'specialty_id' ? { exam_type_id: '', slot_id: '' } : {}),
    }))
    if (name === 'specialty_id') {
      setSlots([])
      setSelectedDate('')
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (!form.slot_id) {
      setError('Vui lòng chọn ca khám.')
      return
    }
    if (!activeProfileId) {
      setError('Vui lòng chọn hồ sơ bệnh nhân.')
      return
    }

    setPending(true)
    setError('')
    requestKey.current ||= crypto.randomUUID()
    try {
      const examIdToUse = form.exam_type_id || (selectedExam ? selectedExam.id : null)
      const res = await api.create({
        ...form,
        exam_type_id: Number(examIdToUse),
        hospital_id: Number(hospital),
        specialty_id: Number(form.specialty_id),
        slot_id: Number(form.slot_id),
        patient_profile_id: Number(activeProfileId),
        request_key: requestKey.current,
      })
      navigate('/payment?booking_id=' + res.data.id, { replace: true })
    } catch (err) {
      if (err.status === 403) {
        setError('Tài khoản hiện tại không có quyền đặt khám. Vui lòng đăng nhập bằng tài khoản Bệnh nhân.')
      } else if (err.code === 'SE001') {
        setError('Ca khám vừa hết chỗ. Vui lòng chọn ca khác.')
      } else {
        setError(err.message)
      }
    } finally {
      setPending(false)
    }
  }

  if (authLoading) return <p className="p-8 text-center text-slate-500">Đang kiểm tra đăng nhập…</p>
  if (!user) return <BookingSignIn title="Đặt khám tại bệnh viện" />

  const hospitalImage = currentHospital?.id ? `/media/directory/hospital-${currentHospital.id}.jpg` : null

  return (
    <section className="clinic med-booking-page">
      {/* Breadcrumb (Ảnh 2) */}
      <nav className="med-booking-crumb" aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link to="/dat-kham/benh-vien">Bệnh viện</Link>
        <ChevronRight size={14} />
        <span>{currentHospital?.name}</span>
      </nav>

      {/* Facility Header & Gallery (Ảnh 2) */}
      {currentHospital && (
        <header className="facility-header">
          <div className="facility-intro">
            {hospitalImage ? (
              <img
                src={hospitalImage}
                alt={currentHospital.name}
                className="facility-logo"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="facility-logo">
                <Building2 size={36} />
              </div>
            )}
            <div className="facility-details flex-1">
              <h1>{currentHospital.name}</h1>
              <p className="facility-slogan">
                {currentHospital.city} · Cơ sở y tế tiêu chuẩn chất lượng cao MedSi
              </p>
              <div className="facility-badges">
                <span className="facility-badge-btn">
                  <MapPin size={14} /> {currentHospital.address}
                </span>
                <span className="facility-badge-btn">
                  <Phone size={14} /> 1900 2805 (Hotline đặt khám)
                </span>
              </div>
            </div>
          </div>

          {/* Gallery Preview (Ảnh 2) */}
          <div className="facility-gallery">
            <div className="gallery-main">
              <img
                src={hospitalImage || '/media/directory/hospital-1.jpg'}
                alt={currentHospital.name}
              />
            </div>
            <div className="gallery-sub">
              <img
                src="/media/directory/hospital-2.jpg"
                alt="Khu khám bệnh"
                onError={(e) => {
                  e.currentTarget.src = hospitalImage || '/media/directory/hospital-1.jpg'
                }}
              />
              <img
                src="/media/directory/hospital-4.jpg"
                alt="Phòng tiếp đón"
                onError={(e) => {
                  e.currentTarget.src = hospitalImage || '/media/directory/hospital-1.jpg'
                }}
              />
            </div>
            <div className="gallery-count-badge">
              <Camera size={13} /> 3 ảnh
            </div>
          </div>
        </header>
      )}

      {/* Modern Stepper Header (Ảnh 1 & 4) */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition ${
            step === 1
              ? 'bg-white border border-sage-600 text-sage-800 shadow-sm'
              : 'bg-sage-50 text-sage-800 hover:bg-sage-100'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-sage-600 text-white flex items-center justify-center text-xs">
            {step > 1 ? '✓' : '1'}
          </span>
          Thời gian khám
        </button>
        <span className="text-slate-300 font-bold">—</span>
        <button
          type="button"
          disabled={!form.slot_id}
          onClick={() => form.slot_id && setStep(2)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition ${
            step === 2
              ? 'bg-white border border-sage-600 text-sage-800 shadow-sm'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              step >= 2 ? 'bg-sage-600 text-white' : 'bg-slate-300 text-slate-600'
            }`}
          >
            2
          </span>
          Bệnh nhân
        </button>
      </div>

      <div className="booking-layout-grid">
        {/* Left Column: Form Content */}
        <div className="booking-main-content">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              {error}
            </div>
          )}

          {/* Accordion 1: Chọn chuyên khoa & ca khám (Ảnh 1) */}
          <div className={`booking-accordion-card ${step === 1 ? 'active' : ''}`}>
            <div className="booking-card-header" onClick={() => setStep(1)}>
              <div className="booking-card-title">
                <span className="step-circle">{step > 1 ? '✓' : '1'}</span>
                <span>Ngày và giờ khám</span>
              </div>
              {step > 1 ? (
                <span className="text-xs font-semibold text-sage-700 bg-sage-50 px-2.5 py-1 rounded">
                  {selectedSlot?.work_date} · {selectedSlot?.start_time.slice(0, 5)} - {selectedSlot?.end_time.slice(0, 5)}
                </span>
              ) : (
                <ChevronDown size={20} className="text-slate-400" />
              )}
            </div>

            {step === 1 && (
              <div className="booking-card-body">
                {/* Switch Hospital & Specialty filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Bệnh viện tiếp nhận
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white"
                      value={hospital}
                      onChange={(e) => {
                        setHospital(e.target.value)
                        setOptions(null)
                        setSlots([])
                        setError('')
                        setForm({
                          specialty_id: '',
                          exam_type_id: '',
                          slot_id: '',
                          patient_profile_id: '',
                          symptoms: '',
                        })
                      }}
                    >
                      {hospitals.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} — {h.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Chuyên khoa
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white"
                      value={form.specialty_id}
                      onChange={(e) => change('specialty_id', e.target.value)}
                      disabled={!options || options.specialties.length === 0}
                    >
                      <option value="">-- Chọn chuyên khoa khám --</option>
                      {options?.specialties.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Exam type select */}
                {exams.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Gói / Loại hình khám
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {exams.map((ex) => {
                        const isChosen =
                          String(ex.id) === String(form.exam_type_id || selectedExam?.id)
                        return (
                          <div
                            key={ex.id}
                            className={`p-3 rounded-lg border cursor-pointer text-sm transition ${
                              isChosen
                                ? 'border-sage-600 bg-sage-50 text-sage-900 font-semibold shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                            onClick={() => change('exam_type_id', String(ex.id))}
                          >
                            <div className="flex justify-between items-center">
                              <span>{ex.name}</span>
                              <strong className="text-sage-700">{money(Number(ex.price))}</strong>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Horizontal Date Strip (Ảnh 1) */}
                {groupedDates.length > 0 ? (
                  <>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                      Chọn ngày khám
                    </label>
                    <div className="date-strip-wrapper">
                      <button
                        type="button"
                        className="strip-arrow-btn"
                        onClick={() => {
                          const idx = groupedDates.findIndex((g) => g.date === activeDate)
                          if (idx > 0) {
                            setSelectedDate(groupedDates[idx - 1].date)
                            change('slot_id', '')
                          }
                        }}
                        disabled={groupedDates.findIndex((g) => g.date === activeDate) <= 0}
                        aria-label="Ngày trước"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>

                      <div className="date-strip-scroll">
                        {groupedDates.map((g) => (
                          <div
                            key={g.date}
                            className={`date-strip-item ${g.date === activeDate ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedDate(g.date)
                              change('slot_id', '')
                            }}
                          >
                            <div className="date-strip-title">{g.label}</div>
                            <div className="date-strip-count">{g.count} khung giờ</div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="strip-arrow-btn"
                        onClick={() => {
                          const idx = groupedDates.findIndex((g) => g.date === activeDate)
                          if (idx >= 0 && idx < groupedDates.length - 1) {
                            setSelectedDate(groupedDates[idx + 1].date)
                            change('slot_id', '')
                          }
                        }}
                        disabled={
                          groupedDates.findIndex((g) => g.date === activeDate) >=
                          groupedDates.length - 1
                        }
                        aria-label="Ngày sau"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </button>
                    </div>

                    {/* Morning Slots */}
                    {morningSlots.length > 0 && (
                      <div className="time-slot-group">
                        <div className="time-slot-group-header">
                          <Sun size={17} />
                          <span>Buổi sáng</span>
                        </div>
                        <div className="slot-grid-matrix">
                          {morningSlots.map((s) => {
                            const isSelected = String(form.slot_id) === String(s.id)
                            const timeStr = `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`
                            return (
                              <button
                                key={s.id}
                                type="button"
                                className={`slot-btn ${isSelected ? 'active' : ''}`}
                                onClick={() => change('slot_id', String(s.id))}
                              >
                                {timeStr}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Afternoon Slots */}
                    {afternoonSlots.length > 0 && (
                      <div className="time-slot-group">
                        <div className="time-slot-group-header">
                          <Sunset size={17} />
                          <span>Buổi chiều</span>
                        </div>
                        <div className="slot-grid-matrix">
                          {afternoonSlots.map((s) => {
                            const isSelected = String(form.slot_id) === String(s.id)
                            const timeStr = `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`
                            return (
                              <button
                                key={s.id}
                                type="button"
                                className={`slot-btn ${isSelected ? 'active' : ''}`}
                                onClick={() => change('slot_id', String(s.id))}
                              >
                                {timeStr}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        disabled={!form.slot_id}
                        onClick={() => setStep(2)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-sage-600 text-white font-semibold hover:bg-sage-700 disabled:opacity-50 transition"
                      >
                        Tiếp tục chọn người khám <ArrowRight size={17} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 mt-2">
                    Chuyên khoa này hiện chưa mở ca khám trực tuyến trong 7 ngày tới. Vui lòng chọn
                    chuyên khoa hoặc bệnh viện khác.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Accordion 2: Hồ sơ bệnh nhân (Ảnh 3 & 4) */}
          <div className={`booking-accordion-card ${step === 2 ? 'active' : ''}`}>
            <div className="booking-card-header" onClick={() => form.slot_id && setStep(2)}>
              <div className="booking-card-title">
                <span className="step-circle">2</span>
                <span>Hồ sơ bệnh nhân</span>
              </div>
              <ChevronDown size={20} className="text-slate-400" />
            </div>

            {step === 2 && (
              <div className="booking-card-body">
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Chọn hồ sơ cần khám…
                </label>

                {profileList.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center bg-slate-50">
                    <p className="text-sm text-slate-600 mb-3">
                      Bạn chưa có hồ sơ bệnh nhân nào đã đồng ý dữ liệu.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="btn-add-profile"
                    >
                      <Plus size={16} /> Thêm hồ sơ mới
                    </button>
                  </div>
                ) : (
                  <div className="profile-card-list">
                    {profileList.map((p) => {
                      const isSelected = String(p.id) === String(activeProfileId)
                      const initials = p.full_name
                        ? p.full_name
                            .split(' ')
                            .slice(-2)
                            .map((w) => w[0])
                            .join('')
                            .toUpperCase()
                        : 'BN'
                      const genderLabel = p.gender === 'female' ? 'Nữ' : p.gender === 'other' ? 'Khác' : 'Nam'
                      const code = `BN-${String(p.id).padStart(6, '0')}`

                      return (
                        <div
                          key={p.id}
                          className={`patient-profile-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            change('patient_profile_id', String(p.id))
                          }}
                        >
                          <div className="patient-card-header-row">
                            <div className="patient-card-left">
                              <div
                                className="patient-initials-avatar"
                                style={{
                                  background: isSelected ? 'var(--med-sage)' : '#3b6e34',
                                }}
                              >
                                {initials}
                              </div>
                              <div className="patient-card-info">
                                <h3>
                                  {p.full_name}
                                  <span className="patient-primary-tag">
                                    {p.is_default || p.relationship === 'Bản thân' ? 'Tôi' : p.relationship || 'Chính'}
                                  </span>
                                </h3>
                                <div className="text-xs text-slate-500">{p.dob || '--'}</div>
                              </div>
                            </div>
                            <div className="patient-radio-circle" />
                          </div>

                          {/* Detailed structured info */}
                          <div className="patient-card-details-grid">
                            <span className="detail-key">Mã bệnh nhân</span>
                            <span className="detail-val font-mono">{p.code || code}</span>
                            <span className="detail-key">Họ và tên</span>
                            <span className="detail-val">{p.full_name}</span>
                            <span className="detail-key">Giới tính</span>
                            <span className="detail-val">{genderLabel}</span>
                            <span className="detail-key">Ngày sinh</span>
                            <span className="detail-val">{p.dob || '--'}</span>
                            <span className="detail-key">Số điện thoại</span>
                            <span className="detail-val">{p.phone || '--'}</span>
                          </div>

                          {/* Edit profile button */}
                          <button
                            type="button"
                            className="btn-edit-profile"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingProfile(p)
                              setIsModalOpen(true)
                            }}
                          >
                            Điều chỉnh
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(null)
                      setIsModalOpen(true)
                    }}
                    className="btn-add-profile"
                  >
                    <Plus size={16} /> Thêm hồ sơ mới
                  </button>
                </div>

                {/* Thông tin bổ sung (Ảnh 4) */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">
                    Thông tin bổ sung (không bắt buộc)
                  </h4>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Ghi chú
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-sage-600 focus:ring-1 focus:ring-sage-600"
                      placeholder="Triệu chứng, thuốc đang dùng, tiền sử, ..."
                      value={form.symptoms}
                      onChange={(e) => change('symptoms', e.target.value)}
                      maxLength={500}
                    />
                  </div>

                  <div>
                    <AttachmentUploader
                      files={attachments}
                      onChange={setAttachments}
                      maxFiles={5}
                      maxSizeMb={15}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Summary Panel (Ảnh 1 & 4) */}
        <aside className="booking-summary-sticky">
          <div className="summary-header-row">
            <h2>Thông tin đặt khám</h2>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600"
              onClick={() => setSummaryCollapsed(!summaryCollapsed)}
            >
              {summaryCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>

          {!summaryCollapsed && (
            <>
              {/* Provider snippet */}
              <div className="summary-provider-snippet">
                {hospitalImage ? (
                  <img
                    src={hospitalImage}
                    alt={currentHospital?.name}
                    className="summary-provider-img"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div
                    className="patient-initials-avatar"
                    style={{ width: 48, height: 48, background: '#2d5a27', fontSize: 16 }}
                  >
                    BV
                  </div>
                )}
                <div className="summary-provider-text">
                  <h3>{currentHospital?.name}</h3>
                  <p>{currentHospital?.address}</p>
                </div>
              </div>

              {/* Key-Value Breakdown */}
              <div className="summary-kv-list">
                <div className="summary-kv-item">
                  <span className="label">Chuyên khoa</span>
                  <span className="value">
                    {options?.specialties.find((s) => String(s.id) === form.specialty_id)?.name ||
                      'Chưa chọn'}
                  </span>
                </div>
                <div className="summary-kv-item">
                  <span className="label">Loại khám</span>
                  <span className="value">{selectedExam?.name || 'Khám tiêu chuẩn'}</span>
                </div>
                <div className="summary-kv-item">
                  <span className="label">Ngày khám</span>
                  <span className="value">{selectedSlot?.work_date || '--'}</span>
                </div>
                <div className="summary-kv-item">
                  <span className="label">Khung giờ</span>
                  <span className="value">
                    {selectedSlot
                      ? `${selectedSlot.start_time.slice(0, 5)} - ${selectedSlot.end_time.slice(0, 5)}`
                      : 'Chưa chọn'}
                  </span>
                </div>
                {step >= 2 && (
                  <div className="summary-kv-item">
                    <span className="label">Bệnh nhân</span>
                    <span className="value">{selectedProfile?.full_name || '--'}</span>
                  </div>
                )}
              </div>

              {/* Price total */}
              <div className="summary-price-total">
                <span>Tổng cộng:</span>
                <strong>
                  {money(
                    Number(selectedExam?.price || 0) + (options?.service_fee || 20000)
                  )}
                </strong>
              </div>

              <button
                type="button"
                className="summary-submit-btn"
                disabled={pending || !form.slot_id || (step === 2 && !activeProfileId)}
                onClick={(e) => {
                  if (step === 1) setStep(2)
                  else submit(e)
                }}
              >
                {pending
                  ? 'Đang giữ chỗ…'
                  : step === 1
                  ? 'Xác nhận đặt khám'
                  : 'Đặt lịch'}
              </button>

              <p className="summary-disclaimer">
                Bằng cách nhấn nút xác nhận, bạn đã đồng ý với các điều khoản và điều kiện đặt khám của
                MedSi.
              </p>
            </>
          )}
        </aside>
      </div>

      <ProfileModal
        isOpen={isModalOpen}
        initialData={editingProfile}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProfile(null)
        }}
        onCreated={(newProfile) => {
          setOptions((o) => ({ ...o, profiles: [...(o?.profiles || []), newProfile] }))
          change('patient_profile_id', String(newProfile.id))
        }}
        onUpdated={(updatedProfile) => {
          setOptions((o) => ({
            ...o,
            profiles: (o?.profiles || []).map((p) =>
              String(p.id) === String(updatedProfile.id) ? { ...p, ...updatedProfile } : p
            ),
          }))
        }}
      />
    </section>
  )
}
