import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Loader2,
  Lock,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export function PaymentProcessingModal({
  open,
  bankName = 'Vietcombank',
  phone = '0901234567',
  amount = '160.000 đ',
  onVerifyOtp,
  onCancel,
}) {
  const [stage, setStage] = useState('connecting'); // connecting -> otp_entry -> verifying
  const [otp, setOtp] = useState('123456'); // default mock OTP for testing convenience
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    if (!open) {
      setStage('connecting');
      return;
    }

    // Step 1: Connecting to bank simulation (1.5s)
    const timer = setTimeout(() => {
      setStage('otp_entry');
    }, 1500);

    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (stage !== 'otp_entry' || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, resendTimer]);

  const handleSubmitOtp = (e) => {
    e.preventDefault();
    setStage('verifying');
    setTimeout(() => {
      onVerifyOtp(otp);
    }, 1200);
  };

  return (
    <Dialog open={open} onClose={() => {}}>
      {stage === 'connecting' && (
        <div className="py-8 px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border-4 border-blue-100">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h4 className="font-bold text-lg text-slate-900">
              Đang kết nối cổng thanh toán {bankName}...
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Vui lòng không tắt trình duyệt hoặc tải lại trang trong khi hệ thống đang khởi tạo giao dịch bảo mật.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Mã hóa bảo vệ dữ liệu SSL 256-bit</span>
          </div>
        </div>
      )}

      {stage === 'otp_entry' && (
        <form onSubmit={handleSubmitOtp} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                3D
              </div>
              <div>
                <DialogTitle>Xác thực giao dịch OTP</DialogTitle>
                <div className="text-[11px] text-slate-500">
                  Cổng bảo mật 3D-Secure Ngân hàng {bankName}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Số tiền giao dịch:</span>
              <span className="font-bold text-blue-700 text-sm">{amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gửi tới số điện thoại:</span>
              <span className="font-medium text-slate-900">
                {phone.slice(0, 3)}****{phone.slice(-3)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block text-center">
              Nhập mã OTP (6 chữ số) đã gửi vào điện thoại của bạn
            </label>
            <Input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="text-center font-mono text-2xl tracking-[0.5em] font-bold h-14 bg-white border-2 border-blue-400 focus-visible:ring-blue-500"
              required
              autoFocus
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
              <span>(Gợi ý test: nhập bất kỳ mã 6 số)</span>
              {resendTimer > 0 ? (
                <span>Gửi lại sau {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setResendTimer(60)}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Gửi lại mã OTP
                </button>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-1/3 text-slate-600"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={otp.length < 4}
              className="w-2/3 bg-blue-600 hover:bg-blue-700 font-bold"
            >
              Xác nhận OTP
            </Button>
          </DialogFooter>
        </form>
      )}

      {stage === 'verifying' && (
        <div className="py-8 px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-100">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h4 className="font-bold text-lg text-slate-900">
              Đang đối soát mã OTP với ngân hàng...
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Hệ thống đang tiến hành hạch toán và cập nhật trạng thái lịch hẹn khám của bạn.
            </p>
          </div>
        </div>
      )}
    </Dialog>
  );
}
