import BookingSteps from '@/components/BookingSteps';
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import paymentApi from '@/api/paymentApi';
import useApi, { money } from '@/api/useApi';
import { AtmCardForm } from '@/components/payment/AtmCardForm';
import { CreditCardForm } from '@/components/payment/CreditCardForm';
import { PaymentProcessingModal } from '@/components/payment/PaymentProcessingModal';
import {
  QrCode,
  Wallet,
  CreditCard,
  Landmark,
  Store,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  XCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';

const refundLabels = {
  requested: 'Đã yêu cầu hoàn',
  approved: 'Admin đã duyệt',
  processing: 'Đang xử lý hoàn',
  succeeded: 'Đã hoàn tiền thành công',
  failed: 'Hoàn tiền thất bại',
  rejected: 'Yêu cầu bị từ chối',
};

const refundBadges = {
  requested: 'bg-amber-100 text-amber-800 border-amber-300',
  approved: 'bg-blue-100 text-blue-800 border-blue-300',
  processing: 'bg-purple-100 text-purple-800 border-purple-300',
  succeeded: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  failed: 'bg-rose-100 text-rose-800 border-rose-300',
  rejected: 'bg-slate-100 text-slate-800 border-slate-300',
};

export default function PaymentPage() {
  const [params] = useSearchParams();
  const { bookingId } = useParams();
  const id = bookingId || params.get('booking_id');

  return <PaymentDetail key={id} id={id} refundsOnly={Boolean(bookingId && !params.get('booking_id'))} />;
}

function PaymentDetail({ id, refundsOnly }) {
  const navigate = useNavigate();
  const [revision, refresh] = useState(0);
  const { data, error, loading } = useApi(id ? '/me/bookings/' + id : null, revision);
  const booking = data?.data;

  const [selectedMethod, setSelectedMethod] = useState('qr_pay');
  const [now, setNow] = useState(Date.now);
  const [tx, setTx] = useState(null);
  const [issue, setIssue] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Trạng thái modal xác thực OTP cho thẻ ATM / Thẻ quốc tế
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpBankName, setOtpBankName] = useState('Ngân hàng đối tác');

  // Đếm ngược thời gian giữ chỗ
  useEffect(() => {
    if (!booking || booking.status !== 'pending_payment') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [booking]);

  const holdTime = booking?.hold_expires_at ? Date.parse(booking.hold_expires_at) : null;
  const remaining = holdTime ? Math.max(0, Math.ceil((holdTime - now) / 1000)) : 0;

  // Bắt đầu thanh toán
  async function handleStartPayment(methodToUse = selectedMethod) {
    if (!id) return null;
    setBusy(true);
    setIssue('');
    setSuccessMsg('');
    try {
      const res = await paymentApi.start({ booking_id: Number(id), method: methodToUse });
      setTx(res.data);
      return res.data;
    } catch (err) {
      setIssue(err.message || 'Không thể khởi tạo giao dịch thanh toán.');
      return null;
    } finally {
      setBusy(false);
    }
  }

  // Giả lập kết quả thanh toán (Thử nghiệm E04 / T14 / T02)
  async function handleSimulate(status, txCode = tx?.transaction_code) {
    if (!txCode) return;
    setBusy(true);
    setIssue('');
    setSuccessMsg('');
    try {
      await paymentApi.simulate({
        transaction_code: txCode,
        status: status, // 'success' hoặc 'failed'
      });
      if (status === 'success') {
        setSuccessMsg('Thanh toán thành công! Lịch khám đã được xác nhận.');
      } else {
        setIssue('Giao dịch thanh toán thất bại (T14). Hạn giữ chỗ vẫn được bảo lưu, bạn có thể thử lại.');
      }
      refresh((v) => v + 1);
    } catch (err) {
      setIssue(err.message || 'Lỗi khi mô phỏng kết quả.');
    } finally {
      setBusy(false);
    }
  }

  // Xử lý khi người dùng nhấn thanh toán từ form thẻ ATM
  async function handleAtmSubmit(cardData) {
    setOtpBankName(cardData.bank?.name || 'Ngân hàng nội địa');
    const newTx = await handleStartPayment('atm');
    if (newTx) {
      setOtpModalOpen(true);
    }
  }

  // Xử lý khi người dùng nhấn thanh toán từ form thẻ Quốc tế
  async function handleCreditCardSubmit(cardData) {
    setOtpBankName(`Thẻ quốc tế ${cardData.cardBrand?.toUpperCase() || ''}`);
    const newTx = await handleStartPayment('credit_card');
    if (newTx) {
      setOtpModalOpen(true);
    }
  }

  // Xác nhận OTP từ modal
  async function handleVerifyOtp(otp) {
    setOtpModalOpen(false);
    await handleSimulate('success');
  }

  // Sao chép nội dung
  function copyText(text) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const paymentMethods = [
    {
      id: 'qr_pay',
      name: 'Mã QR Ngân hàng (VietQR)',
      desc: 'Quét bằng ứng dụng ngân hàng bất kỳ (Mobile Banking)',
      icon: QrCode,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'momo',
      name: 'Ví điện tử MoMo',
      desc: 'Quét mã MoMo hoặc chuyển hướng ứng dụng',
      icon: Wallet,
      color: 'text-pink-600 bg-pink-50 border-pink-200',
    },
    {
      id: 'atm',
      name: 'Thẻ ATM nội địa',
      desc: 'Hơn 40 ngân hàng Napas nội địa (VCB, TCB, MB, BIDV...)',
      icon: Landmark,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'credit_card',
      name: 'Thẻ quốc tế (Visa / Master)',
      desc: 'Thẻ tín dụng / ghi nợ quốc tế Visa, MasterCard, JCB',
      icon: CreditCard,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    ...(booking?.booking_type === 'hospital'
      ? [
          {
            id: 'store_pay',
            name: 'Thanh toán tại quầy bệnh viện',
            desc: 'Đến cơ sở thanh toán trực tiếp trước giờ khám',
            icon: Store,
            color: 'text-amber-600 bg-amber-50 border-amber-200',
          },
        ]
      : []),
  ];

  return (
    <section className="clinic payment-sheet max-w-5xl mx-auto px-4 py-8">
      {/* MODAL XÁC THỰC OTP NGÂN HÀNG (ATM / VISA) */}
      <PaymentProcessingModal
        open={otpModalOpen}
        bankName={otpBankName}
        phone={booking?.patient_snapshot?.phone || '0901234567'}
        amount={money(booking?.payment?.total_amount || 0)}
        onVerifyOtp={handleVerifyOtp}
        onCancel={() => setOtpModalOpen(false)}
      />

      <div className="flex items-center justify-between mb-4">
        <Link to="/my-bookings" className="inline-flex items-center text-sm text-slate-600 hover:text-emerald-600">
          <ArrowLeft className="w-4 h-4 mr-1" /> Danh sách lịch khám của tôi
        </Link>
        <button
          onClick={() => refresh((v) => v + 1)}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Đồng bộ trạng thái
        </button>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        {refundsOnly ? 'Theo dõi Hoàn tiền & Giao dịch' : 'Thanh toán Đặt khám MedSi'}
      </h1>

      {!refundsOnly && <BookingSteps current={3} />}

      {!booking ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm mt-4">
          <p className="text-slate-600">
            {loading ? 'Đang tải thông tin lịch khám…' : error || (id ? 'Không tìm thấy thông tin lịch khám.' : 'Vui lòng chọn mã lịch cần thanh toán.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* CỘT TRÁI & GIỮA: VÙNG THANH TOÁN HOẶC HOÀN TIỀN */}
          <div className="lg:col-span-2 space-y-6">
            {refundsOnly ? (
              /* TAB HOÀN TIỀN */
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="font-bold text-lg text-slate-900">Lịch sử & Trạng thái hoàn tiền</h2>
                  <span className="text-xs text-slate-500">Mã: {booking.code}</span>
                </div>

                {(!booking.refunds || booking.refunds.length === 0) ? (
                  <div className="py-8 text-center text-slate-500">
                    <p>Chưa có yêu cầu hoàn tiền nào cho lịch này.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {booking.refunds.map((r) => (
                      <div key={r.id} className="py-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${refundBadges[r.status] || 'bg-slate-100'}`}>
                            {refundLabels[r.status] || r.status}
                          </span>
                          <span className="font-bold text-emerald-600 text-base">{money(r.amount)}</span>
                        </div>
                        <div className="text-xs text-slate-500 space-y-0.5">
                          <p>Ngày yêu cầu: {r.requested_at || 'Mới cập nhật'}</p>
                          {r.processed_at && <p>Xử lý thành công lúc: {r.processed_at}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* TAB THANH TOÁN CHÍNH */
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                {/* THỜI GIAN GIỮ CHỖ */}
                {booking.status === 'pending_payment' && (
                  <div className={`p-4 rounded-xl flex items-center justify-between border ${remaining > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="font-semibold text-sm">Thời hạn giữ chỗ ca khám:</p>
                        <p className="text-xs text-slate-600">Lịch sẽ tự động hủy nếu quá hạn thanh toán.</p>
                      </div>
                    </div>
                    <div className="font-mono text-xl font-bold">
                      {remaining > 0 ? (
                        <span>
                          {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
                        </span>
                      ) : (
                        <span className="text-rose-600 text-sm">Đã hết hạn</span>
                      )}
                    </div>
                  </div>
                )}

                {/* THÔNG BÁO LỖI / THÀNH CÔNG */}
                {issue && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                    <div>{issue}</div>
                  </div>
                )}
                {successMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                    <div>{successMsg}</div>
                  </div>
                )}

                {booking.status === 'pending_payment' ? (
                  remaining > 0 ? (
                    <div className="space-y-6">
                      {/* CHỌN PHƯƠNG THỨC */}
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-3">
                          1. Chọn phương thức thanh toán
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {paymentMethods.map((m) => {
                            const Icon = m.icon;
                            const isSelected = selectedMethod === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMethod(m.id);
                                  setTx(null); // Reset giao dịch cũ khi chuyển phương thức
                                  setIssue('');
                                }}
                                className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                              >
                                <div className={`p-2 rounded-lg border ${m.color}`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-slate-900 leading-tight">{m.name}</p>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{m.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* GIAO DIỆN THEO TỪNG PHƯƠNG THỨC */}
                      <div className="pt-4 border-t border-slate-100">
                        <label className="block text-sm font-bold text-slate-800 mb-3">
                          2. Xác nhận và tiến hành thanh toán
                        </label>

                        {/* CASE A: THẺ ATM NỘI ĐỊA */}
                        {selectedMethod === 'atm' && (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <AtmCardForm
                              bookingCode={booking.code}
                              onContinue={handleAtmSubmit}
                              onBack={() => setSelectedMethod('qr_pay')}
                            />
                          </div>
                        )}

                        {/* CASE B: THẺ QUỐC TẾ (VISA/MASTER) */}
                        {selectedMethod === 'credit_card' && (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <CreditCardForm
                              bookingCode={booking.code}
                              onContinue={handleCreditCardSubmit}
                              onBack={() => setSelectedMethod('qr_pay')}
                            />
                          </div>
                        )}

                        {/* CASE C: MÃ QR NGÂN HÀNG (VIETQR) HOẶC VÍ MOMO HOẶC TẠI QUẦY */}
                        {(selectedMethod === 'qr_pay' || selectedMethod === 'momo' || selectedMethod === 'store_pay') && (
                          <>
                            {!tx ? (
                              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <p className="text-sm text-slate-600 mb-4">
                                  Bấm nút bên dưới để tạo mã giao dịch với phương thức đã chọn.
                                </p>
                                <button
                                  disabled={busy}
                                  onClick={() => handleStartPayment()}
                                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                                >
                                  {busy ? 'Đang tạo giao dịch…' : 'Lấy thông tin thanh toán'}
                                </button>
                              </div>
                            ) : (
                              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                {/* Hiển thị VietQR SVG */}
                                {selectedMethod === 'qr_pay' && (
                                  <div className="flex flex-col items-center">
                                    {tx.qr_svg ? (
                                      <div
                                        className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 inline-block"
                                        dangerouslySetInnerHTML={{ __html: tx.qr_svg }}
                                      />
                                    ) : (
                                      <p className="text-sm text-slate-500">Đang tạo mã VietQR...</p>
                                    )}
                                    {tx.payment_description && (
                                      <div className="mt-4 text-center text-xs text-slate-600 space-y-1.5 w-full max-w-sm">
                                        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                                          <span className="text-slate-500">Nội dung chuyển khoản:</span>
                                          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                                            <span>{tx.payment_description}</span>
                                            <button
                                              type="button"
                                              onClick={() => copyText(tx.payment_description)}
                                              title="Sao chép nội dung"
                                              className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md hover:bg-emerald-50 transition-colors"
                                            >
                                              <Copy className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                        {copied && (
                                          <p className="text-emerald-600 font-medium text-[11px]">Đã chép nội dung chuyển khoản vào clipboard!</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Hiển thị MoMo */}
                                {selectedMethod === 'momo' && (
                                  <div className="flex flex-col items-center text-center space-y-3">
                                    {tx.qr_svg && (
                                      <div
                                        className="p-3 bg-white rounded-xl shadow-xs border border-pink-200 max-w-[260px]"
                                        dangerouslySetInnerHTML={{ __html: tx.qr_svg }}
                                      />
                                    )}
                                    {tx.checkout?.payUrl && (
                                      <a
                                        href={tx.checkout.payUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg text-xs"
                                      >
                                        Mở MoMo thanh toán <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                )}

                                {/* Hiển thị Store Pay */}
                                {selectedMethod === 'store_pay' && (
                                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-2">
                                    <p className="font-semibold flex items-center gap-1">
                                      <Store className="w-4 h-4 text-amber-700" /> Thanh toán trực tiếp tại quầy tiếp đón
                                    </p>
                                    <p>Vui lòng đến bệnh viện trước giờ khám ít nhất 30 phút và cung cấp mã đặt lịch <strong>{booking.code}</strong> cho nhân viên quầy để thanh toán.</p>
                                  </div>
                                )}

                                {/* Chi tiết giao dịch đang chờ */}
                                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Mã giao dịch (TxCode):</span>
                                    <span className="font-mono font-medium text-slate-800">{tx.transaction_code}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Số tiền thanh toán:</span>
                                    <span className="font-bold text-slate-900">{money(tx.amount || booking.payment?.total_amount)}</span>
                                  </div>
                                </div>

                                {/* KHU VỰC THỬ NGHIỆM KỊCH BẢN E2E (E04 / T14 / T02) */}
                                <div className="pt-2 border-t border-slate-200">
                                  <p className="text-xs font-semibold text-slate-700 mb-2">Thử nghiệm kịch bản thanh toán (Sandbox):</p>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => handleSimulate('success')}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      {busy ? 'Đang xử lý…' : 'Xác nhận Thành công (T02)'}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => handleSimulate('failed')}
                                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      {busy ? 'Đang xử lý…' : 'Giả lập Lỗi & Thử lại (E04 / T14)'}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => handleStartPayment()}
                                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                                    >
                                      <RefreshCw className="w-3 h-3" /> Thử lại / Đổi mã
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500">
                      <p>Lịch khám đã hết hạn thời gian giữ chỗ.</p>
                      <Link to="/doctors" className="mt-2 inline-block text-emerald-600 hover:underline text-sm font-medium">
                        Tìm lịch khác để đặt mới
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <p className="font-bold text-slate-800 text-lg">
                      {booking.payment?.status === 'paid' ? 'Lịch khám này đã được thanh toán thành công!' : 'Lịch khám đã kết thúc trạng thái thanh toán.'}
                    </p>
                    {booking.ticket && (
                      <Link
                        to={`/bookings/${id}/ticket`}
                        className="inline-flex items-center gap-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm"
                      >
                        Xem phiếu khám & STT
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: TÓM TẮT HÓA ĐƠN & THÔNG TIN LỊCH KHÁM */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                  Mã: {booking.code}
                </span>
                <h3 className="font-bold text-slate-900 mt-2 text-base">
                  {booking.doctor_name || booking.hospital_name || 'Khám tổng quát'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {[booking.specialty_name, booking.hospital_name].filter(Boolean).join(' · ')}
                </p>
              </div>

              <div className="text-xs space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Ngày khám:</span>
                  <span className="font-medium text-slate-900">{booking.work_date || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Khung giờ:</span>
                  <span className="font-medium text-slate-900">
                    {booking.start_time ? `${booking.start_time.slice(0, 5)} - ${booking.end_time?.slice(0, 5) || ''}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Người khám:</span>
                  <span className="font-medium text-slate-900">{booking.patient_snapshot?.full_name || '—'}</span>
                </div>
              </div>

              {/* BẢNG TÍNH TIỀN CHUẨN */}
              <div className="border-t border-slate-100 pt-3 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Phí khám dịch vụ:</span>
                  <span>{money(booking.payment?.exam_fee || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí tiện ích MedSi:</span>
                  <span>{money(booking.payment?.service_fee || 20000)}</span>
                </div>
                {Number(booking.payment?.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Voucher giảm giá:</span>
                    <span>-{money(booking.payment.discount_amount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-sm text-slate-900">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-emerald-700 text-base">{money(booking.payment?.total_amount || 0)}</span>
                </div>
              </div>
            </div>

            {/* ĐƯỜNG DẪN HOÀN TIỀN */}
            {booking.refunds && booking.refunds.length > 0 && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900 space-y-2">
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" /> Có {booking.refunds.length} yêu cầu hoàn tiền
                </p>
                <Link
                  to={`/bookings/${id}/refunds`}
                  className="inline-block text-purple-700 hover:text-purple-900 underline font-medium"
                >
                  Xem chi tiết lịch sử hoàn tiền $\rightarrow$
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
