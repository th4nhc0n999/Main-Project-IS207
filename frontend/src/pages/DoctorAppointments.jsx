import { useState } from 'react'
import { ShieldCheck, User, Calendar, Clock, Phone, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import useApi from '@/api/useApi'
import client from '@/api/axiosClient'
import { maskCCCD, maskPhone, maskBHYT, getStoredBookings } from '@/lib/mockData'
import { useAuth } from '@/context/AuthContext'

export default function DoctorAppointments() {
  const { user } = useAuth()
  const [revision, refresh] = useState(0)
  const [issue, setIssue] = useState('')
  const [busy, setBusy] = useState(false)
  const { data, error } = useApi('/doctor/appointments', revision)

  async function change(id, action) {
    setIssue('')
    setBusy(true)
    try {
      await client.post('/doctor/appointments/' + id + '/' + action)
      refresh((v) => v + 1)
    } catch (err) {
      setIssue(err.message)
    } finally {
      setBusy(false)
    }
  }

  // Fallback danh sách ca khám bác sĩ khi chạy demo / mock
  const fallbackBookings = [
    {
      id: 91048,
      code: "MEDSI-91048",
      work_date: "2026-09-23",
      start_time: "09:00 - 10:00",
      status: "confirmed",
      patient_name: "Nguyễn Văn A",
      symptoms: "Thường xuyên tức ngực trái khi vận động nhẹ, huyết áp dao động 140/90 mmHg. (Có mang theo kết quả siêu âm tim 3 tháng trước).",
      patient_snapshot: {
        full_name: "Nguyễn Văn A",
        dob: "1992-06-15",
        gender: "Nam",
        phone: "090*****67",
        identity_card_number: "079******234",
        health_insurance_code: "DN5******099",
        guardian_name: null,
        guardian_phone: null,
      }
    },
    {
      id: 91049,
      code: "MEDSI-91049",
      work_date: "2026-09-23",
      start_time: "10:30 - 11:30",
      status: "checked_in",
      patient_name: "Nguyễn Gia Bảo (Trẻ em)",
      symptoms: "Khám định kỳ nhịp tim trẻ em, theo dõi sau can thiệp.",
      patient_snapshot: {
        full_name: "Nguyễn Gia Bảo",
        dob: "2018-09-20",
        gender: "Nam",
        phone: "090*****67",
        identity_card_number: "Chưa cấp (Dưới 16t)",
        health_insurance_code: "DN4******888",
        guardian_name: "Nguyễn Văn A",
        guardian_phone: "090*****67",
        guardian_relationship: "Cha"
      }
    }
  ]

  const displayBookings = data?.data && data.data.length > 0 ? data.data : fallbackBookings

  return (
    <section className="clinic max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>👨‍⚕️ Lịch Tiếp Khám Bác Sĩ</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Chuyên khoa Tim Mạch
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Bác sĩ: <strong>{user?.name || "BS. CKII Nguyễn Văn Hùng"}</strong> — Dữ liệu bệnh nhân hiển thị dưới dạng Bản chụp y tế (Patient Snapshot) đã che mờ bảo mật theo Task S4-24.
          </p>
        </div>

        <button
          onClick={() => refresh((v) => v + 1)}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition-all self-start sm:self-auto shrink-0"
        >
          Cập nhật lịch
        </button>
      </div>

      {issue && <p role="alert" className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">{issue}</p>}

      <div className="space-y-5">
        {displayBookings.map((b) => {
          const snap = b.patient_snapshot || {
            full_name: b.patient_name || "Bệnh nhân",
            phone: maskPhone(b.patient_phone || "0901234567"),
            identity_card_number: maskCCCD("079092001234"),
            health_insurance_code: maskBHYT("DN5010123456099"),
          }

          return (
            <article key={b.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 text-xs sm:text-sm">
                    {b.code}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    b.status === 'checked_in' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {b.status === 'checked_in' ? 'Đã Check-in · Chờ khám' : 'Đã duyệt · Chờ tiếp nhận'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.work_date}</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                  <span>{b.start_time}</span>
                </div>
              </div>

              {/* Thông tin triệu chứng */}
              {b.symptoms && (
                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700">
                  <strong className="text-slate-900">Triệu chứng ban đầu:</strong> {b.symptoms}
                </div>
              )}

              {/* KHỐI BẢN CHỤP HỒ SƠ BỆNH NHÂN (PATIENT SNAPSHOT - S4-24) */}
              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sky-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Bản Chụp Hồ Sơ Bệnh Nhân (Patient Snapshot)</span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200">
                    Dữ liệu bảo mật đã che mờ
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Họ tên bệnh nhân:</span>
                    <strong className="text-slate-900">{snap.full_name || b.patient_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Số điện thoại:</span>
                    <span className="font-mono font-medium">{maskPhone(snap.phone)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Số CCCD / Định danh:</span>
                    <span className="font-mono font-medium">{maskCCCD(snap.identity_card_number || snap.identity_card)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Mã thẻ BHYT:</span>
                    <span className="font-mono font-medium">{maskBHYT(snap.health_insurance_code)}</span>
                  </div>
                  {snap.guardian_name && (
                    <div className="col-span-2 sm:col-span-4 pt-1 border-t border-sky-100 flex items-center gap-2 text-[11px] text-slate-600">
                      <span>Người giám hộ (dưới 16t):</span>
                      <strong className="text-slate-800">{snap.guardian_name}</strong>
                      <span>({snap.guardian_relationship || "Giám hộ"})</span>
                      <span>— SĐT: <code className="text-sky-800">{maskPhone(snap.guardian_phone)}</code></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex justify-end gap-2">
                {b.status === 'confirmed' ? (
                  <span className="text-xs text-slate-500 italic">Phiếu khám sẵn sàng đón bệnh nhân</span>
                ) : (
                  <button
                    disabled={busy}
                    onClick={() => change(b.id, b.status === 'checked_in' ? 'complete' : 'approve')}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all"
                  >
                    {b.status === 'checked_in' ? 'Hoàn tất ca khám' : 'Duyệt lịch khám'}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
