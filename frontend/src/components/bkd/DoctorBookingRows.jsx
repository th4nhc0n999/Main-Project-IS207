import { statusLabel } from './bookingPresentation'

function Status({ value }) {
  const color = ['confirmed', 'completed'].includes(value) ? 'bg-sage-100 text-sage-700'
    : ['cancelled', 'rejected', 'expired', 'no_show'].includes(value) ? 'bg-[#FFF2EE] text-[#842E25]' : 'bg-slate-100 text-slate-700'
  return <span className={`inline-block rounded-full px-3 py-1 text-sm ${color}`}>{statusLabel(value)}</span>
}

export default function DoctorBookingRows({ bookings, renderActions, renderDeadline }) {
  return <>
    <div className="hidden overflow-x-auto rounded-[14px] border border-[var(--med-line)] bg-white md:block">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Danh sách lịch khám của bác sĩ</caption>
        <thead className="bg-sage-100 text-sage-900"><tr>
          {['Mã lịch', 'Người khám', 'Ca khám', 'Trạng thái', ...(renderDeadline ? ['Hạn duyệt'] : []), 'Thao tác'].map(label => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}
        </tr></thead>
        <tbody>{bookings.map(booking => <tr key={booking.id} className="border-t border-[var(--med-line)]">
          <th scope="row" className="px-4 py-4 font-semibold">{booking.code}</th>
          <td className="px-4 py-4">{booking.patient?.full_name || 'Chưa có tên người khám'}</td>
          <td className="whitespace-nowrap px-4 py-4 tabular-nums">{booking.slot?.work_date}<br/>{booking.slot?.start_time?.slice(0, 5)} – {booking.slot?.end_time?.slice(0, 5)}</td>
          <td className="px-4 py-4"><Status value={booking.status}/></td>
          {renderDeadline && <td className="px-4 py-4">{renderDeadline(booking)}</td>}
          <td className="px-4 py-4"><div className="flex flex-wrap gap-2">{renderActions(booking)}</div></td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className="grid gap-4 md:hidden">{bookings.map(booking => <article key={booking.id} className="rounded-[14px] border border-[var(--med-line)] bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{booking.code}</h3><Status value={booking.status}/></div>
      <p className="font-semibold">{booking.patient?.full_name || 'Chưa có tên người khám'}</p>
      <p className="my-3 tabular-nums text-[var(--med-muted)]">{booking.slot?.work_date} · {booking.slot?.start_time?.slice(0, 5)} – {booking.slot?.end_time?.slice(0, 5)}</p>
      {renderDeadline && <div className="mb-3">{renderDeadline(booking)}</div>}
      <div className="flex flex-wrap gap-3">{renderActions(booking)}</div>
    </article>)}</div>
  </>
}
