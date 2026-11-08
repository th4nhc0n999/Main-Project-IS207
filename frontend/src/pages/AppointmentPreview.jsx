import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Sun,
  Sunset,
  Hospital,
  Stethoscope,
  Plus,
  Upload,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react'
import AttachmentUploader from '@/components/AttachmentUploader'
import ProfileModal from '@/components/ProfileModal'
import { initialDoctors, initialHospitals } from '@/lib/mockData'
import './booking-modern.css'

const fee = value => (value || 0).toLocaleString('vi-VN') + ' ₫'

function nextDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i + 1)
    return date
  })
}

const mockHours = [
  { time: '08:00 - 08:30', period: 'morning' },
  { time: '08:30 - 09:00', period: 'morning' },
  { time: '09:00 - 09:30', period: 'morning' },
  { time: '09:30 - 10:00', period: 'morning' },
  { time: '10:00 - 10:30', period: 'morning' },
  { time: '10:30 - 11:00', period: 'morning' },
  { time: '14:00 - 14:30', period: 'afternoon' },
  { time: '14:30 - 15:00', period: 'afternoon' },
  { time: '15:00 - 15:30', period: 'afternoon' },
  { time: '15:30 - 16:00', period: 'afternoon' },
  { time: '16:00 - 16:30', period: 'afternoon' },
  { time: '16:30 - 17:00', period: 'afternoon' },
]

export default function AppointmentPreview({ hospital = false }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const providers = hospital ? initialHospitals.filter(h => !/phòng khám/i.test(h.name)) : initialDoctors
  const [providerId, setProviderId] = useState(Number(params.get('id')) || providers[0].id)
  const provider = providers.find(p => p.id === providerId) || providers[0]

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [providerId])

  const [examId, setExamId] = useState(null)
  const exam = provider.exam_types?.find(item => item.id === examId) || provider.exam_types?.[0]
  const [days] = useState(nextDays)
  const [dayIndex, setDayIndex] = useState(0)
  const [selectedTime, setSelectedTime] = useState('')
  const [step, setStep] = useState(1) // 1: Thời gian khám, 2: Bệnh nhân, 3: Hoàn tất

  // Patient Profiles list
  const [profiles, setProfiles] = useState([
    {
      id: 1,
      full_name: 'Nguyễn Quốc Huy',
      dob: '04/04/2006',
      phone: '0905 756 842',
      relationship: 'Bản thân',
      is_default: true,
    },
    {
      id: 2,
      full_name: 'Phạm Minh Tuấn',
      dob: '10/05/1995',
      phone: '0903 000 001',
      relationship: 'Bản thân',
      is_default: false,
    },
  ])
  const [selectedProfileId, setSelectedProfileId] = useState(1)
  const [symptoms, setSymptoms] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)
  const [summaryCollapsed, setSummaryCollapsed] = useState(false)

  const activeProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0]
  const patientName = activeProfile?.full_name || ''

  const dateObj = days[dayIndex]
  const formattedDayTitle = dateObj.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
  const shortDateLabel = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const amount = exam?.price ?? provider.fee ?? 200000

  const morningHours = mockHours.filter(h => h.period === 'morning')
  const afternoonHours = mockHours.filter(h => h.period === 'afternoon')

  const providerAvatar = !hospital
    ? `/media/directory/doctor-${provider.id}.jpg`
    : `/media/directory/hospital-${provider.id}.jpg`

  return (
    <section className="clinic med-booking-page">
      {/* Breadcrumb */}
      <nav className="med-booking-crumb">
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link to={hospital ? '/dat-kham/benh-vien' : '/dat-kham/bac-si'}>
          {hospital ? 'Bệnh viện' : 'Bác sĩ'}
        </Link>
        <ChevronRight size={14} />
        <span>{provider.name}</span>
      </nav>

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
          disabled={!selectedTime}
          onClick={() => selectedTime && setStep(2)}
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
        {/* Left Column: Form & Accordions */}
        <div className="booking-main-content">
          {/* Accordion 1: Ngày và giờ khám (Ảnh 1) */}
          <div className={`booking-accordion-card ${step === 1 ? 'active' : ''}`}>
            <div
              className="booking-card-header"
              onClick={() => setStep(1)}
            >
              <div className="booking-card-title">
                <span className="step-circle">{step > 1 ? '✓' : '1'}</span>
                <span>Ngày và giờ khám</span>
              </div>
              {step > 1 ? (
                <span className="text-xs font-semibold text-sage-700 bg-sage-50 px-2.5 py-1 rounded">
                  {shortDateLabel} · {selectedTime}
                </span>
              ) : (
                <ChevronDown size={20} className="text-slate-400" />
              )}
            </div>

            {step === 1 && (
              <div className="booking-card-body">
                {/* Horizontal Date Strip (Ảnh 1) */}
                <div className="date-strip-wrapper">
                  <button
                    type="button"
                    className="strip-arrow-btn"
                    onClick={() => dayIndex > 0 && setDayIndex(dayIndex - 1)}
                    disabled={dayIndex === 0}
                    aria-label="Ngày trước"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>

                  <div className="date-strip-scroll">
                    {days.map((d, i) => {
                      const isAct = dayIndex === i
                      const weekday = d.toLocaleDateString('vi-VN', { weekday: 'short' })
                      const dm = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
                      return (
                        <div
                          key={i}
                          className={`date-strip-item ${isAct ? 'active' : ''}`}
                          onClick={() => {
                            setDayIndex(i)
                            setSelectedTime('')
                          }}
                        >
                          <div className="date-strip-title">{weekday}, {dm}</div>
                          <div className="date-strip-count">12 khung giờ</div>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    className="strip-arrow-btn"
                    onClick={() => dayIndex < days.length - 1 && setDayIndex(dayIndex + 1)}
                    disabled={dayIndex === days.length - 1}
                    aria-label="Ngày sau"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>

                {/* Morning Slot Group */}
                <div className="time-slot-group">
                  <div className="time-slot-group-header">
                    <Sun size={17} />
                    <span>Buổi sáng</span>
                  </div>
                  <div className="slot-grid-matrix">
                    {morningHours.map(h => (
                      <button
                        key={h.time}
                        type="button"
                        className={`slot-btn ${selectedTime === h.time ? 'active' : ''}`}
                        onClick={() => setSelectedTime(h.time)}
                      >
                        {h.time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Afternoon Slot Group */}
                <div className="time-slot-group">
                  <div className="time-slot-group-header">
                    <Sunset size={17} />
                    <span>Buổi chiều</span>
                  </div>
                  <div className="slot-grid-matrix">
                    {afternoonHours.map(h => (
                      <button
                        key={h.time}
                        type="button"
                        className={`slot-btn ${selectedTime === h.time ? 'active' : ''}`}
                        onClick={() => setSelectedTime(h.time)}
                      >
                        {h.time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Button Continue */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    disabled={!selectedTime}
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-sage-600 text-white font-semibold hover:bg-sage-700 disabled:opacity-50 transition"
                  >
                    Tiếp tục chọn người khám <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 2: Hồ sơ bệnh nhân (Ảnh 3 & 4) */}
          <div className={`booking-accordion-card ${step === 2 ? 'active' : ''}`}>
            <div
              className="booking-card-header"
              onClick={() => selectedTime && setStep(2)}
            >
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

                {/* Profile Card List (Khớp với UI người dùng yêu cầu) */}
                <div className="profile-card-list">
                  {profiles.map(p => {
                    const isSelected = p.id === selectedProfileId
                    const initials = p.full_name
                      ? p.full_name
                          .split(' ')
                          .slice(-2)
                          .map(w => w[0])
                          .join('')
                          .toUpperCase()
                      : 'BN'
                    const genderLabel = p.gender === 'female' ? 'Nữ' : p.gender === 'other' ? 'Khác' : 'Nam'
                    const code = `BN-${String(p.id).padStart(6, '0')}`

                    return (
                      <div
                        key={p.id}
                        className={`patient-profile-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedProfileId(p.id)}
                      >
                        <div className="patient-card-header-row">
                          <div className="patient-card-left">
                            <div
                              className="patient-initials-avatar"
                              style={{ background: isSelected ? 'var(--med-sage)' : '#3b6e34' }}
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

                <div className="mb-4">
                  <button
                    type="button"
                    className="btn-add-profile"
                    onClick={() => {
                      setEditingProfile(null)
                      setIsModalOpen(true)
                    }}
                  >
                    <Plus size={16} /> Thêm hồ sơ mới
                  </button>
                </div>

                {/* Thông tin bổ sung (không bắt buộc) (Ảnh 4) */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Thông tin bổ sung (không bắt buộc)</h4>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ghi chú</label>
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-sage-600 focus:ring-1 focus:ring-sage-600"
                      placeholder="Triệu chứng, thuốc đang dùng, tiền sử, ..."
                      value={symptoms}
                      onChange={e => setSymptoms(e.target.value)}
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

          {step === 3 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-700 text-white mx-auto flex items-center justify-center mb-3">
                <Check size={24} />
              </div>
              <h2 className="text-lg font-bold text-emerald-950">Đặt lịch khám thành công</h2>
              <p className="text-sm text-emerald-800 mt-1">
                Lịch hẹn của bạn với {provider.name} vào {selectedTime} ngày {shortDateLabel} đã được ghi nhận.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Link
                  to="/"
                  className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800"
                >
                  Về trang chủ
                </Link>
                <Link
                  to="/my-bookings"
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  Xem lịch khám của tôi
                </Link>
              </div>
            </div>
          )}
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
                <img
                  src={providerAvatar}
                  alt={provider.name}
                  className="summary-provider-img"
                  onError={e => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="summary-provider-text">
                  <h3>{provider.name}</h3>
                  <p>{hospital ? provider.address : provider.workplace || provider.city}</p>
                </div>
              </div>

              {/* Key-Value Breakdown */}
              <div className="summary-kv-list">
                <div className="summary-kv-item">
                  <span className="label">Ngày khám</span>
                  <span className="value">{shortDateLabel}</span>
                </div>
                <div className="summary-kv-item">
                  <span className="label">Khung giờ</span>
                  <span className="value">{selectedTime || 'Chưa chọn'}</span>
                </div>
                {step >= 2 && (
                  <div className="summary-kv-item">
                    <span className="label">Bệnh nhân</span>
                    <span className="value">{patientName}</span>
                  </div>
                )}
              </div>

              <div className="summary-price-total">
                <span>Phí khám:</span>
                <strong>{fee(amount)}</strong>
              </div>

              <button
                type="button"
                className="summary-submit-btn"
                disabled={!selectedTime || (step === 2 && !patientName)}
                onClick={() => {
                  if (step === 1) setStep(2)
                  else if (step === 2) setStep(3)
                }}
              >
                {step === 1 ? 'Xác nhận đặt khám' : 'Đặt lịch'}
              </button>

              <p className="summary-disclaimer">
                Bằng cách nhấn nút xác nhận, bạn đã đồng ý với các điều khoản và điều kiện đặt khám của MedSi.
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
        onCreated={newProfile => {
          setProfiles(prev => [...prev, newProfile])
          setSelectedProfileId(newProfile.id)
        }}
        onUpdated={updatedProfile => {
          setProfiles(prev =>
            prev.map(p => (String(p.id) === String(updatedProfile.id) ? { ...p, ...updatedProfile } : p))
          )
        }}
      />
    </section>
  )
}
