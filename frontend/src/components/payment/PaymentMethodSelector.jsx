import React from 'react';
import {
  CreditCard,
  QrCode,
  Wallet,
  Landmark,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

export function PaymentMethodSelector({ selectedMethod, onSelectMethod }) {
  const methods = [
    {
      id: 'atm',
      title: 'Thẻ ATM & Tài khoản ngân hàng',
      subtitle: 'Hơn 40 ngân hàng nội địa (Vietcombank, BIDV, Techcombank, MB...)',
      icon: Landmark,
      badge: 'Phổ biến',
      iconBg: 'bg-sage-50 text-sage-700 border-sage-200',
    },
    {
      id: 'credit_card',
      title: 'Thẻ thanh toán quốc tế',
      subtitle: 'Visa, MasterCard, JCB, American Express',
      icon: CreditCard,
      badge: 'Toàn cầu',
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      id: 'qr_pay',
      title: 'Thanh toán qua mã QR (VietQR / Payoo)',
      subtitle: 'Quét nhanh bằng ứng dụng Mobile Banking hoặc ZaloPay / ShopeePay',
      icon: QrCode,
      badge: 'Nhanh nhất',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'momo',
      title: 'Ví điện tử MoMo',
      subtitle: 'Xác nhận tức thì qua ứng dụng MoMo trên điện thoại',
      icon: Wallet,
      badge: 'Ưu đãi ví',
      iconBg: 'bg-pink-50 text-pink-600 border-pink-200',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-slate-900 text-base">
          Chọn phương thức thanh toán
        </h3>
        <span className="text-xs text-slate-500">05 phương thức khả dụng</span>
      </div>

      <div className="grid gap-3">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const Icon = method.icon;

          return (
            <div
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-200 flex items-center justify-between ${
                isSelected
                  ? 'border-sage-600 bg-sage-50/40 shadow-sm ring-2 ring-sage-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Radio Indicator */}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'border-sage-600 bg-sage-600 text-white'
                      : 'border-slate-300 bg-white group-hover:border-slate-400'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>

                {/* Icon Phương thức */}
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${method.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Tiêu đề & Mô tả */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">
                      {method.title}
                    </span>
                    {method.badge && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {method.subtitle}
                  </p>
                </div>
              </div>

              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isSelected
                    ? 'text-sage-700 translate-x-0.5'
                    : 'text-slate-300 group-hover:text-slate-400'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
