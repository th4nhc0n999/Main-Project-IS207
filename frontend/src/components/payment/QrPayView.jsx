import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  Copy,
  Check,
  Plus,
  Minus,
  Clock,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function QrPayView({ invoice, onConfirm, onCancel, onBack }) {
  const [selectedApp, setSelectedApp] = useState('banking'); // banking | zalopay | shopeepay
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 phút đếm ngược

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const bookingCode = invoice?.booking_code || 'BK20260918001';
  const totalAmount = invoice?.fees?.formatted?.total_amount || '160.000 đ';

  const copyCode = () => {
    navigator.clipboard.writeText(bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic QR Code SVG rendering simulation (VietQR standard look)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=YOUMED_${bookingCode}_AMOUNT_${invoice?.fees?.total_amount || 160000}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">
            Quét mã QR thanh toán
          </h3>
          <p className="text-xs text-slate-500">
            Cổng thanh toán VietQR / Payoo tự động
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500">
          <ArrowLeft className="w-4 h-4 mr-1" /> Đổi phương thức
        </Button>
      </div>

      {/* App Selector Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'banking', name: 'Mobile Banking', desc: 'Mọi ngân hàng' },
          { id: 'zalopay', name: 'ZaloPay', desc: 'Ví ZaloPay' },
          { id: 'shopeepay', name: 'ShopeePay', desc: 'Ví ShopeePay' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedApp(tab.id)}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              selectedApp === tab.id
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600 font-bold'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="text-xs font-bold">{tab.name}</div>
            <div className="text-[10px] text-slate-500">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* QR Code Container */}
      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center relative overflow-hidden">
        {/* Countdown */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>Thời gian quét mã còn: </span>
          <span className="font-mono font-extrabold">{formatTime(timeLeft)}</span>
        </div>

        {/* QR Image with Frame */}
        <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-slate-200 relative group">
          <img
            src={qrUrl}
            alt="Payment QR Code"
            className="w-52 h-52 object-contain rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-blue-600 font-extrabold text-xs">
              YM
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 mt-4 max-w-xs leading-relaxed">
          Mở ứng dụng <strong>{selectedApp === 'banking' ? 'Ngân hàng của bạn' : selectedApp === 'zalopay' ? 'ZaloPay' : 'ShopeePay'}</strong>, chọn <strong>Quét mã QR</strong> để hoàn tất thanh toán.
        </p>

        {/* Số tiền cần chuyển */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xs text-slate-500">Số tiền:</span>
          <span className="text-2xl font-black text-emerald-600">{totalAmount}</span>
        </div>
      </div>

      {/* Accordion Chi tiết đơn hàng với icon '+' */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="w-full p-3.5 flex items-center justify-between text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>Mã đơn hàng:</span>
            <span className="font-mono text-blue-600 font-bold">{bookingCode}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                copyCode();
              }}
              className="p-1 text-slate-400 hover:text-slate-600"
              title="Sao chép mã"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 font-normal">
            <span>{detailsOpen ? 'Thu gọn' : 'Chi tiết'}</span>
            {detailsOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </div>
        </button>

        {detailsOpen && (
          <div className="p-4 pt-0 text-xs border-t border-slate-100 space-y-2 bg-slate-50/50">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Cơ sở khám:</span>
              <span className="font-medium text-slate-800">{invoice?.hospital?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Người bệnh:</span>
              <span className="font-medium text-slate-800">{invoice?.patient?.full_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Tiền khám:</span>
              <span className="font-medium text-slate-800">{invoice?.fees?.formatted?.exam_fee}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Phí dịch vụ:</span>
              <span className="font-medium text-slate-800">{invoice?.fees?.formatted?.service_fee}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <Button
          type="button"
          onClick={() => onConfirm({ type: 'qr_pay', app: selectedApp })}
          className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold h-11"
        >
          <Check className="w-4 h-4 mr-1.5" /> Tôi đã quét và thanh toán thành công
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full text-slate-600 hover:text-red-600 hover:border-red-200"
        >
          Hủy thanh toán
        </Button>
      </div>
    </div>
  );
}
