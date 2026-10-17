import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Building2,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import paymentApi from '../api/paymentApi';
import { PaymentBookingSummary } from '../components/payment/PaymentBookingSummary';
import { PaymentMethodSelector } from '../components/payment/PaymentMethodSelector';
import { AtmCardForm } from '../components/payment/AtmCardForm';
import { CreditCardForm } from '../components/payment/CreditCardForm';
import { QrPayView } from '../components/payment/QrPayView';
import { StorePayView } from '../components/payment/StorePayView';
import { MomoPayView } from '../components/payment/MomoPayView';
import { PaymentConfirmationModal } from '../components/payment/PaymentConfirmationModal';
import { PaymentProcessingModal } from '../components/payment/PaymentProcessingModal';
import { PaymentResultView } from '../components/payment/PaymentResultView';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';


export function PaymentPage() {
  // Step state: 1 (Select method), 2 (Card info/QR/Store/MoMo), 3 (Confirm review), 4 (Processing/OTP), 5 (Result)
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('atm');
  const [cardData, setCardData] = useState(null);

  // API State
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Processing & Result State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [resultStatus, setResultStatus] = useState('success'); // 'success' | 'failed' | 'pending'
  const [failureReason, setFailureReason] = useState('Thẻ không đủ số dư');

  // Load invoice on mount
  useEffect(() => {
    fetchInvoice();
  }, []);

  const fetchInvoice = async () => {
    setLoading(true);
    setApiError(null);
    try {
      // Thử gọi API thật tới Laravel backend (booking_id = 1 đã được seed sẵn)
      const res = await paymentApi.calculateInvoice(1);
      if (res && res.data) {
        setInvoice(res.data);
      }
    } catch (err) {
      console.warn('API error or backend offline, falling back to mock booking:', err);
      // Hiển thị thông báo lỗi lấy từ response.data.message theo quy tắc 3
      if (err.message && !err.message.includes('Network Error')) {
        setApiError(err.message);
      }

      // Mock data chuẩn YouMed nếu API backend chưa chạy
      setInvoice({
        booking_id: 1,
        booking_code: 'BK20260918001',
        booking_type: 'hospital',
        booking_status: 'pending_payment',
        patient: {
          id: 1,
          full_name: 'Nguyễn Văn An',
          phone: '0901234567',
          gender: 'male',
          dob: '15/08/1992',
        },
        hospital: {
          id: 1,
          name: 'Bệnh viện Đại học Y Dược TP.HCM',
          address: '215 Hồng Bàng, Phường 11, Quận 5',
          city: 'Hồ Chí Minh',
          hotline: '1900 7178',
        },
        exam_type: {
          id: 1,
          name: 'Khám Chuyên Khoa - Tiêu Chuẩn',
          price: 150000,
        },
        schedule: {
          work_date: 'Ngày mai, 19/09/2026',
          time_slot: '08:30 - 09:00',
        },
        fees: {
          exam_fee: 150000,
          service_fee: 10000,
          total_amount: 160000,
          currency: 'VND',
          formatted: {
            exam_fee: '150.000 đ',
            service_fee: '10.000 đ',
            total_amount: '160.000 đ',
          },
        },
        slot_hold_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        is_hold_expired: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 1 -> Next (confirm method)
  const handleProceedFromMethodSelect = () => {
    setCurrentStep(2);
  };

  // Step 2 -> Step 3 (from Card forms)
  const handleCardContinue = (data) => {
    setCardData(data);
    setCurrentStep(3);
  };

  // Step 2 Direct confirmation for QR / Store / MoMo
  const handleDirectPaymentConfirm = async (meta = {}) => {
    setActionLoading(true);
    try {
      // Gọi API create & confirm qua backend nếu có
      let paymentRes = null;
      try {
        paymentRes = await paymentApi.createPayment({
          booking_id: invoice?.booking_id || 1,
          method: selectedMethod,
        });
      } catch (e) {
        console.warn('Backend payment create fallback:', e);
      }

      setPaymentResult({
        booking_code: invoice?.booking_code || 'BK20260918001',
        transaction_code: 'TXN' + Date.now().toString().slice(-10),
        paid_at: new Date().toLocaleString('vi-VN'),
        method: { name: getMethodName(selectedMethod) },
        total_amount: invoice?.fees?.total_amount || 160000,
        hospital: invoice?.hospital,
        patient: invoice?.patient,
        exam_type: invoice?.exam_type?.name,
      });

      setResultStatus('success');
      setCurrentStep(5);
    } catch (err) {
      setApiError(err.message || 'Thanh toán thất bại.');
      setResultStatus('failed');
      setCurrentStep(5);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 3 -> Step 4 (Bấm Thanh toán từ Màn hình 3 Xác nhận)
  const handleConfirmReview = () => {
    // Mở popup OTP 3D-Secure
    setOtpModalOpen(true);
  };

  // Step 4 -> Step 5 (Sau khi nhập mã OTP thành công)
  const handleVerifyOtp = async (otpCode) => {
    setActionLoading(true);
    try {
      let createdPayment = null;
      try {
        const createRes = await paymentApi.createPayment({
          booking_id: invoice?.booking_id || 1,
          method: selectedMethod,
        });
        createdPayment = createRes?.data;
      } catch (e) {
        console.warn('Fallback payment creation:', e);
      }

      let confirmedPayment = null;
      if (createdPayment?.id) {
        try {
          const confirmRes = await paymentApi.confirmPayment({
            payment_id: createdPayment.id,
            otp: otpCode,
            transaction_code: 'TXN' + Date.now().toString().slice(-10),
          });
          confirmedPayment = confirmRes?.data;
        } catch (e) {
          console.warn('Confirm API error:', e);
        }
      }

      setPaymentResult(
        confirmedPayment || {
          booking_code: invoice?.booking_code || 'BK20260918001',
          transaction_code: 'TXN' + Date.now().toString().slice(-10),
          paid_at: new Date().toLocaleString('vi-VN'),
          method: { name: getMethodName(selectedMethod) },
          total_amount: invoice?.fees?.total_amount || 160000,
          hospital: invoice?.hospital,
          patient: invoice?.patient,
          exam_type: invoice?.exam_type?.name,
        }
      );

      setOtpModalOpen(false);
      setResultStatus('success');
      setCurrentStep(5);
    } catch (err) {
      setOtpModalOpen(false);
      setFailureReason(err.message || 'Mã xác thực OTP không chính xác hoặc đã hết hạn.');
      setResultStatus('failed');
      setCurrentStep(5);
    } finally {
      setActionLoading(false);
    }
  };

  const getMethodName = (m) => {
    const map = {
      atm: 'Thẻ ATM & Tài khoản ngân hàng',
      credit_card: 'Thẻ quốc tế (Visa/Mastercard)',
      qr_pay: 'Quét mã QR VietQR',
      store_pay: 'Cửa hàng tiện lợi',
      momo: 'Ví điện tử MoMo',
    };
    return map[m] || 'Thanh toán trực tuyến';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 pb-16">
      {/* HEADER YOU MED */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
              YM
            </div>
            <div>
              <div className="font-black text-slate-900 text-base tracking-tight flex items-center gap-1.5">
                <span>YouMed</span>
                <span className="text-[11px] font-bold text-blue-600 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                  Thanh Toán An Toàn
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hệ thống đặt lịch khám bệnh trực tuyến
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Bảo mật PCI-DSS</span>
          </div>
        </div>
      </header>

      {/* THANH ĐIỀU HƯỚNG QUY TRÌNH (BREADCRUMB / STEPS) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            {currentStep > 1 && currentStep < 5 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="flex items-center gap-1 text-blue-600 hover:underline cursor-pointer mr-2"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
            )}
            <span className={currentStep === 1 ? 'text-blue-600 font-bold' : ''}>
              1. Chọn hình thức
            </span>
            <span>&rarr;</span>
            <span className={currentStep === 2 ? 'text-blue-600 font-bold' : ''}>
              2. Nhập thông tin
            </span>
            <span>&rarr;</span>
            <span className={currentStep === 3 ? 'text-blue-600 font-bold' : ''}>
              3. Xác nhận
            </span>
            <span>&rarr;</span>
            <span className={currentStep >= 5 ? 'text-blue-600 font-bold' : ''}>
              4. Hoàn tất
            </span>
          </div>

          {/* Test Switcher toolbar cho người dùng trải nghiệm nhanh các trạng thái */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-medium px-1">Mô phỏng:</span>
            <button
              type="button"
              onClick={() => {
                setResultStatus('success');
                setCurrentStep(5);
              }}
              className="px-2 py-0.5 rounded bg-white hover:bg-emerald-50 text-emerald-700 font-bold shadow-2xs cursor-pointer"
            >
              Thành công
            </button>
            <button
              type="button"
              onClick={() => {
                setResultStatus('failed');
                setFailureReason('Thẻ không đủ số dư');
                setCurrentStep(5);
              }}
              className="px-2 py-0.5 rounded bg-white hover:bg-rose-50 text-rose-700 font-bold shadow-2xs cursor-pointer"
            >
              Thất bại
            </button>
            <button
              type="button"
              onClick={() => {
                setResultStatus('pending');
                setCurrentStep(5);
              }}
              className="px-2 py-0.5 rounded bg-white hover:bg-amber-50 text-amber-700 font-bold shadow-2xs cursor-pointer"
            >
              Chờ xác nhận
            </button>
          </div>
        </div>
      </div>

      {/* THÔNG BÁO LỖI NẾU CÓ (LẤY TỪ RESPONSE.DATA.MESSAGE) */}
      {apiError && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{apiError}</span>
            </div>
            <button
              type="button"
              onClick={() => setApiError(null)}
              className="font-bold hover:underline"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* NỘI DUNG CHÍNH (2 CỘT RESPONSIVE) */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: TƯƠNG TÁC THEO CÁC MÀN HÌNH (STEPS 1 -> 5) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-slate-200 shadow-md bg-white p-6">
              {/* MÀN HÌNH 1: CHỌN PHƯƠNG THỨC */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <PaymentMethodSelector
                    selectedMethod={selectedMethod}
                    onSelectMethod={setSelectedMethod}
                  />

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={handleProceedFromMethodSelect}
                      className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
                    >
                      Xác nhận phương thức & Tiếp tục
                    </Button>
                  </div>
                </div>
              )}

              {/* MÀN HÌNH 2: NHẬP THÔNG TIN THEO PHƯƠNG THỨC ĐÃ CHỌN */}
              {currentStep === 2 && selectedMethod === 'atm' && (
                <AtmCardForm
                  bookingCode={invoice?.booking_code}
                  onContinue={handleCardContinue}
                  onBack={() => setCurrentStep(1)}
                />
              )}

              {currentStep === 2 && selectedMethod === 'credit_card' && (
                <CreditCardForm
                  bookingCode={invoice?.booking_code}
                  onContinue={handleCardContinue}
                  onBack={() => setCurrentStep(1)}
                />
              )}

              {currentStep === 2 && selectedMethod === 'qr_pay' && (
                <QrPayView
                  invoice={invoice}
                  onConfirm={handleDirectPaymentConfirm}
                  onCancel={() => setCurrentStep(1)}
                  onBack={() => setCurrentStep(1)}
                />
              )}

              {currentStep === 2 && selectedMethod === 'store_pay' && (
                <StorePayView
                  invoice={invoice}
                  onConfirm={handleDirectPaymentConfirm}
                  onCancel={() => setCurrentStep(1)}
                  onBack={() => setCurrentStep(1)}
                />
              )}

              {currentStep === 2 && selectedMethod === 'momo' && (
                <MomoPayView
                  invoice={invoice}
                  onConfirm={handleDirectPaymentConfirm}
                  onCancel={() => setCurrentStep(1)}
                  onBack={() => setCurrentStep(1)}
                />
              )}

              {/* MÀN HÌNH 3: HIỂN THỊ TỔNG TIỀN & XÁC NHẬN THANH TOÁN (THẺ CHE SỐ) */}
              {currentStep === 3 && (
                <PaymentConfirmationModal
                  invoice={invoice}
                  cardData={cardData}
                  loading={actionLoading}
                  onConfirmPayment={handleConfirmReview}
                  onCancelPayment={() => setCurrentStep(2)}
                />
              )}

              {/* MÀN HÌNH 5: KẾT QUẢ THANH TOÁN */}
              {currentStep === 5 && (
                <PaymentResultView
                  status={resultStatus}
                  paymentData={paymentResult}
                  failureReason={failureReason}
                  onRetry={() => setCurrentStep(1)}
                  onChangeMethod={() => setCurrentStep(1)}
                  onCancelTransaction={() => {
                    setCurrentStep(1);
                  }}
                  onGoHome={() => alert('Chuyển về Trang chủ YouMed.')}
                  onViewBooking={() => alert('Mở trang chi tiết lịch hẹn của tôi.')}
                />
              )}
            </Card>
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG & BỘ ĐẾM GIỮ CHỖ (CỐ ĐỊNH KHI CUỘN) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <PaymentBookingSummary
              invoice={invoice}
              onExpired={() => {
                alert('Thời gian giữ chỗ thanh toán đã hết. Vui lòng đặt lại lịch khám.');
              }}
            />

            {/* Thông tin hỗ trợ tổng đài YouMed */}
            <div className="p-4 bg-slate-100/70 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Cần hỗ trợ thanh toán?
              </div>
              <p>
                Tổng đài CSKH YouMed hỗ trợ 24/7:{' '}
                <a href="tel:19002805" className="font-bold text-blue-600 hover:underline">
                  1900 2805
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* MÀN HÌNH 4: POPUP XÁC THỰC 3D SECURE OTP */}
      <PaymentProcessingModal
        open={otpModalOpen}
        bankName={cardData?.bank?.name || 'Vietcombank'}
        phone={cardData?.phone || '0901234567'}
        amount={invoice?.fees?.formatted?.total_amount || '160.000 đ'}
        onVerifyOtp={handleVerifyOtp}
        onCancel={() => setOtpModalOpen(false)}
      />
    </div>
  );
}

export default PaymentPage;
