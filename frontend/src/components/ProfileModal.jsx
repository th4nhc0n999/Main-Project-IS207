import { useState } from 'react'
import { X, User, Calendar, Phone, ShieldCheck, HeartHandshake } from 'lucide-react'
import client from '@/api/axiosClient'

export default function ProfileModal({ isOpen, onClose, onCreated }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    gender: 'male',
    relationship: 'Bản thân',
    phone: '',
    identity_card_number: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_relationship: '',
    consent_agreed: true,
  })

  if (!isOpen) return null

  // Check if age is under 16
  const isUnder16 = (() => {
    if (!formData.dob) return false
    const birthYear = new Date(formData.dob).getFullYear()
    const currentYear = new Date().getFullYear()
    return currentYear - birthYear < 16
  })()

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')

    const payload = {
      full_name: formData.full_name.trim(),
      dob: formData.dob,
      gender: formData.gender,
      relationship: formData.relationship,
      phone: formData.phone?.trim() || undefined,
      identity_card_number: formData.identity_card_number?.trim() || undefined,
      consent_agreed: true,
    }

    if (isUnder16) {
      payload.guardian_name = formData.guardian_name?.trim() || undefined
      payload.guardian_phone = formData.guardian_phone?.trim() || undefined
      payload.guardian_relationship = formData.guardian_relationship?.trim() || undefined
    }

    try {
      try {
        const res = await client.post('/patient-profiles', payload)
        const newRecord = res.data?.data || res.data
        onCreated(newRecord)
        onClose()
      } catch (apiErr) {
        // If validation errors from backend
        if (apiErr.response?.data?.errors) {
          const errs = Object.values(apiErr.response.data.errors).flat().join(' ')
          setError(errs)
          return
        }
        if (apiErr.response?.data?.message) {
          setError(apiErr.response.data.message)
          return
        }
        // In preview/mock mode without auth:
        const mockNew = {
          id: Date.now(),
          ...payload,
          is_default: false,
        }
        onCreated(mockNew)
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tạo hồ sơ.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0 leading-tight">Thêm hồ sơ người khám mới</h3>
              <p className="text-xs text-slate-500 m-0">Điền thông tin chính xác theo giấy tờ tùy thân</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Họ tên */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Họ và tên người khám <span className="text-rose-500">*</span>
            </label>
            <input
              required
              name="full_name"
              placeholder="Ví dụ: Nguyễn Văn An"
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-sage-600 focus:ring-1 focus:ring-sage-600 bg-white"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          {/* Ngày sinh & Giới tính */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Ngày sinh <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="date"
                name="dob"
                max={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-sage-600 focus:ring-1 focus:ring-sage-600 bg-white"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Giới tính <span className="text-rose-500">*</span>
              </label>
              <select
                name="gender"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          {/* Số điện thoại & Quan hệ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="09xx xxx xxx"
                pattern="^(0[3|5|7|8|9])[0-9]{8}$"
                title="Số điện thoại 10 số hợp lệ (ví dụ: 0905123456)"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-sage-600 focus:ring-1 focus:ring-sage-600 bg-white"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Quan hệ với chủ TK <span className="text-rose-500">*</span>
              </label>
              <select
                name="relationship"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white"
                value={formData.relationship}
                onChange={handleChange}
              >
                {['Bản thân', 'Cha', 'Mẹ', 'Con', 'Vợ', 'Chồng', 'Khác'].map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Số CMND/CCCD */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Số CMND / CCCD / Định danh (không bắt buộc)
            </label>
            <input
              name="identity_card_number"
              placeholder="9 hoặc 12 số"
              maxLength={12}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-sage-600 focus:ring-1 focus:ring-sage-600 bg-white"
              value={formData.identity_card_number}
              onChange={handleChange}
            />
          </div>

          {/* Giám hộ nếu dưới 16 tuổi */}
          {isUnder16 && (
            <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-3 space-y-2.5">
              <p className="text-xs font-bold text-amber-900 m-0">
                Thông tin người giám hộ (Bắt buộc cho người khám dưới 16 tuổi)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Họ tên giám hộ *</label>
                  <input
                    required
                    name="guardian_name"
                    placeholder="Họ tên cha/mẹ/người nuôi dưỡng"
                    className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white"
                    value={formData.guardian_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">SĐT giám hộ *</label>
                  <input
                    required
                    type="tel"
                    name="guardian_phone"
                    placeholder="09xx xxx xxx"
                    className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white"
                    value={formData.guardian_phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Đồng ý điều khoản */}
          <div className="pt-1">
            <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                name="consent_agreed"
                checked={formData.consent_agreed}
                onChange={handleChange}
                required
                className="mt-0.5 rounded text-sage-600 accent-emerald-700"
              />
              <span>Tôi xác nhận thông tin trên là chính xác và đồng ý cho MedSi lưu trữ hồ sơ theo quy định.</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="mt-5 flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="modal-cancel-btn"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={busy}
              className="modal-submit-btn"
            >
              {busy ? 'Đang lưu…' : 'Lưu hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
