import React, { useState } from 'react';
import {
  CreditCard,
  Wifi,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export function CreditCardForm({ bookingCode, onContinue, onBack }) {
  const [cardBrand, setCardBrand] = useState('visa');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [phone, setPhone] = useState('0901234567');
  const [email, setEmail] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);

    // Auto-detect brand based on first digits
    if (raw.startsWith('4')) setCardBrand('visa');
    else if (raw.startsWith('5')) setCardBrand('mastercard');
    else if (raw.startsWith('35')) setCardBrand('jcb');
    else if (raw.startsWith('34') || raw.startsWith('37')) setCardBrand('amex');
  };

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setExpiry(raw);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 15) {
      setErrorMsg('Vui lòng nhập số thẻ quốc tế hợp lệ (15-16 chữ số).');
      return;
    }
    if (!cardHolder.trim()) {
      setErrorMsg('Vui lòng nhập tên chủ thẻ.');
      return;
    }
    if (!expiry || expiry.length < 5) {
      setErrorMsg('Vui lòng nhập hạn sử dụng thẻ (MM/YY).');
      return;
    }
    if (!cvv || cvv.length < 3) {
      setErrorMsg('Vui lòng nhập mã bảo mật CVV/CVC (3-4 số).');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Vui lòng đồng ý với các điều khoản thanh toán.');
      return;
    }

    setErrorMsg('');
    onContinue({
      type: 'credit_card',
      cardBrand,
      cardNumber,
      cardHolder: cardHolder.toUpperCase(),
      expiry,
      cvv,
      phone,
      email,
    });
  };

  const displayCardNumber = () => {
    if (!cardNumber) return '•••• •••• •••• ••••';
    const raw = cardNumber.replace(/\s/g, '');
    const padded = raw.padEnd(16, '•');
    return `${padded.slice(0, 4)} ${padded.slice(4, 8)} ${padded.slice(8, 12)} ${padded.slice(12, 16)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">
            Thẻ thanh toán quốc tế
          </h3>
          <p className="text-xs text-slate-500">
            Mã đơn hàng: <span className="font-semibold text-blue-600">{bookingCode}</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500">
          <ArrowLeft className="w-4 h-4 mr-1" /> Đổi phương thức
        </Button>
      </div>

      {/* Brand Tabs */}
      <div className="flex items-center gap-2">
        {['visa', 'mastercard', 'jcb', 'amex'].map((brand) => (
          <button
            key={brand}
            type="button"
            onClick={() => setCardBrand(brand)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase transition-all cursor-pointer ${
              cardBrand === brand
                ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            }`}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* Visual Credit Card */}
      <div className="flex justify-center py-1">
        <div className="w-full max-w-sm h-52 rounded-2xl p-5 text-white shadow-xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 relative overflow-hidden transition-all duration-300 border border-white/20">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-blue-500/20 blur-xl pointer-events-none" />
          <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-purple-500/20 blur-lg pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <span className="font-extrabold text-sm tracking-wider uppercase text-blue-200">
              International Card
            </span>
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 rotate-90 text-white/80" />
              <span className="font-black text-sm uppercase px-2 py-0.5 rounded bg-white/15">
                {cardBrand}
              </span>
            </div>
          </div>

          <div className="my-3 relative z-10 flex items-center gap-3">
            <div className="w-10 h-8 rounded bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-400 shadow-inner border border-amber-500/40 relative overflow-hidden" />
            <Lock className="w-3.5 h-3.5 text-white/50" />
          </div>

          <div className="font-mono text-lg sm:text-xl tracking-widest font-semibold relative z-10 drop-shadow-sm">
            {displayCardNumber()}
          </div>

          <div className="mt-3 flex items-end justify-between relative z-10 text-xs">
            <div>
              <div className="text-[9px] text-white/70 uppercase tracking-wider">
                Card Holder
              </div>
              <div className="font-mono font-bold tracking-wider uppercase truncate max-w-[190px]">
                {cardHolder || 'CARD HOLDER NAME'}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[9px] text-white/70 uppercase tracking-wider">
                Expires
              </div>
              <div className="font-mono font-bold tracking-wider">
                {expiry || 'MM/YY'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {errorMsg && (
          <div className="flex items-center gap-2 text-xs p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1 sm:col-span-3">
            <label className="text-xs font-semibold text-slate-700">
              Số thẻ quốc tế <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: 4532 0123 4567 8910"
              value={cardNumber}
              onChange={handleCardNumberChange}
              maxLength={19}
              className="font-mono text-sm"
              required
            />
          </div>

          <div className="space-y-1 sm:col-span-3">
            <label className="text-xs font-semibold text-slate-700">
              Tên chủ thẻ (như trên thẻ) <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: NGUYEN VAN AN"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              className="uppercase font-mono text-sm"
              required
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700">
              Ngày hết hạn (MM/YY) <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="MM/YY"
              value={expiry}
              onChange={handleExpiryChange}
              maxLength={5}
              className="font-mono text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              CVV / CVC <span className="text-rose-500">*</span>
            </label>
            <Input
              type="password"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              className="font-mono text-sm"
              required
            />
          </div>

          <div className="space-y-1 sm:col-span-3">
            <label className="text-xs font-semibold text-slate-700">
              Số điện thoại liên hệ <span className="text-rose-500">*</span>
            </label>
            <Input
              type="tel"
              placeholder="0901234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-sm"
              required
            />
          </div>
        </div>

        <div className="flex items-start gap-2 pt-2">
          <input
            type="checkbox"
            id="agreeTermsCredit"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
          />
          <label htmlFor="agreeTermsCredit" className="text-xs text-slate-600 cursor-pointer">
            Tôi đồng ý với các điều khoản bảo mật thanh toán quốc tế và xác thực 3D-Secure.
          </label>
        </div>

        <div className="pt-3 flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="w-1/3">
            Quay lại
          </Button>
          <Button type="submit" variant="default" className="w-2/3 font-semibold shadow-md">
            Tiếp tục
          </Button>
        </div>
      </form>
    </div>
  );
}
