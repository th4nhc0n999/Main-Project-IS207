import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Building2,
  User,
  Activity,
  AlertCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

export function PaymentBookingSummary({ invoice, onExpired }) {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút đếm ngược

  useEffect(() => {
    if (!invoice) return;

    if (invoice.slot_hold_expires_at) {
      const expires = new Date(invoice.slot_hold_expires_at).getTime();
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((expires - now) / 1000));
        setTimeLeft(diff);
        if (diff <= 0) {
          clearInterval(interval);
          if (onExpired) onExpired();
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (onExpired) onExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [invoice, onExpired]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const patient = invoice?.patient || {
    full_name: 'Nguyễn Văn An',
    phone: '0901234567',
  };

  const hospital = invoice?.hospital || {
    name: 'Bệnh viện Đại học Y Dược TP.HCM',
    address: '215 Hồng Bàng, Phường 11, Quận 5',
  };

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

  const schedule = invoice?.schedule || {
    work_date: 'Ngày mai',
    time_slot: '08:30 - 09:00',
  };

  return (
    <Card className="border-blue-100 shadow-md bg-white overflow-hidden">
      {/* Banner Countdown Timer giữ slot */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between text-xs font-medium transition-colors ${
          timeLeft < 180
            ? 'bg-rose-50 text-rose-700 border-b border-rose-200'
            : 'bg-blue-50 text-blue-800 border-b border-blue-100'
        }`}
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Clock className="w-4 h-4 animate-pulse" />
          Thời gian giữ chỗ thanh toán:
        </span>
        <span className="font-mono font-bold text-sm tracking-wider bg-white px-2 py-0.5 rounded shadow-xs border border-current">
          {formatTimer(timeLeft)}
        </span>
      </div>

      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
              Phiếu đặt lịch khám
            </span>
            <CardTitle className="text-lg text-slate-900 mt-0.5 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {invoice?.booking_code || 'BK20260918001'}
            </CardTitle>
          </div>
          <Badge variant="warning" className="uppercase font-semibold">
            Chờ thanh toán
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 text-sm">
        {/* Thông tin bệnh nhân */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-slate-500">Bệnh nhân</div>
            <div className="font-semibold text-slate-900 truncate">
              {patient.full_name}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              SĐT: {patient.phone || '0901234567'}
            </div>
          </div>
        </div>

        {/* Cơ sở khám & Chuyên khoa */}
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5 text-slate-700">
            <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-slate-900">{hospital.name}</div>
              <div className="text-xs text-slate-500">{hospital.address}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <Activity className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-xs text-slate-500">Chuyên khoa: </span>
              <span className="font-medium text-slate-800">
                Khoa Tim Mạch - Phòng khám 204
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-xs text-slate-500">Ngày khám: </span>
              <span className="font-semibold text-blue-700">
                {schedule.work_date} ({schedule.time_slot})
              </span>
            </div>
          </div>
        </div>

        {/* Phân rã chi phí / Invoice Breakdown */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Chi tiết chi phí
          </div>

          <div className="flex justify-between text-slate-600">
            <span className="truncate pr-2">
              {invoice?.exam_type?.name || 'Khám Chuyên Khoa Tiêu Chuẩn'}
            </span>
            <span className="font-medium text-slate-800 shrink-0">
              {fees.formatted.exam_fee}
            </span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span className="flex items-center gap-1">
              Phí tiện ích YouMed
              <span className="text-[10px] text-slate-400" title="Bảo mật & nhắc lịch tự động">(?)</span>
            </span>
            <span className="font-medium text-slate-800 shrink-0">
              {fees.formatted.service_fee}
            </span>
          </div>

          <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-baseline">
            <div>
              <div className="text-base font-bold text-slate-900">Tổng thanh toán</div>
              <div className="text-[11px] text-slate-500">Đã bao gồm VAT</div>
            </div>
            <div className="text-xl font-extrabold text-blue-600">
              {fees.formatted.total_amount}
            </div>
          </div>
        </div>

        {/* Cam kết bảo mật */}
        <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50/70 px-3 py-2 rounded-lg border border-emerald-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Thanh toán bảo mật chuẩn SSL 256-bit & PCI-DSS</span>
        </div>
      </CardContent>
    </Card>
  );
}
