import BookingSignIn from '@/components/BookingSignIn'
import {useEffect,useState,useRef} from 'react'
import {Link,useSearchParams,useNavigate} from 'react-router-dom'
import {useAuth} from '@/context/AuthContext'
import useApi from '@/api/useApi'
import doctorBookingApi from '@/api/doctorBookingApi'
import ProfileCreator from '@/components/ProfileCreator'

function bookingError(error) {
  const body = error.raw?.response?.data
  const code = body?.code || error.code
  const messages = {
    SE001: 'Ca khám đã hết chỗ hoặc trùng với lịch của hồ sơ. Vui lòng chọn ca khác.',
    VALIDATION_ERROR: 'Thông tin đặt lịch chưa hợp lệ. Vui lòng kiểm tra ca khám và hồ sơ người khám.',
    IDEMPOTENCY_CONFLICT: 'Yêu cầu đặt lịch đã được dùng với thông tin khác. Vui lòng kiểm tra Lịch khám của tôi trước khi đặt lại.',
    UNAUTHENTICATED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    FORBIDDEN: 'Tài khoản không có quyền đặt lịch này. Vui lòng dùng tài khoản bệnh nhân đang hoạt động.',
    BKD_INTEGRATION_UNAVAILABLE: 'Dịch vụ đặt lịch tạm thời chưa sẵn sàng. Vui lòng thử lại sau.',
  }
  if (messages[code]) return messages[code]
  if (error.status === 401) return messages.UNAUTHENTICATED
  if (error.status === 403) return messages.FORBIDDEN
  return error.message || 'Chưa nhận được kết quả đặt lịch. Vui lòng thử lại với thông tin hiện tại.'
}

export default function BookingConfirmPage() {
  const [params] = useSearchParams()
  const doctor = params.get('doctor'), slot = params.get('slot')
  const profileId = params.get('patient_profile_id'), rescheduleFrom = params.get('reschedule_from')
  const initialProfile = /^[1-9]\d*$/.test(profileId || '') ? profileId : ''
  const attempt = /^[1-9]\d*$/.test(rescheduleFrom || '') ? rescheduleFrom : ''
  const { user, loading } = useAuth()
  if (loading) return <p className="clinic">Đang kiểm tra tài khoản…</p>
  if (!user) return <BookingSignIn title="Chọn hồ sơ người khám"/>
  if (user.role !== 'patient') return <p className="clinic" role="alert">Vui lòng dùng tài khoản bệnh nhân để đặt lịch.</p>
  if (!/^[1-9]\d*$/.test(doctor || '') || !/^[1-9]\d*$/.test(slot || '')) {
    return <section className="clinic"><p role="alert">Thiếu thông tin bác sĩ hoặc ca khám hợp lệ.</p><Link to="/doctors">Chọn bác sĩ và ca khám</Link></section>
  }
  // A different account, doctor or slot starts a separate booking attempt.
  return <BookingConfirmation key={`${user.id}:${doctor}:${slot}:${initialProfile}:${attempt}`}
    doctor={doctor} slot={slot} initialProfile={initialProfile} rescheduleFrom={attempt}/>
}

function BookingConfirmation({ doctor, slot, initialProfile, rescheduleFrom }) {
  const [revision, refresh] = useState(0)
  const profiles = useApi('/patient-profiles', revision)
  const detail = useApi('/doctors/' + doctor)
  const [profile, setProfile] = useState(initialProfile)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [slotResult, setSlotResult] = useState(null)
  const requestKey = useRef(null)
  const submitting = useRef(false)
  const navigate = useNavigate()
  const selectionParams = new URLSearchParams()
  if (initialProfile) selectionParams.set('patient_profile_id', initialProfile)
  if (rescheduleFrom) selectionParams.set('reschedule_from', rescheduleFrom)
  const selectionPath = '/doctors/' + doctor + (selectionParams.size ? '?' + selectionParams : '')

  // The existing detail API supplies the date; BKD decides whether the slot is bookable.
  const slotDate = detail.data?.slots?.find(item => String(item.id) === slot)?.work_date
  useEffect(() => {
    if (!slotDate) return
    let active = true
    doctorBookingApi.slots(doctor, slotDate)
      .then(response => {
        if (active) setSlotResult({ date: slotDate, slots: response.data })
      })
      .catch(issue => {
        if (active) setSlotResult({ date: slotDate, error: bookingError(issue) })
      })
    return () => { active = false }
  }, [doctor, slotDate])

  const slotsReady = slotResult?.date === slotDate && Array.isArray(slotResult?.slots)
  const chosen = slotsReady ? slotResult.slots.find(item => String(item.id) === slot) : null
  const patientProfiles = Array.isArray(profiles.data?.data) ? profiles.data.data : []
  const selectedProfile = patientProfiles.find(item => String(item.id) === profile)
  const canSubmit = chosen?.can_book === true && Boolean(selectedProfile) && !busy

  function chooseProfile(id) {
    const next = String(id)
    if (next !== profile) {
      requestKey.current = null
      setProfile(next)
      setError('')
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (submitting.current || !canSubmit) return
    submitting.current = true
    setBusy(true)
    setError('')
    try {
      // Keep this key after errors/timeouts so retry cannot create a second booking.
      requestKey.current ||= crypto.randomUUID()
      const response = await doctorBookingApi.create({
        doctor_id: Number(doctor),
        slot_id: Number(slot),
        patient_profile_id: Number(profile),
        request_key: requestKey.current,
      })
      if (response.success !== true || !response.data?.id) {
        throw new Error('Chưa nhận được mã lịch khám. Vui lòng thử lại với thông tin hiện tại.')
      }
      navigate('/payment?booking_id=' + encodeURIComponent(response.data.id), { replace: true })
    } catch (issue) {
      setError(bookingError(issue))
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return <section className="clinic">
    <h1>Chọn hồ sơ người khám</h1><BookingSteps current={2}/>
    <div className="booking-columns">
      <aside className="booking-summary">
        <h2>Lịch đã chọn</h2><strong>{detail.data?.data.name}</strong><p>{detail.data?.data.hospital}</p>
        <p>{chosen?.work_date || slotDate} · {chosen?.start_time}</p>
        <Link to={selectionPath}>Đổi ca khám</Link>
      </aside>
      <article>
        <h2>Hồ sơ người khám</h2>
        <fieldset disabled={busy} className="border-0 p-0">
          <ProfileCreator onCreated={item => { chooseProfile(item.id); refresh(value => value + 1) }}/>
          <form onSubmit={submit}>
            <label>Hồ sơ bệnh nhân
              <select required value={profile} disabled={!profiles.data} onChange={event => chooseProfile(event.target.value)}>
                <option value="">Chọn hồ sơ</option>
                {patientProfiles.map(item => <option key={item.id} value={item.id}>
                  {item.full_name} — {item.relationship || 'Chưa có quan hệ'} — {item.dob ? 'Sinh năm ' + item.dob.slice(0, 4) : 'Chưa có năm sinh'}
                </option>)}
              </select>
            </label>
            {!profiles.data && !profiles.error && <p role="status">Đang tải hồ sơ…</p>}
            {profiles.data && patientProfiles.length === 0 && <p>Bạn chưa có hồ sơ người khám. Vui lòng tạo hồ sơ và đồng ý xử lý dữ liệu.</p>}
            {profiles.data && initialProfile && !patientProfiles.some(item => String(item.id) === initialProfile) && <p role="alert">Hồ sơ cũ không còn khả dụng. Vui lòng chọn hồ sơ hợp lệ của tài khoản.</p>}
            {!detail.data && !detail.error && <p role="status">Đang tải ca khám…</p>}
            {slotDate && !slotResult && <p role="status">Đang kiểm tra chỗ còn…</p>}
            {detail.data && !detail.error && (!slotDate || (slotsReady && chosen?.can_book !== true)) &&
              <p role="alert">Ca khám không còn khả dụng. <Link to={selectionPath}>Chọn ca khác</Link></p>}
            <button disabled={!canSubmit}>{busy ? 'Đang giữ chỗ…' : 'Giữ chỗ và thanh toán'}</button>
          </form>
        </fieldset>
        <p role="alert">{error || slotResult?.error || profiles.error || detail.error}</p>
      </article>
    </div>
  </section>
}
