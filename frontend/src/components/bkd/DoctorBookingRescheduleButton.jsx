import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PatientCancellation } from './DoctorBookingCancelButton'

export default function DoctorBookingRescheduleButton({ booking, onResult }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (user?.role !== 'patient' || String(booking.user_id) !== String(user.id)
    || booking.booking_type !== 'doctor' || booking.status !== 'confirmed') return null

  function chooseNewSlot(cancelled) {
    const params = new URLSearchParams({
      patient_profile_id: String(cancelled.patient_profile_id),
      reschedule_from: String(cancelled.id),
    })
    // Only reached after BKD confirms cancellation; no old request_key is forwarded.
    navigate(`/doctors/${cancelled.doctor_id}?${params}`, { replace: true })
  }

  return <PatientCancellation key={`${user.id}:${booking.id}`} bookingId={booking.id}
    reschedule onResult={onResult} onCancelled={chooseNewSlot}/>
}
