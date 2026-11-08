import { useState, useEffect } from 'react'
import { X, Calendar, User, Check } from 'lucide-react'
import client from '@/api/axiosClient'

const PROVINCES = [
  'Thành phố Hồ Chí Minh',
  'Thành phố Hà Nội',
  'Thành phố Đà Nẵng',
  'Thành phố Hải Phòng',
  'Thành phố Cần Thơ',
  'Tỉnh Bình Dương',
  'Tỉnh Đồng Nai',
  'Tỉnh Bà Rịa - Vũng Tàu',
  'Tỉnh Long An',
  'Tỉnh Tiền Giang',
  'Tỉnh Lâm Đồng',
  'Tỉnh Khánh Hòa',
  'Tỉnh Thừa Thiên Huế',
  'Tỉnh Quảng Nam',
  'Tỉnh Nghệ An',
  'Tỉnh Thanh Hóa',
  'Tỉnh Đắk Lắk',
  'Tỉnh Kiên Giang',
  'Khác',
]

const DISTRICTS_BY_PROVINCE = {
  'Thành phố Hồ Chí Minh': [
    'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 10',
    'Quận 11', 'Quận 12', 'Quận Bình Thạnh', 'Quận Phú Nhuận', 'Quận Gò Vấp',
    'Quận Tân Bình', 'Quận Tân Phú', 'Quận Bình Tân', 'Thành phố Thủ Đức',
    'Huyện Bình Chánh', 'Huyện Hóc Môn', 'Huyện Củ Chi', 'Huyện Nhà Bè', 'Huyện Cần Giờ',
  ],
  'Thành phố Hà Nội': [
    'Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Tây Hồ', 'Quận Long Biên', 'Quận Cầu Giấy',
    'Quận Đống Đa', 'Quận Hai Bà Trưng', 'Quận Hoàng Mai', 'Quận Thanh Xuân',
    'Quận Nam Từ Liêm', 'Quận Bắc Từ Liêm', 'Quận Hà Đông', 'Thị xã Sơn Tây',
  ],
  'Thành phố Đà Nẵng': [
    'Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn',
    'Quận Liên Chiểu', 'Quận Cẩm Lệ', 'Huyện Hòa Vang',
  ],
}

const DEFAULT_DISTRICTS = [
  'Quận 1', 'Quận 5', 'Quận 10', 'Quận Bình Thạnh', 'Quận Tân Bình', 'Thành phố Thủ Đức',
  'Quận Ba Đình', 'Quận Đống Đa', 'Quận Cầu Giấy', 'Quận Hải Châu', 'Thành phố Biên Hòa',
  'Thành phố Thủ Dầu Một', 'Khác',
]

const WARDS = [
  'Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7',
  'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 14',
  'Phường Bến Nghé', 'Phường Bến Thành', 'Phường Đa Kao', 'Phường Tân Định',
  'Phường Thảo Điền', 'Phường An Phú', 'Phường Dịch Vọng', 'Khác',
]

const ETHNICITIES = [
  'Kinh', 'Tày', 'Thái', 'Mường', 'Khmer', 'Hoa', 'Nùng', 'H\'Mông',
  'Dao', 'Gia Rai', 'Ê Đê', 'Ba Na', 'Chăm', 'Khác',
]

const OCCUPATIONS = [
  'Học sinh / Sinh viên',
  'Nhân viên văn phòng',
  'Kinh doanh / Buôn bán',
  'Kỹ sư / Kỹ thuật viên',
  'Bác sĩ / Cán bộ y tế',
  'Giáo viên / Giảng viên',
  'Công nhân',
  'Lao động tự do',
  'Nội trợ',
  'Hưu trí',
  'Khác',
]

export default function ProfileModal({
  isOpen,
  onClose,
  onCreated,
  onUpdated,
  initialData = null,
}) {
  const isEdit = Boolean(initialData && initialData.id)

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    dob: '',
    gender: 'male',
    province: '',
    district: '',
    ward: '',
    address: '',
    identity_card_number: '',
    ethnicity: 'Kinh',
    occupation: '',
    health_insurance_code: '',
    email: '',
    relationship: 'Bản thân',
    guardian_name: '',
    guardian_phone: '',
    guardian_relationship: '',
    consent_agreed: true,
  })

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name || '',
        phone: initialData.phone || '',
        dob: initialData.dob || '',
        gender: initialData.gender || 'male',
        province: initialData.province || '',
        district: initialData.district || '',
        ward: initialData.ward || '',
        address: initialData.address || '',
        identity_card_number: initialData.identity_card_number || '',
        ethnicity: initialData.ethnicity || 'Kinh',
        occupation: initialData.occupation || '',
        health_insurance_code: initialData.health_insurance_code || '',
        email: initialData.email || '',
        relationship: initialData.relationship || 'Bản thân',
        guardian_name: initialData.guardian_name || '',
        guardian_phone: initialData.guardian_phone || '',
        guardian_relationship: initialData.guardian_relationship || '',
        consent_agreed: true,
      })
    } else {
      setFormData({
        full_name: '',
        phone: '',
        dob: '',
        gender: 'male',
        province: '',
        district: '',
        ward: '',
        address: '',
        identity_card_number: '',
        ethnicity: 'Kinh',
        occupation: '',
        health_insurance_code: '',
        email: '',
        relationship: 'Bản thân',
        guardian_name: '',
        guardian_phone: '',
        guardian_relationship: '',
        consent_agreed: true,
      })
    }
    setError('')
  }, [initialData, isOpen])

  if (!isOpen) return null

  // Check if age is under 16
  const isUnder16 = (() => {
    if (!formData.dob) return false
    const birthYear = new Date(formData.dob).getFullYear()
    const currentYear = new Date().getFullYear()
    return currentYear - birthYear < 16
  })()

  const districtList = formData.province && DISTRICTS_BY_PROVINCE[formData.province]
    ? DISTRICTS_BY_PROVINCE[formData.province]
    : DEFAULT_DISTRICTS

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'province' ? { district: '', ward: '' } : {}),
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')

    const apiPayload = {
      full_name: formData.full_name.trim(),
      dob: formData.dob,
      gender: formData.gender,
      phone: formData.phone?.trim() || undefined,
      relationship: formData.relationship || 'Bản thân',
      identity_card_number: formData.identity_card_number?.trim() || undefined,
      health_insurance_code: formData.health_insurance_code?.trim() || undefined,
      consent_agreed: true,
    }

    if (isUnder16) {
      apiPayload.guardian_name = formData.guardian_name?.trim() || undefined
      apiPayload.guardian_phone = formData.guardian_phone?.trim() || undefined
      apiPayload.guardian_relationship = formData.guardian_relationship?.trim() || undefined
    }

    try {
      if (isEdit) {
        // Update existing profile
        try {
          const res = await client.put(`/patient-profiles/${initialData.id}`, apiPayload)
          const updatedRecord = { ...formData, ...(res.data?.data || res.data) }
          onUpdated ? onUpdated(updatedRecord) : onCreated?.(updatedRecord)
          onClose()
        } catch (apiErr) {
          if (apiErr.response?.data?.errors) {
            setError(Object.values(apiErr.response.data.errors).flat().join(' '))
            return
          }
          // Mock mode fallback
          const localUpdated = { ...initialData, ...formData }
          onUpdated ? onUpdated(localUpdated) : onCreated?.(localUpdated)
          onClose()
        }
      } else {
        // Create new profile
        try {
          const res = await client.post('/patient-profiles', apiPayload)
          const newRecord = { ...formData, ...(res.data?.data || res.data) }
          onCreated(newRecord)
          onClose()
        } catch (apiErr) {
          if (apiErr.response?.data?.errors) {
            setError(Object.values(apiErr.response.data.errors).flat().join(' '))
            return
          }
          if (apiErr.response?.data?.message) {
            setError(apiErr.response.data.message)
            return
          }
          // Mock mode fallback
          const localNew = {
            id: Date.now(),
            ...formData,
            is_default: false,
          }
          onCreated(localNew)
          onClose()
        }
      }
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi lưu hồ sơ.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-y-auto max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
          <h2 className="text-xl font-bold text-slate-800 m-0">
            {isEdit ? 'Chỉnh sửa hồ sơ' : 'Thêm hồ sơ mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-lg bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-slate-700">
          {/* Hàng 1 (2 cột): Họ và tên * | Số điện thoại * */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Họ và tên <span className="text-rose-500">*</span>
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="tel"
                name="phone"
                placeholder="Ví dụ: 0912345678"
                pattern="^(0[3|5|7|8|9])[0-9]{8}$"
                title="Số điện thoại 10 số hợp lệ (ví dụ: 0912345678)"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-sage-600 focus:ring-1 focus:ring-sage-600 bg-white"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Hàng 2 (2 cột): Ngày sinh * | Giới tính * */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ngày sinh <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="date"
                name="dob"
                max={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-sage-600 focus:ring-1 focus:ring-sage-600 bg-white"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Giới tính <span className="text-rose-500">*</span>
              </label>
              <div className="gender-radio-group">
                <label className="gender-radio-item">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                    className="gender-radio-input"
                  />
                  <span>Nam</span>
                </label>
                <label className="gender-radio-item">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                    className="gender-radio-input"
                  />
                  <span>Nữ</span>
                </label>
                <label className="gender-radio-item">
                  <input
                    type="radio"
                    name="gender"
                    value="other"
                    checked={formData.gender === 'other'}
                    onChange={handleChange}
                    className="gender-radio-input"
                  />
                  <span>Khác</span>
                </label>
              </div>
            </div>
          </div>

          {/* Hàng 3 (3 cột): Tỉnh / Thành phố | Quận / Huyện | Phường / Xã */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tỉnh / Thành phố
              </label>
              <select
                name="province"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white"
                value={formData.province}
                onChange={handleChange}
              >
                <option value="">Chọn Tỉnh / Thành phố</option>
                {PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Quận / Huyện
              </label>
              <select
                name="district"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white"
                value={formData.district}
                onChange={handleChange}
              >
                <option value="">Chọn Quận / Huyện</option>
                {districtList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phường / Xã
              </label>
              <select
                name="ward"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white"
                value={formData.ward}
                onChange={handleChange}
              >
                <option value="">Chọn phường xã</option>
                {WARDS.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hàng 4 (3 cột): Địa chỉ cụ thể * | Số CMND/CCCD | Dân tộc */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Địa chỉ cụ thể <span className="text-rose-500">*</span>
              </label>
              <input
                name="address"
                placeholder="Số nhà, tên đường"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-sage-600 focus:ring-1 focus:ring-sage-600 bg-white"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Số CMND/CCCD
              </label>
              <input
                name="identity_card_number"
                placeholder="Số CMND hoặc 12 số CCCD"
                maxLength={12}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-sage-600 focus:ring-1 focus:ring-sage-600 bg-white"
                value={formData.identity_card_number}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Dân tộc
              </label>
              <select
                name="ethnicity"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white"
                value={formData.ethnicity}
                onChange={handleChange}
              >
                {ETHNICITIES.map(et => (
                  <option key={et} value={et}>{et}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hàng 5 (3 cột): Nghề nghiệp | Mã thẻ BHYT | Email */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nghề nghiệp
              </label>
              <select
                name="occupation"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white"
                value={formData.occupation}
                onChange={handleChange}
              >
                <option value="">Chọn nghề nghiệp</option>
                {OCCUPATIONS.map(oc => (
                  <option key={oc} value={oc}>{oc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mã thẻ BHYT
              </label>
              <input
                name="health_insurance_code"
                placeholder="Mã số trên thẻ Bảo hiểm y tế"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-sage-600 focus:ring-1 focus:ring-sage-600 bg-white"
                value={formData.health_insurance_code}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Địa chỉ email của bạn"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-sage-600 focus:ring-1 focus:ring-sage-600 bg-white"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Hàng 6: Quan hệ với chủ tài khoản */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Quan hệ với chủ tài khoản <span className="text-rose-500">*</span>
              </label>
              <select
                name="relationship"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white"
                value={formData.relationship}
                onChange={handleChange}
              >
                {['Bản thân', 'Cha', 'Mẹ', 'Con', 'Vợ', 'Chồng', 'Khác'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Người giám hộ (nếu dưới 16 tuổi) */}
          {isUnder16 && (
            <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-3.5 space-y-2.5 mt-2">
              <p className="text-xs font-bold text-amber-900 m-0">
                Thông tin người giám hộ (Bắt buộc cho người khám dưới 16 tuổi)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Họ tên giám hộ *</label>
                  <input
                    required
                    name="guardian_name"
                    placeholder="Họ tên cha/mẹ/người nuôi dưỡng"
                    className="w-full rounded border border-slate-300 p-2 text-xs bg-white"
                    value={formData.guardian_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">SĐT giám hộ *</label>
                  <input
                    required
                    type="tel"
                    name="guardian_phone"
                    placeholder="09xx xxx xxx"
                    className="w-full rounded border border-slate-300 p-2 text-xs bg-white"
                    value={formData.guardian_phone}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Quan hệ với trẻ *</label>
                  <input
                    required
                    name="guardian_relationship"
                    placeholder="Cha / Mẹ / Giám hộ"
                    className="w-full rounded border border-slate-300 p-2 text-xs bg-white"
                    value={formData.guardian_relationship}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Đồng ý điều khoản */}
          <div className="pt-2">
            <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                name="consent_agreed"
                checked={formData.consent_agreed}
                onChange={handleChange}
                required
                className="mt-0.5 rounded text-sage-600 accent-[#2d5a27]"
              />
              <span>Tôi xác nhận thông tin trên là chính xác và đồng ý cho MedSi lưu trữ hồ sơ theo quy định.</span>
            </label>
          </div>

          {/* Footer Action Buttons */}
          <div className="mt-6 flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
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
              {busy ? 'Đang lưu…' : isEdit ? 'Lưu chỉnh sửa' : 'Lưu hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
