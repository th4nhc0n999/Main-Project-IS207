import React from 'react';
import {
  CreditCard,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Lock,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export function PaymentConfirmationModal({
  invoice,
  cardData,
  onConfirmPayment,
  onCancelPayment,
  loading,
}) {
  const bookingCode = invoice?.booking_code || 'BK20260918001';
  const fees = invoice?.fees || {
    exam_fee: 150000,
    service_fee: 10000,
    total_amount: 160000,
    formatted: {
      exam_fee: '150.000 đ',
      service_fee: '10.000 đ',
      total_amount: '160.000 đ',
    },
  };

  // Masked card number: che đi thông tin thẻ chỉ hiện tên và 4 số cuối theo yêu cầu docx
  const maskedCardNumber = cardData?.cardNumber
    ? `•••• •••• •••• ${cardData.cardNumber.replace(/\s/g, '').slice(-4)}`
    : '•••• •••• •••• 5678';

  const bankName = cardData?.bank?.name || (cardData?.type === 'credit_card' ? 'VISA / MASTERCARD' : 'NAPAS');
  const cardHolder = cardData?.cardHolder || 'NGUYEN VAN AN';

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
          Bước 3 / Xác nhận đơn hàng
        </span>
        <h3 className="font-bold text-slate-900 text-xl mt-0.5">
          Kiểm tra & Xác nhận Thanh toán
        </h3>
        <p className="text-xs text-slate-500">
          Vui lòng kiểm tra lại thông tin trước khi thực hiện trừ tiền.
        </p>
      </div>

      {/* ẢNH THẺ ĐÃ CHE THÔNG TIN CHỈ HIỆN TÊN VÀ 4 SỐ CUỐI */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm h-44 rounded-2xl p-5 text-white shadow-lg bg-gradient-to-tr from-slate-800 to-slate-950 relative overflow-hidden border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm tracking-wider text-slate-300">
              {bankName}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <Lock className="w-3 h-3" />
              <span className="text-[10px] font-semibold">Đã mã hóa bảo mật</span>
            </div>
          </div>

          <div className="my-3 flex items-center justify-between">
            <div className="font-mono text-lg tracking-widest font-semibold text-slate-200">
              {maskedCardNumber}
            </div>
          </div>

          <div className="mt-2 flex items-end justify-between text-xs">
            <div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">
                Chủ thẻ
              </div>
              <div className="font-mono font-bold tracking-wider uppercase text-white truncate max-w-[200px]">
                {cardHolder}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">
                Phương thức
              </div>
              <div className="font-semibold text-blue-300 uppercase text-[11px]">
                {cardData?.type === 'credit_card' ? 'Thẻ Quốc Tế' : 'Thẻ ATM'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BẢNG TỔNG HỢP CHI TIẾT */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
        <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
          <span className="text-slate-500">Mã đơn hàng:</span>
          <span className="font-mono font-bold text-blue-600">{bookingCode}</span>
        </div>

        <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
          <span className="text-slate-500">Số điện thoại:</span>
          <span className="font-medium text-slate-900">{cardData?.phone || '0901234567'}</span>
        </div>

        <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
          <span className="text-slate-500">Số tiền khám:</span>
          <span className="font-medium text-slate-900">{fees.formatted.exam_fee}</span>
        </div>

        <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
          <span className="text-slate-500">Phí dịch vụ:</span>
          <span className="font-medium text-slate-900">{fees.formatted.service_fee}</span>
        </div>

        <div className="flex justify-between items-baseline pt-2">
          <span className="font-bold text-slate-900 text-sm">Tổng tiền thanh toán:</span>
          <span className="font-black text-2xl text-blue-600">{fees.formatted.total_amount}</span>
        </div>
      </div>

      {/* NÚT THANH TOÁN & HỦY THANH TOÁN (Disable nút Thanh toán khi loading để tránh bấm nhiều lần) */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={onCancelPayment}
          className="w-1/3 text-slate-600 hover:text-red-600"
        >
          Hủy Thanh Toán
        </Button>

        <Button
          type="button"
          disabled={loading}
          onClick={onConfirmPayment}
          className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-base shadow-md disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang xử lý thanh toán...
            </span>
          ) : (
            `Thanh Toán ${fees.formatted.total_amount}`
          )}
        </Button>
      </div>
    </div>
  );
}
