import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  QrCode,
  Home,
  Calendar,
  RotateCcw,
  FileText,
  Hospital,
  User,
  Phone,
  ShieldCheck,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '../ui/dialog';

export function PaymentResultView({
  status = 'success', // 'success' | 'failed' | 'pending'
  paymentData,
  failureReason = 'Thẻ không đủ số dư',
  onRetry,
  onChangeMethod,
  onCancelTransaction,
  onGoHome,
  onViewBooking,
}) {
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const orderCode = paymentData?.booking_code || 'BK20260918001';
  const txnCode = paymentData?.transaction_code || 'TXN20260918174438';
  const paidTime = paymentData?.paid_at || new Date().toLocaleString('vi-VN');
  const methodName = paymentData?.method?.name || 'Thẻ ATM & Tài khoản ngân hàng';
  const totalAmount =
    paymentData?.total_amount != null
      ? `${Number(paymentData.total_amount).toLocaleString('vi-VN')} đ`
      : '160.000 đ';

  const hospitalName =
    paymentData?.hospital?.name || 'Bệnh viện Đại học Y Dược TP.HCM';
  const patientName = paymentData?.patient?.full_name || 'Nguyễn Văn An';
  const examTypeName =
    paymentData?.exam_type || 'Khám Chuyên Khoa - Tiêu Chuẩn';

  const hospitalCheckInQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=CHECKIN_YOUMED_${orderCode}`;

  /* ==========================================================
     5.1. THANH TOÁN THÀNH CÔNG
  ========================================================== */
  if (status === 'success') {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Banner thành công */}
        <div className="text-center space-y-2 p-6 rounded-2xl bg-emerald-50 border border-emerald-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10 animate-in spin-in-180 duration-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-800 tracking-tight">
            Thanh toán thành công!
          </h3>
          <p className="text-xs text-emerald-700 max-w-sm mx-auto">
            Lịch hẹn khám bệnh của bạn đã được xác nhận thành công trên hệ thống YouMed và cơ sở khám.
          </p>
          <div className="pt-1">
            <Badge variant="success" className="text-xs px-3 py-1 font-bold uppercase tracking-wider">
              Trạng thái: Đã xác nhận phiếu khám
            </Badge>
          </div>
        </div>

        {/* Thông tin chi tiết giao dịch */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5 text-xs">
          <div className="text-slate-400 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
            Thông tin chi tiết giao dịch
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="text-slate-500">Mã đơn hàng:</div>
            <div className="font-mono font-bold text-slate-900 text-right">{orderCode}</div>

            <div className="text-slate-500">Mã giao dịch:</div>
            <div className="font-mono text-slate-700 text-right">{txnCode}</div>

            <div className="text-slate-500">Thời gian thanh toán:</div>
            <div className="font-medium text-slate-900 text-right">{paidTime}</div>

            <div className="text-slate-500">Phương thức:</div>
            <div className="font-medium text-slate-900 text-right truncate">{methodName}</div>

            <div className="text-slate-500">Bệnh nhân:</div>
            <div className="font-medium text-slate-900 text-right">{patientName}</div>

            <div className="text-slate-500">Cơ sở khám:</div>
            <div className="font-medium text-slate-900 text-right truncate">{hospitalName}</div>

            <div className="text-slate-500 font-semibold pt-1 border-t border-slate-100">
              Số tiền đã thanh toán:
            </div>
            <div className="font-black text-emerald-600 text-base text-right pt-1 border-t border-slate-100">
              {totalAmount}
            </div>
          </div>
        </div>

        {/* Hướng dẫn Check-in tại Bệnh viện */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
          <QrCode className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 space-y-1">
            <div className="font-bold">Mã QR Tiếp nhận khám bệnh viện</div>
            <p className="text-blue-800 leading-relaxed">
              Bạn có thể mở hoặc tải biên nhận có mã QR bên dưới để xuất trình tại quầy lễ tân hoặc ki-ốt tiếp đón tự động khi đến khám.
            </p>
          </div>
        </div>

        {/* Action Buttons theo spec */}
        <div className="space-y-2.5 pt-1">
          <Button
            type="button"
            onClick={() => setShowReceiptModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-12 text-sm shadow-md"
          >
            <Download className="w-4 h-4 mr-2" /> Tải hóa đơn / Xem QR Code tiếp nhận
          </Button>

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onViewBooking}
              className="w-full text-xs font-semibold"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Xem lịch hẹn
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={onGoHome}
              className="w-full text-xs font-semibold"
            >
              <Home className="w-3.5 h-3.5 mr-1.5" /> Về trang chủ
            </Button>
          </div>
        </div>

        {/* MODAL XUẤT HÓA ĐƠN & QR CODE CHECK-IN BỆNH VIỆN */}
        <Dialog open={showReceiptModal} onClose={() => setShowReceiptModal(false)}>
          <DialogHeader>
            <DialogTitle>Phiếu Khám Bệnh & Biên Nhận Điện Tử</DialogTitle>
          </DialogHeader>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4 my-2">
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              {hospitalName}
            </div>

            {/* QR Check-in */}
            <div className="p-3 bg-white rounded-xl shadow-xs inline-block border border-slate-200">
              <img
                src={hospitalCheckInQrUrl}
                alt="Hospital Check-in QR"
                className="w-44 h-44 object-contain mx-auto"
              />
              <div className="font-mono text-xs font-bold text-slate-900 mt-2">
                MÃ TIẾP NHẬN: {orderCode}
              </div>
            </div>

            <div className="text-left text-xs space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Bệnh nhân:</span>
                <span className="font-bold text-slate-900">{patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Loại khám:</span>
                <span className="font-medium text-slate-800">{examTypeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đã thanh toán:</span>
                <span className="font-bold text-emerald-600">{totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold text-blue-600">ĐÃ XÁC NHẬN</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              size="sm"
            >
              <Printer className="w-3.5 h-3.5 mr-1" /> In phiếu
            </Button>
            <Button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              size="sm"
            >
              Đóng
            </Button>
          </div>
        </Dialog>
      </div>
    );
  }

  /* ==========================================================
     5.2. THANH TOÁN THẤT BẠI
  ========================================================== */
  if (status === 'failed') {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center space-y-2 p-6 rounded-2xl bg-rose-50 border border-rose-200">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <XCircle className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-rose-800 tracking-tight">
            Thanh toán thất bại
          </h3>
          <p className="text-xs text-rose-700 max-w-sm mx-auto leading-relaxed">
            Giao dịch không thành công. Tài khoản của bạn chưa bị trừ tiền hoặc tiền sẽ được hoàn trả tự động nếu đã trừ.
          </p>
        </div>

        {/* Lý do thất bại */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            Lý do không thành công:
          </div>
          <div className="p-3 rounded-lg bg-white border border-rose-200 text-rose-800 font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{failureReason}</span>
          </div>
          <div className="text-[11px] text-slate-500 leading-relaxed pt-1">
            Một số nguyên nhân thường gặp: Sai mã xác thực OTP, số dư khả dụng không đủ, thẻ chưa kích hoạt thanh toán trực tuyến, hoặc quá thời gian xác thực từ phía ngân hàng.
          </div>
        </div>

        {/* Buttons theo spec */}
        <div className="space-y-2.5 pt-1">
          <Button
            type="button"
            onClick={onRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-11 text-sm shadow-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Thử lại thanh toán
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onChangeMethod}
            className="w-full font-semibold text-xs h-10"
          >
            Chọn phương thức thanh toán khác
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onCancelTransaction}
            className="w-full text-slate-500 hover:text-rose-600 text-xs"
          >
            Hủy giao dịch & Quay về
          </Button>
        </div>
      </div>
    );
  }

  /* ==========================================================
     5.3. ĐANG CHỜ XÁC NHẬN (PENDING)
  ========================================================== */
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center space-y-2 p-6 rounded-2xl bg-amber-50 border border-amber-200">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black text-amber-900 tracking-tight">
          Giao dịch đang được xác nhận
        </h3>
        <p className="text-xs text-amber-800 max-w-sm mx-auto leading-relaxed">
          Cổng thanh toán đang đối soát thông tin giao dịch của bạn. Vui lòng chờ trong giây lát hoặc kiểm tra lại sau.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Mã đơn hàng:</span>
          <span className="font-mono font-bold text-slate-900">{orderCode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Tổng tiền:</span>
          <span className="font-bold text-blue-600">{totalAmount}</span>
        </div>
        <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          * Trong trường hợp tài khoản đã bị trừ tiền nhưng chưa nhận kết quả, hệ thống sẽ tự động cập nhật ngay sau khi nhận được thông báo phản hồi (callback) từ ngân hàng.
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        <Button
          type="button"
          onClick={onRetry}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 text-sm shadow-sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Kiểm tra trạng thái ngay
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onViewBooking}
          className="w-full text-xs font-semibold"
        >
          Về lịch sử đặt khám
        </Button>
      </div>
    </div>
  );
}
