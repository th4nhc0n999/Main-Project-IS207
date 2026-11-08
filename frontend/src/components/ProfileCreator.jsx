import { useState } from 'react'
import { createPatientProfile } from '@/api/profileApi'

export default function ProfileCreator({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [dob, setDob] = useState('')

  // Tính tuổi tự động
  const isUnder16 = (() => {
    if (!dob) return false
    const birthYear = new Date(dob).getFullYear()
    return new Date().getFullYear() - birthYear < 16
  })()

  async function save(e) {
    e.preventDefault()
    const fields = Object.fromEntries(new FormData(e.currentTarget))
    setBusy(true)
    setError('')
    try {
      const res = await createPatientProfile({ ...fields, consent_agreed: true })
      onCreated(res.data || fields)
      setOpen(false)
    } catch (err) {
      setError(Object.values(err.errors || {}).flat().join(' ') || err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}>
        {open ? 'Đóng biểu mẫu' : '+ Tạo hồ sơ mới'}
      </button>

      {open && (
        <form className="profile-form" onSubmit={save}>
          <label>
            Họ tên người khám
            <input name="full_name" maxLength={150} required placeholder="Ví dụ: Nguyễn Văn A" />
          </label>

          <label>
            Ngày sinh
            <input
              type="date"
              name="dob"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </label>

          <label>
            Giới tính
            <select name="gender">
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </label>

          <label>
            Số CCCD / Định danh
            <input name="identity_card_number" maxLength={12} placeholder="Nhập 12 số CCCD (nếu có)" />
          </label>

          <label>
            Quan hệ với chủ tài khoản
            <select name="relationship">
              {['Bản thân', 'Cha', 'Mẹ', 'Con', 'Vợ', 'Chồng', 'Khác'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          {isUnder16 ? (
            <div style={{ border: '1px solid #bae6fd', background: '#f0f9ff', padding: '10px', borderRadius: '8px', margin: '8px 0' }}>
              <strong style={{ color: '#0369a1', fontSize: '12px' }}>
                🛡️ Thông tin Người giám hộ (Bắt buộc cho trẻ dưới 16 tuổi theo Luật Trẻ em 2016)
              </strong>
              <label style={{ marginTop: '6px' }}>
                Tên người giám hộ
                <input name="guardian_name" required placeholder="Họ và tên cha / mẹ / giám hộ" />
              </label>
              <label>
                Điện thoại người giám hộ
                <input type="tel" name="guardian_phone" required placeholder="0901234567" />
              </label>
              <label>
                Quan hệ với trẻ
                <select name="guardian_relationship">
                  <option value="Cha">Cha</option>
                  <option value="Mẹ">Mẹ</option>
                  <option value="Người giám hộ hợp pháp">Người giám hộ hợp pháp</option>
                </select>
              </label>
            </div>
          ) : (
            <details>
              <summary>Người giám hộ (bắt buộc khi người khám dưới 16 tuổi)</summary>
              <label>
                Tên người giám hộ
                <input name="guardian_name" />
              </label>
              <label>
                Điện thoại người giám hộ
                <input type="tel" name="guardian_phone" />
              </label>
              <label>
                Quan hệ với trẻ
                <input name="guardian_relationship" />
              </label>
            </details>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginTop: '8px' }}>
            <input type="checkbox" required defaultChecked />
            <span>Tôi đồng ý cho MedSi xử lý dữ liệu hồ sơ cá nhân y tế theo Nghị định 13/2023/NĐ-CP.</span>
          </label>

          {error && <p role="alert" style={{ color: '#e11d48', fontSize: '12px', marginTop: '6px' }}>{error}</p>}

          <button disabled={busy} style={{ marginTop: '10px' }}>
            {busy ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </button>
        </form>
      )}
    </div>
  )
}
