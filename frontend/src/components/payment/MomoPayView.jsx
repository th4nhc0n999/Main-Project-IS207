import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Clock,
  ArrowLeft,
  Smartphone,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Button } from '../ui/button';

export function MomoPayView({ invoice, onConfirm, onCancel, onBack }) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút đếm ngược MoMo

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
  const momoQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=2|99|0901234567|YOUMED|${bookingCode}|0|0|${invoice?.fees?.total_amount || 160000}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
            M
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              Thanh toán Ví MoMo
            </h3>
            <p className="text-xs text-slate-500">
              Quét mã QR MoMo hoặc mở app để thanh toán
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500">
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay về
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center p-6 bg-pink-50/50 rounded-2xl border border-pink-200 text-center relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-900 text-xs font-bold mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>Thời gian giao dịch còn lại: </span>
          <span className="font-mono font-black">{formatTime(timeLeft)}</span>
        </div>

        {/* QR Frame */}
        <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-pink-300 relative group">
          <img
            src={momoQrUrl}
            alt="MoMo QR"
            className="w-52 h-52 object-contain rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-pink-600 text-white shadow-md flex items-center justify-center font-black text-xs border-2 border-white">
              MoMo
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <div className="text-xs text-slate-500">Số tiền thanh toán:</div>
          <div className="text-2xl font-black text-pink-600">{totalAmount}</div>
          <div className="text-xs text-slate-600 mt-2 font-medium">
            Đơn hàng: <span className="font-semibold">{bookingCode}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <Button
          type="button"
          onClick={() => onConfirm({ type: 'momo' })}
          className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold h-11 shadow-sm"
        >
          <Check className="w-4 h-4 mr-1.5" /> Tôi đã thanh toán trên MoMo
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full text-slate-600 hover:text-red-600"
        >
          Quay về
        </Button>
      </div>
    </div>
  );
}
