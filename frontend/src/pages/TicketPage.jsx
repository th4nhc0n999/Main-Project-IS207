import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { hospitalBookingApi as api } from '@/api/hospitalBookingApi'
import { useAuth } from '@/context/AuthContext'

export default function TicketPage() {
  const { bookingId } = useParams()
  const { user, loading } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    let active = true
    api.ticket(bookingId).then((res) => { if (active) setData(res.data) })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [bookingId, user])

  async function download() {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1000
      canvas.height = 1500
      const context = canvas.getContext('2d')
      const commands = []
      let y = 70
      function line(text, size = 28) {
        context.font = `${size}px sans-serif`
        let current = ''
        for (const word of String(text || '').split(/\s+/)) {
          if (context.measureText(`${current} ${word}`).width > 860) {
            commands.push({ text: current, size, y }); y += 40; current = word
          } else current = `${current} ${word}`.trim()
        }
        commands.push({ text: current, size, y }); y += 45
      }
      line('MedSi · PHIẾU KHÁM', 40)
      line(data.ticket.ticket_code)
      line(`Trạng thái phiếu: ${data.ticket.status}`)
      line(`Số thứ tự: ${data.ticket.queue_number}`, 38)
      line(data.hospital_name || data.doctor_name)
      line(data.hospital_address)
      line(`Chuyên khoa: ${data.specialty_name}`)
      line(`Người khám: ${data.patient_snapshot.full_name}`)
      line(`${data.work_date} · ${data.start_time}–${data.end_time}`)
      if (data.ticket.room_number) line(`Phòng: ${data.ticket.room_number}`)
      const qr = new Image()
      qr.src = data.ticket.qr_png_data_uri
      await qr.decode()
      commands.push({ image: qr, y })
      y += 450
      line('Dặn dò chuyên khoa', 30)
      line(data.ticket.instructions || 'Vui lòng đến quầy tiếp đón trước giờ hẹn 15 phút.')
      canvas.height = y + 60
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#0f172a'
      for (const command of commands) {
        if (command.image) context.drawImage(command.image, 300, command.y, 400, 400)
        else { context.font = `${command.size}px sans-serif`; context.fillText(command.text, 70, command.y) }
      }
      const link = document.createElement('a')
      link.download = `${data.ticket.ticket_code}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch { setError('Không thể tải ảnh phiếu. Vui lòng thử lại.') }
  }

  if (loading) return <p className="p-8">Đang kiểm tra đăng nhập…</p>
  if (!user) return <p className="p-8">Vui lòng <Link className="text-sky-700 underline" to="/login">đăng nhập</Link> để xem phiếu.</p>
  if (error) return <p role="alert" className="p-8 text-rose-800">{error}</p>
  if (!data) return <p role="status" className="p-8">Đang tải phiếu khám…</p>
  const valid = ['issued', 'checked_in'].includes(data.ticket.status)
  return <main className="mx-auto max-w-2xl space-y-5 p-6">
    <Link className="text-sky-700 underline print:hidden" to="/my-bookings">← Lịch khám</Link>
    <article className="space-y-4 rounded-xl border bg-white p-6">
      <h1 className="text-2xl font-bold">Phiếu khám MedSi</h1>
      <p className="font-mono">{data.ticket.ticket_code}</p>
      <p className="text-3xl font-bold text-sky-800">{data.ticket.queue_number}</p>
      <p>{data.hospital_name || data.doctor_name}</p><p>{data.hospital_address}</p>
      <p>{data.specialty_name} · {data.exam_type_name || data.doctor_name}</p>
      <p>Người khám: <strong>{data.patient_snapshot.full_name}</strong></p>
      <p>{data.work_date} · {data.start_time}–{data.end_time}</p>
      {data.ticket.room_number && <p>Phòng: {data.ticket.room_number}</p>}
      {!valid && <p className="rounded-lg bg-amber-50 p-3">Phiếu đã đóng và không còn dùng để tiếp nhận.</p>}
      <img className="mx-auto w-72 max-w-full" src={data.ticket.qr_png_data_uri} alt={`Mã QR phiếu ${data.ticket.ticket_code}`} />
      <p>Trạng thái phiếu: {data.ticket.status}</p>
      <div className="rounded-lg bg-sky-50 p-4"><h2 className="font-semibold">Dặn dò chuyên khoa</h2><p className="mt-2 whitespace-pre-wrap">{data.ticket.instructions || 'Vui lòng đến quầy tiếp đón trước giờ hẹn 15 phút.'}</p></div>
    </article>
    <div className="flex gap-3 print:hidden"><button onClick={download} className="rounded-lg bg-sky-700 px-4 py-2 text-white">Tải phiếu PNG</button><button onClick={() => window.print()} className="rounded-lg border px-4 py-2">In phiếu</button></div>
  </main>
}
