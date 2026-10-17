import React, { useState } from 'react';
import {
  Store,
  Barcode,
  Copy,
  Check,
  Clock,
  ArrowLeft,
  Mail,
  Phone,
  Send,
  Info,
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export function StorePayView({ invoice, onConfirm, onCancel, onBack }) {
  const [contactInput, setContactInput] = useState('0901234567');
  const [codeGenerated, setCodeGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const bookingCode = invoice?.booking_code || 'BK20260918001';
  const payCode = '9820-4491-0328';
  const expiryTime = '24 giờ kể từ lúc tạo mã';
  const totalAmount = invoice?.fees?.formatted?.total_amount || '160.000 đ';

  const handleSendCode = (e) => {
    e.preventDefault();
    if (!contactInput) return;
    setCodeGenerated(true);
  };

  const copyPayCode = () => {
    navigator.clipboard.writeText(payCode.replace(/-/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">
            Thanh toán tại Cửa hàng tiện lợi
          </h3>
          <p className="text-xs text-slate-500">
            Mã đơn hàng: <span className="font-semibold text-blue-600">{bookingCode}</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500">
          <ArrowLeft className="w-4 h-4 mr-1" /> Đổi phương thức
        </Button>
      </div>

      {/* Đối tác cửa hàng tiện lợi */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="text-xs font-semibold text-slate-600 mb-2">
          Hỗ trợ thanh toán tại hệ thống các cửa hàng:
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['Circle K', 'GS25', 'MiniStop', 'FamilyMart', '7-Eleven', 'B’s Mart'].map((store) => (
            <span
              key={store}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs"
            >
              {store}
            </span>
          ))}
        </div>
      </div>

      {!codeGenerated ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Nhập Số điện thoại hoặc Email để nhận Mã thanh toán:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="0901234567 hoặc yourname@email.com"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                className="pl-9 h-11 text-sm font-medium"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Mã giao dịch tiện lợi và biên nhận sẽ được gửi tự động qua tin nhắn/email này.
            </p>
          </div>

          <Button type="submit" className="w-full h-11 font-semibold">
            <Send className="w-4 h-4 mr-1.5" /> Tạo & Nhận mã thanh toán
          </Button>
        </form>
      ) : (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Thông tin phiếu thanh toán tại cửa hàng */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/60 text-amber-900 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Thời gian khả dụng: {expiryTime}</span>
            </div>

            {/* Mã vạch mô phỏng & Mã thanh toán */}
            <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs inline-block w-full max-w-sm">
              <div className="font-mono text-3xl tracking-widest font-black text-slate-900 flex items-center justify-center gap-2">
                {payCode}
                <button
                  type="button"
                  onClick={copyPayCode}
                  className="text-slate-400 hover:text-blue-600"
                  title="Sao chép"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              {/* Barcode graphic lines */}
              <div className="flex justify-center items-center gap-1 mt-3 h-12 px-4 opacity-80">
                {[2, 1, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 1, 2, 4, 3, 1, 2, 1, 3, 4, 2].map((w, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 h-full"
                    style={{ width: `${w * 2}px` }}
                  />
                ))}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono tracking-widest">
                PAYOO-YOUMED-CONVENIENCE-STORE
              </div>
            </div>

            {/* Chi tiết thanh toán */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 max-w-xs mx-auto text-left">
              <div className="text-slate-500">Mã đơn hàng:</div>
              <div className="font-semibold text-slate-900 text-right">{bookingCode}</div>
              <div className="text-slate-500">Người nhận mã:</div>
              <div className="font-semibold text-slate-900 text-right">{contactInput}</div>
              <div className="text-slate-500">Tổng tiền thu hộ:</div>
              <div className="font-extrabold text-blue-700 text-right text-sm">{totalAmount}</div>
            </div>
          </div>

          <div className="text-xs text-slate-600 p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <span>
              Quý khách vui lòng cung cấp mã trên cho nhân viên thu ngân tại các cửa hàng tiện lợi và yêu cầu thanh toán dịch vụ <strong>YouMed / Payoo</strong>.
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-1/3"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => onConfirm({ type: 'store_pay', payCode })}
              className="w-2/3 bg-emerald-600 hover:bg-emerald-700 font-semibold"
            >
              <Check className="w-4 h-4 mr-1.5" /> Hoàn tất lưu thông tin
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
