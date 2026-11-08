import BookingSignIn from '@/components/BookingSignIn'
import { useState, useRef, useMemo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import useApi, { money } from '@/api/useApi'
import client from '@/api/axiosClient'
import AttachmentUploader from '@/components/AttachmentUploader'
import ProfileModal from '@/components/ProfileModal'
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  Calendar,
  Clock,
  User,
  Plus,
  Upload,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import './booking-modern.css'

export default function BookingConfirmPage() {
  const [params] = useSearchParams()
  const doctorId = params.get('doctor')
  const slotId = params.get('slot')
  const { user, loading } = useAuth()
  const [revision, refresh] = useState(0)
  const profiles = useApi(user ? '/patient-profiles' : null, revision)
  const detail = useApi(doctorId ? '/doctors/' + doctorId : null)

  const [profileId, setProfileId] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [attachments, setAttachments] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [summaryCollapsed, setSummaryCollapsed] = useState(false)
  const key = useRef(null)
  const navigate = useNavigate()

  const doctor = detail.data?.data
  const chosenSlot = detail.data?.slots.find(s => String(s.id) === String(slotId))
  const profileList = profiles.data?.data || []

  // Auto-select first profile if none selected
  const selectedProfile = useMemo(() => {
    if (profileId) {
      return profileList.find(p => String(p.id) === String(profileId))
    }
    if (profileList.length > 0) {
      return profileList[0]
    }
    return null
  }, [profileId, profileList])

  const activeProfileId = selectedProfile?.id || ''

  async function submit(e) {
    e.preventDefault()
    if (!activeProfileId) {
      setError('Vui lòng chọn hồ sơ bệnh nhân cần khám.')
      return
    }
    setBusy(true)
    setError('')
    key.current ||= crypto.randomUUID()
    try {
      const { data } = await client.post('/doctors/' + doctorId + '/bookings', {
        slot_id: slotId,
        patient_profile_id: activeProfileId,
        symptoms: symptoms.trim() || undefined,
        request_key: key.current,
      })
      navigate('/payment?booking_id=' + data.id, { replace: true })
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tạo lịch khám.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="clinic">Đang kiểm tra tài khoản…</p>
  if (!user) return <BookingSignIn title="Chọn hồ sơ người khám" />

  const avatarLetters = doctor?.name ? doctor.name.split(' ').slice(-2).map(w => w[0]).join('') : 'BS'
  const doctorImage = doctor?.id ? `/media/directory/doctor-${doctor.id}.jpg` : null

  const formattedDate = chosenSlot?.work_date
    ? new Date(chosenSlot.work_date + 'T00:00:00').toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '--'

  const formattedTime = chosenSlot?.start_time
    ? `${chosenSlot.start_time.slice(0, 5)} - ${chosenSlot.end_time?.slice(0, 5) || ''}`
    : '--'

  return (
    <section className="clinic med-booking-page">
      {/* Modern Stepper Top: [✓] Thời gian khám — [2] Bệnh nhân (Ảnh 2/4) */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to={`/doctors/${doctorId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sage-50 text-sage-800 text-sm font-semibold hover:bg-sage-100 transition"
        >
          <span className="w-5 h-5 rounded-full bg-sage-600 text-white flex items-center justify-center text-xs">
            ✓
          </span>
          Thời gian khám
        </Link>
        <span className="text-slate-300 font-bold">—</span>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-sage-600 text-sage-800 text-sm font-bold shadow-sm">
          <span className="w-5 h-5 rounded-full bg-sage-600 text-white flex items-center justify-center text-xs">
            2
          </span>
          Bệnh nhân
        </div>
      </div>

      <div className="booking-layout-grid">
        {/* Left Column: Accordions & Form (Ảnh 2/4) */}
        <div className="booking-main-content">
          {/* Accordion 1: Ngày và giờ khám (Collapsed completed) */}
          <div className="booking-accordion-card mb-4">
            <Link
              to={`/doctors/${doctorId}`}
              className="booking-card-header flex justify-between items-center no-underline hover:bg-slate-50 transition"
            >
              <div className="booking-card-title flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
                <span className="text-slate-800 font-semibold text-base">Ngày và giờ khám</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-sage-700 font-medium">
                <span>{formattedDate} · {formattedTime}</span>
                <ChevronRight size={18} />
              </div>
            </Link>
          </div>

          {/* Accordion 2: Hồ sơ bệnh nhân (Expanded active) */}
          <div className="booking-accordion-card active">
            <div className="booking-card-header">
              <div className="booking-card-title">
                <span className="step-circle">2</span>
                <span>Hồ sơ bệnh nhân</span>
              </div>
              <ChevronDown size={20} className="text-slate-400" />
            </div>

            <div className="booking-card-body">
              {error && (
                <div role="alert" className="mb-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-800 border border-rose-200">
                  {error}
                </div>
              )}

              {/* Profiles Selection Card List (Ảnh 3/4) */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Chọn hồ sơ cần khám…
                </label>

                {profileList.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center bg-slate-50">
                    <p className="text-sm text-slate-600 mb-3">
                      Bạn chưa có hồ sơ bệnh nhân nào. Vui lòng tạo hồ sơ để tiếp tục.
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
                    {profileList.map(p => {
                      const isSelected = String(p.id) === String(activeProfileId)
                      const initials = p.full_name
                        ? p.full_name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
                        : 'BN'
                      return (
                        <div
                          key={p.id}
                          className={`patient-profile-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setProfileId(p.id)
                            key.current = null
                            setError('')
                          }}
                        >
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
                                {p.is_default && <span className="patient-primary-tag">Chính</span>}
                              </h3>
                              <div className="patient-card-meta">
                                <div>Ngày sinh: {p.dob || '--'}</div>
                                <div>Số điện thoại: {p.phone || '--'}</div>
                                {p.relationship && (
                                  <div className="text-xs text-slate-500 mt-0.5">Quan hệ: {p.relationship}</div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="patient-radio-circle" />
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Button Thêm hồ sơ mới */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="btn-add-profile"
                  >
                    <Plus size={16} /> Thêm hồ sơ mới
                  </button>
                </div>
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
              {/* Doctor snippet */}
              <div className="summary-provider-snippet">
                {doctorImage ? (
                  <img
                    src={doctorImage}
                    alt={doctor?.name}
                    className="summary-provider-img"
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div
                    className="patient-initials-avatar"
                    style={{ width: 48, height: 48, background: '#2d5a27', fontSize: 16 }}
                  >
                    {avatarLetters}
                  </div>
                )}
                <div className="summary-provider-text">
                  <h3>{[doctor?.title, doctor?.name].filter(Boolean).join(' ')}</h3>
                  <p>{[doctor?.hospital, doctor?.city || doctor?.address].filter(Boolean).join(' · ')}</p>
                </div>
              </div>

              {/* Key-Value Breakdown */}
              <div className="summary-kv-list">
                <div className="summary-kv-item">
                  <span className="label">Ngày khám</span>
                  <span className="value">{formattedDate}</span>
                </div>
                <div className="summary-kv-item">
                  <span className="label">Khung giờ</span>
                  <span className="value">{formattedTime}</span>
                </div>
                <div className="summary-kv-item">
                  <span className="label">Bệnh nhân</span>
                  <span className="value">
                    {selectedProfile?.full_name || '--'}
                  </span>
                </div>
              </div>

              <div className="summary-price-total">
                <span>Phí khám:</span>
                <strong>{money(doctor?.consultation_fee || 0)}</strong>
              </div>

              <button
                type="button"
                className="summary-submit-btn"
                disabled={busy || !chosenSlot || !activeProfileId}
                onClick={submit}
              >
                {busy ? 'Đang giữ chỗ…' : 'Đặt lịch'}
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
        onClose={() => setIsModalOpen(false)}
        onCreated={newProfile => {
          setProfileId(newProfile.id)
          refresh(v => v + 1)
          key.current = null
        }}
      />
    </section>
  )
}
