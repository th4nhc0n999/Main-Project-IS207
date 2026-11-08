import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { 
  ClipboardList, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Database 
} from "lucide-react"
import { 
  getStoredBookings, 
  saveBookings, 
  getStoredSlots, 
  saveSlots, 
  formatCurrency, 
  formatDateVN 
} from "@/lib/mockData"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState(() => getStoredBookings())
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedDetailBooking, setSelectedDetailBooking] = useState(null)

  // Metrics summary
  const metrics = useMemo(() => {
    const total = bookings.length
    const pending = bookings.filter((b) => b.status === "pending").length
    const confirmed = bookings.filter((b) => b.status === "confirmed").length
    const completed = bookings.filter((b) => b.status === "completed").length
    const cancelled = bookings.filter((b) => b.status === "cancelled").length
    const totalRevenue = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((acc, b) => acc + (b.payment?.total_amount || 0), 0)

    return { total, pending, confirmed, completed, cancelled, totalRevenue }
  }, [bookings])

  // Filtered list
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        !searchTerm ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.patient_phone.includes(searchTerm) ||
        (b.doctor_name && b.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchStatus = statusFilter === "all" || b.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [bookings, searchTerm, statusFilter])

  // Action: Update status (confirm, complete, cancel)
  const handleUpdateStatus = (bookingId, newStatus) => {
    const targetBooking = bookings.find(b => b.id === bookingId)

    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: newStatus,
          updated_at: new Date().toISOString(),
          payment: {
            ...b.payment,
            status: newStatus === "completed" ? "paid" : b.payment?.status,
          }
        }
      }
      return b
    })

    setBookings(updated)
    saveBookings(updated)

    // If cancelled, free slot booked_count
    if (newStatus === "cancelled" && targetBooking && targetBooking.status !== "cancelled") {
      const allSlots = getStoredSlots()
      const updatedSlots = allSlots.map((s) => {
        if (s.id === targetBooking.slot_id && s.booked_count > 0) {
          return {
            ...s,
            booked_count: s.booked_count - 1,
            status: "available",
          }
        }
        return s
      })
      saveSlots(updatedSlots)
    }

    if (selectedDetailBooking?.id === bookingId) {
      setSelectedDetailBooking({
        ...selectedDetailBooking,
        status: newStatus,
      })
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning" className="text-[10px] font-semibold"><Clock className="w-3 h-3 mr-1" /> Chờ Duyệt</Badge>
      case "confirmed":
        return <Badge variant="success" className="text-[10px] font-semibold"><CheckCircle2 className="w-3 h-3 mr-1" /> Đã Duyệt</Badge>
      case "completed":
        return <Badge variant="purple" className="text-[10px] font-semibold"><CheckCircle2 className="w-3 h-3 mr-1" /> Đã Khám</Badge>
      case "cancelled":
        return <Badge variant="danger" className="text-[10px] font-semibold"><XCircle className="w-3 h-3 mr-1" /> Đã Hủy</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Admin Top Header */}
      <div className="bg-sage-900 text-white py-8 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Phân Hệ Quản Trị Hệ Thống</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Quản Lý Toàn Bộ Lịch Hẹn Khám
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Kiểm soát quy trình đặt lịch, duyệt phiếu, cập nhật trạng thái và giải phóng khung giờ.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-white px-3 py-1.5 rounded-lg shadow-xs">
              <img src="/logo.png" alt="MedSi" className="h-8 w-auto object-contain" />
            </div>
            <Button asChild variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold">
              <Link to="/admin/catalog">
                <Database className="w-4 h-4 mr-1.5 text-amber-400" />
                <span>Quản Lý Danh Mục & Slots</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tổng lượt đặt</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</div>
            <span className="text-[10px] text-slate-500">Toàn bộ phiếu khám</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Chờ duyệt</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{metrics.pending}</div>
            <span className="text-[10px] text-amber-600">Cần xử lý ngay</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Đã duyệt</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{metrics.confirmed}</div>
            <span className="text-[10px] text-emerald-600">Sẵn sàng phục vụ</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/30 shadow-sm">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Đã khám xong</span>
            <div className="text-2xl font-black text-purple-600 mt-1">{metrics.completed}</div>
            <span className="text-[10px] text-purple-600">Hoàn tất quy trình</span>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-2xl border border-sage-200 bg-sage-50/30 shadow-sm">
            <span className="text-[11px] font-bold text-sage-700 uppercase tracking-wider block">Doanh thu dự kiến</span>
            <div className="text-xl font-black text-sage-600 mt-1">{formatCurrency(metrics.totalRevenue)}</div>
            <span className="text-[10px] text-sage-600">Bao gồm phí dịch vụ</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search bar */}
          <div className="w-full md:w-96 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã phiếu, tên bệnh nhân, SĐT, bác sĩ..."
              className="pl-10 h-10 text-xs bg-slate-50 border-slate-200 rounded-xl focus-visible:bg-white"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st === "all" ? "Tất cả" : st === "pending" ? "Chờ duyệt" : st === "confirmed" ? "Đã duyệt" : st === "completed" ? "Đã khám" : "Đã hủy"}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Mã Phiếu</th>
                  <th className="p-4">Bệnh Nhân</th>
                  <th className="p-4">Bác Sĩ / CSYT</th>
                  <th className="p-4">Khung Giờ Khám</th>
                  <th className="p-4">Tổng Tiền</th>
                  <th className="p-4">Trạng Thái</th>
                  <th className="p-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Không tìm thấy lịch hẹn nào phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Code */}
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {b.code}
                      </td>

                      {/* Patient */}
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{b.patient_name}</p>
                        <p className="text-slate-500 text-[11px]">SĐT: {b.patient_phone}</p>
                        <span className="text-[10px] text-slate-400">({b.relationship})</span>
                      </td>

                      {/* Doctor / Specialty */}
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{b.doctor_name || b.hospital_name}</p>
                        <p className="text-sage-600 font-medium text-[11px]">{b.specialty_name || b.exam_type_name}</p>
                      </td>

                      {/* Date & Slot */}
                      <td className="p-4">
                        <p className="font-semibold text-slate-800">{formatDateVN(b.work_date)}</p>
                        <p className="text-slate-500 font-mono text-[11px]">{b.start_time} - {b.end_time}</p>
                      </td>

                      {/* Total Fee & Payment */}
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{formatCurrency(b.payment?.total_amount)}</p>
                        <span className={`text-[10px] font-semibold ${
                          b.payment?.status === "paid" ? "text-emerald-600" : "text-amber-600"
                        }`}>
                          {b.payment?.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="p-4">
                        {getStatusBadge(b.status)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDetailBooking(b)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-sage-600"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {/* Quick Confirm */}
                          {b.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(b.id, "confirmed")}
                              className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                              title="Duyệt lịch hẹn"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Duyệt
                            </Button>
                          )}

                          {/* Complete visit */}
                          {b.status === "confirmed" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(b.id, "completed")}
                              className="h-8 px-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
                              title="Xác nhận hoàn thành khám"
                            >
                              Đã khám
                            </Button>
                          )}

                          {/* Cancel booking */}
                          {(b.status === "pending" || b.status === "confirmed") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(b.id, "cancelled")}
                              className="h-8 px-2 text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
                              title="Hủy phiếu khám"
                            >
                              Hủy
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BOOKING DETAIL MODAL */}
      {selectedDetailBooking && (
        <div className="med-dialog-overlay fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm bg-slate-100 px-2.5 py-1 rounded-md">
                  {selectedDetailBooking.code}
                </span>
                {getStatusBadge(selectedDetailBooking.status)}
              </div>
              <button
                onClick={() => setSelectedDetailBooking(null)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Thông tin bệnh nhân</span>
                <p className="font-bold text-slate-900 text-sm">{selectedDetailBooking.patient_name}</p>
                <p className="text-slate-600">SĐT: {selectedDetailBooking.patient_phone} • Quan hệ: {selectedDetailBooking.relationship}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Bác sĩ / Khung giờ</span>
                <p className="font-bold text-slate-900">{selectedDetailBooking.doctor_name || selectedDetailBooking.hospital_name}</p>
                <p className="text-sage-700 font-semibold">{selectedDetailBooking.start_time} - {selectedDetailBooking.end_time}, ngày {formatDateVN(selectedDetailBooking.work_date)}</p>
                <p className="text-slate-500">{selectedDetailBooking.hospital_name}</p>
              </div>

              {selectedDetailBooking.symptoms && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Triệu chứng & Ghi chú</span>
                  <p className="text-slate-700">{selectedDetailBooking.symptoms}</p>
                  {selectedDetailBooking.note && <p className="text-slate-500 italic mt-1">{selectedDetailBooking.note}</p>}
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-sage-50/70 border border-sage-100 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-sage-800 uppercase">Tổng tiền thanh toán</span>
                  <p className="text-sm font-bold text-sage-900">{formatCurrency(selectedDetailBooking.payment?.total_amount)}</p>
                </div>
                <Badge variant={selectedDetailBooking.payment?.status === "paid" ? "success" : "warning"}>
                  {selectedDetailBooking.payment?.method?.toUpperCase()} ({selectedDetailBooking.payment?.status === "paid" ? "Đã trả" : "Chưa trả"})
                </Badge>
              </div>
            </div>

            {/* Quick Status Modifiers */}
            <div className="pt-2 flex flex-wrap gap-2 justify-end border-t border-slate-100">
              {selectedDetailBooking.status === "pending" && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  onClick={() => handleUpdateStatus(selectedDetailBooking.id, "confirmed")}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Duyệt lịch hẹn
                </Button>
              )}

              {selectedDetailBooking.status === "confirmed" && (
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  onClick={() => handleUpdateStatus(selectedDetailBooking.id, "completed")}
                >
                  Xác nhận hoàn thành khám
                </Button>
              )}

              {(selectedDetailBooking.status === "pending" || selectedDetailBooking.status === "confirmed") && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedDetailBooking.id, "cancelled")}
                >
                  Hủy lịch hẹn
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDetailBooking(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
