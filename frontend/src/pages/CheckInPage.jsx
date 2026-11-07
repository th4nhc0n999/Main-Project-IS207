import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { hospitalBookingApi as api } from '@/api/hospitalBookingApi'

export default function CheckInPage() {
  const { user, loading } = useAuth()
  const [token, setToken] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [duplicateInfo, setDuplicateInfo] = useState(null)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError('')
    setMessage('')
    setDuplicateInfo(null)

    try {
      const res = await api.checkIn(token.trim())
      setMessage(`${res.message} — Mã phiếu: ${res.data.ticket_code} · STT: ${res.data.queue_number}`)
      setToken('')
    } catch (err) {
      const respData = err.raw?.response?.data || {}
      if (err.status === 409 || respData.error_code === 'EX-TKT-02') {
        setDuplicateInfo(respData.data || { already_checked_in: true })
        setMessage(respData.message || err.message || 'Phiếu khám đã được tiếp nhận trước đó.')
      } else {
        setError(err.message || 'Có lỗi xảy ra khi xác thực check-in.')
      }
    } finally {
      setPending(false)
    }
  }

  if (loading) return <p className="p-8">Đang kiểm tra đăng nhập…</p>
  if (!['staff', 'admin'].includes(user?.role)) {
    return <p className="p-8">Tiếp nhận chỉ dành cho nhân viên cơ sở và quản trị viên.</p>
  }

  return (
    <main className="mx-auto max-w-2xl space-y-5 p-6">
      <h1 className="text-2xl font-bold">Tiếp nhận bệnh nhân</h1>
      <p className="text-slate-600">Quét mã QR trên phiếu bằng máy quét hoặc dán nội dung mã vào ô bên dưới.</p>
      
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Nội dung mã QR
          <textarea
            autoFocus
            required
            maxLength={512}
            disabled={pending}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-2 min-h-32 w-full rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-sky-500 focus:outline-none"
            placeholder="Dán chuỗi JWT mã QR tại đây..."
          />
        </label>
        <button
          type="submit"
          disabled={pending || !token.trim()}
          className="rounded-lg bg-sky-700 px-5 py-3 text-white font-medium hover:bg-sky-800 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Đang kiểm tra…' : 'Xác nhận check-in'}
        </button>
      </form>

      {/* P1-02: Thông báo tiếp nhận lặp thân thiện (không báo alert đỏ) */}
      {duplicateInfo && (
        <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <span>ℹ️</span> Phiếu khám đã được tiếp nhận trước đó
          </p>
          <p className="text-sm">{message}</p>
          {duplicateInfo.ticket_code && (
            <p className="text-sm font-mono pt-1">
              Mã phiếu: <strong>{duplicateInfo.ticket_code}</strong> · STT: <strong>{duplicateInfo.queue_number}</strong>
            </p>
          )}
        </div>
      )}

      {/* Tiếp nhận thành công lần đầu */}
      {!duplicateInfo && message && (
        <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800 font-medium">
          ✓ {message}
        </div>
      )}

      {/* Lỗi thực sự (403, 404, invalid signature, v.v.) */}
      {error && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
          ✕ {error}
        </p>
      )}
    </main>
  )
}
