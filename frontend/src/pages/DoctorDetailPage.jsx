import { useState, useMemo, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Sun, Sunset, MapPin, Check, ShieldCheck, ArrowRight } from 'lucide-react'
import useApi, { money } from '@/api/useApi'
import './booking-modern.css'

export default function DoctorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, error } = useApi('/doctors/' + id)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [id])

  const doctor = data?.data
  const slots = data?.slots || []

  // Group slots by work_date
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
        fullDate: d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
        count: items.length,
        slots: items.sort((a, b) => a.start_time.localeCompare(b.start_time)),
      }
    })
  }, [slots])

  // Initialize selected date
  const activeDate = selectedDate || (groupedDates.length > 0 ? groupedDates[0].date : '')
  const currentDayData = groupedDates.find(g => g.date === activeDate)

  // Morning vs Afternoon split (before 12:00 vs after 12:00)
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

  function handleDateChange(date) {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  function handleContinue() {
    if (!selectedSlot) return
    navigate(`/booking/confirm?doctor=${id}&slot=${selectedSlot.id}`)
  }

  if (!data) {
    return (
      <section className="clinic med-booking-page">
        <nav className="med-booking-crumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/dat-kham/bac-si">Bác sĩ</Link>
        </nav>
        <p role="status">{error || 'Đang tải thông tin bác sĩ…'}</p>
      </section>
    )
  }

  const avatarLetters = doctor.name ? doctor.name.split(' ').slice(-2).map(w => w[0]).join('') : 'BS'
  const doctorImage = doctor.id ? `/media/directory/doctor-${doctor.id}.jpg` : null

  return (
    <section className="clinic med-booking-page">
      {/* Breadcrumb */}
      <nav className="med-booking-crumb" aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link to="/dat-kham/bac-si">Bác sĩ</Link>
        <ChevronRight size={14} />
        <span>{doctor.name}</span>
      </nav>

      {/* Modern Stepper Top Badge */}
      <div className="booking-step-badge">
        <span className="step-num-pill">1</span>
        <span>Thời gian khám</span>
      </div>

      <div className="booking-layout-grid">
        {/* Left Column: Flow Content */}
        <div className="booking-main-content">
          <div className="booking-accordion-card active">
            <div className="booking-card-header">
              <div className="booking-card-title">
                <span className="step-circle">1</span>
                <span>Ngày và giờ khám</span>
              </div>
            </div>

            <div className="booking-card-body">
              {groupedDates.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">
                  Hiện tại bác sĩ chưa có ca khám trực tuyến trong 7 ngày tới.
                </p>
              ) : (
                <>
                  {/* Horizontal Date Strip (Ảnh 1) */}
                  <div className="date-strip-wrapper">
                    <button
                      type="button"
                      className="strip-arrow-btn"
                      onClick={() => {
                        const idx = groupedDates.findIndex(g => g.date === activeDate)
                        if (idx > 0) handleDateChange(groupedDates[idx - 1].date)
                      }}
                      disabled={groupedDates.findIndex(g => g.date === activeDate) <= 0}
                      aria-label="Ngày trước"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>

                    <div className="date-strip-scroll">
                      {groupedDates.map(g => (
                        <div
                          key={g.date}
                          className={`date-strip-item ${g.date === activeDate ? 'active' : ''}`}
                          onClick={() => handleDateChange(g.date)}
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
                        const idx = groupedDates.findIndex(g => g.date === activeDate)
                        if (idx >= 0 && idx < groupedDates.length - 1) {
                          handleDateChange(groupedDates[idx + 1].date)
                        }
                      }}
                      disabled={groupedDates.findIndex(g => g.date === activeDate) >= groupedDates.length - 1}
                      aria-label="Ngày sau"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>

                  {/* Morning Slots Matrix (Ảnh 1) */}
                  {morningSlots.length > 0 && (
                    <div className="time-slot-group">
                      <div className="time-slot-group-header">
                        <Sun size={17} />
                        <span>Buổi sáng</span>
                      </div>
                      <div className="slot-grid-matrix">
                        {morningSlots.map(slot => {
                          const isSelected = selectedSlot?.id === slot.id
                          const timeStr = `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              className={`slot-btn ${isSelected ? 'active' : ''}`}
                              onClick={() => setSelectedSlot(slot)}
                            >
                              {timeStr}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Afternoon Slots Matrix (Ảnh 1) */}
                  {afternoonSlots.length > 0 && (
                    <div className="time-slot-group">
                      <div className="time-slot-group-header">
                        <Sunset size={17} />
                        <span>Buổi chiều</span>
                      </div>
                      <div className="slot-grid-matrix">
                        {afternoonSlots.map(slot => {
                          const isSelected = selectedSlot?.id === slot.id
                          const timeStr = `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              className={`slot-btn ${isSelected ? 'active' : ''}`}
                              onClick={() => setSelectedSlot(slot)}
                            >
                              {timeStr}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Summary Panel (Ảnh 1) */}
        <aside className="booking-summary-sticky">
          <div className="summary-header-row">
            <h2>Thông tin đặt khám</h2>
            <ShieldCheck size={18} className="text-emerald-700" />
          </div>

          <div className="summary-provider-snippet">
            {doctorImage ? (
              <img
                src={doctorImage}
                alt={doctor.name}
                className="summary-provider-img"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = '/media/directory/doctor-1.jpg'
                }}
              />
            ) : (
              <div className="patient-initials-avatar" style={{ width: 48, height: 48, background: '#2d5a27' }}>
                {avatarLetters}
              </div>
            )}
            <div className="summary-provider-text">
              <h3>{[doctor.title, doctor.name].filter(Boolean).join(' ')}</h3>
              <p>{[doctor.hospital, doctor.city || doctor.address].filter(Boolean).join(' · ')}</p>
            </div>
          </div>

          <div className="summary-kv-list">
            <div className="summary-kv-item">
              <span className="label">Chuyên khoa</span>
              <span className="value">{doctor.specialty || 'Chung'}</span>
            </div>
            <div className="summary-kv-item">
              <span className="label">Ngày khám</span>
              <span className="value">
                {currentDayData?.fullDate || 'Chưa chọn'}
              </span>
            </div>
            <div className="summary-kv-item">
              <span className="label">Khung giờ</span>
              <span className="value">
                {selectedSlot
                  ? `${selectedSlot.start_time.slice(0, 5)} - ${selectedSlot.end_time.slice(0, 5)}`
                  : 'Chưa chọn'}
              </span>
            </div>
          </div>

          <div className="summary-price-total">
            <span>Giá khám:</span>
            <strong>{money(doctor.consultation_fee || 0)}</strong>
          </div>

          <button
            type="button"
            className="summary-submit-btn"
            disabled={!selectedSlot}
            onClick={handleContinue}
          >
            Xác nhận đặt khám <ArrowRight size={17} />
          </button>

          <p className="summary-disclaimer">
            Bằng cách nhấn nút xác nhận, bạn đã đồng ý với các điều khoản và điều kiện đặt khám của MedSi.
          </p>
        </aside>
      </div>
    </section>
  )
}
