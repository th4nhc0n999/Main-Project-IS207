import React, { useState, useMemo } from 'react';
import {
  Search,
  Check,
  CreditCard as CardIcon,
  Wifi,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export const POPULAR_BANKS = [
  { id: 'VCB', name: 'Vietcombank', fullName: 'Ngân hàng Ngoại Thương Việt Nam', color: 'from-emerald-700 to-teal-900' },
  { id: 'TCB', name: 'Techcombank', fullName: 'Ngân hàng Kỹ Thương Việt Nam', color: 'from-red-600 to-red-950' },
  { id: 'BIDV', name: 'BIDV', fullName: 'Ngân hàng Đầu tư và Phát triển VN', color: 'from-blue-700 to-indigo-900' },
  { id: 'MB', name: 'MBBank', fullName: 'Ngân hàng Quân Đội', color: 'from-blue-600 to-blue-900' },
  { id: 'CTG', name: 'VietinBank', fullName: 'Ngân hàng Công Thương Việt Nam', color: 'from-cyan-700 to-blue-950' },
  { id: 'ACB', name: 'ACB', fullName: 'Ngân hàng Á Châu', color: 'from-blue-500 to-sky-800' },
  { id: 'VPB', name: 'VPBank', fullName: 'Ngân hàng Việt Nam Thịnh Vượng', color: 'from-emerald-600 to-green-900' },
  { id: 'TPB', name: 'TPBank', fullName: 'Ngân hàng Tiên Phong', color: 'from-purple-600 to-violet-950' },
];

export function AtmCardForm({ bookingCode, onContinue, onBack }) {
  const [selectedBank, setSelectedBank] = useState(POPULAR_BANKS[0]);
  const [bankSearch, setBankSearch] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [phone, setPhone] = useState('0901234567');
  const [email, setEmail] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredBanks = useMemo(() => {
    if (!bankSearch) return POPULAR_BANKS;
    const lower = bankSearch.toLowerCase();
    return POPULAR_BANKS.filter(
      (b) => b.name.toLowerCase().includes(lower) || b.fullName.toLowerCase().includes(lower)
    );
  }, [bankSearch]);

  // Format card number with spaces (e.g. 9704 1234 5678 9012)
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 19);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  // Format MM/YY
  const handleIssueDateChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setIssueDate(raw);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 12) {
      setErrorMsg('Vui lòng nhập số thẻ ATM hợp lệ (ít nhất 12 chữ số).');
      return;
    }
    if (!cardHolder.trim()) {
      setErrorMsg('Vui lòng nhập tên chủ thẻ in trên mặt thẻ.');
      return;
    }
    if (!issueDate || issueDate.length < 5) {
      setErrorMsg('Vui lòng nhập ngày phát hành/hết hạn theo định dạng MM/YY.');
      return;
    }
    if (!phone) {
      setErrorMsg('Vui lòng nhập số điện thoại để nhận mã OTP.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Bạn cần đồng ý với các điều khoản thanh toán để tiếp tục.');
      return;
    }

    setErrorMsg('');
    onContinue({
      type: 'atm',
      bank: selectedBank,
      cardNumber,
      cardHolder: cardHolder.toUpperCase(),
      issueDate,
      phone,
      email,
    });
  };

  // Render display card number on visual card
  const displayCardNumber = () => {
    if (!cardNumber) return '**** **** **** ****';
    const raw = cardNumber.replace(/\s/g, '');
    const padded = raw.padEnd(16, '*');
    return `${padded.slice(0, 4)} ${padded.slice(4, 8)} ${padded.slice(8, 12)} ${padded.slice(12, 16)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">
            Nhập thông tin thẻ ATM nội địa
          </h3>
          <p className="text-xs text-slate-500">
            Mã đơn hàng: <span className="font-semibold text-blue-600">{bookingCode}</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500">
          <ArrowLeft className="w-4 h-4 mr-1" /> Đổi phương thức
        </Button>
      </div>

      {/* 1. Chọn Ngân hàng phát hành */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          1. Chọn ngân hàng phát hành thẻ
        </label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo tên ngân hàng (Vietcombank, MB, BIDV...)"
            value={bankSearch}
            onChange={(e) => setBankSearch(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 max-h-36 overflow-y-auto pr-1">
          {filteredBanks.map((bank) => {
            const isSelected = selectedBank.id === bank.id;
            return (
              <button
                type="button"
                key={bank.id}
                onClick={() => setSelectedBank(bank)}
                className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/80 ring-1 ring-blue-600 text-blue-900 font-semibold'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="truncate">
                  <div className="text-xs font-bold">{bank.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{bank.fullName}</div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. THẺ ATM TRỰC QUAN (Visual Interactive ATM Card) */}
      <div className="flex justify-center py-1">
        <div
          className={`w-full max-w-sm h-52 rounded-2xl p-5 text-white shadow-xl bg-gradient-to-tr ${selectedBank.color} relative overflow-hidden transition-all duration-300 border border-white/20`}
        >
          {/* Họa tiết nền bảo mật */}
          <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -left-8 -top-8 w-36 h-36 rounded-full bg-black/15 blur-lg pointer-events-none" />

          {/* Header thẻ: Ngân hàng & Contactless */}
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="text-base font-extrabold tracking-wider">{selectedBank.name}</div>
              <div className="text-[9px] uppercase text-white/70 font-medium tracking-widest">
                Thẻ Ghi Nợ Nội Địa
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 rotate-90 text-white/80" />
              <span className="font-bold text-xs px-2 py-0.5 rounded bg-white/20 text-white">
                NAPAS
              </span>
            </div>
          </div>

          {/* Chip thẻ EMV vàng kim */}
          <div className="my-3 relative z-10 flex items-center gap-3">
            <div className="w-10 h-8 rounded bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-400 shadow-inner border border-amber-500/40 relative overflow-hidden">
              <div className="absolute inset-0 border-t border-b border-amber-600/30 top-2 bottom-2" />
              <div className="absolute inset-0 border-l border-r border-amber-600/30 left-2 right-2" />
            </div>
            <CardIcon className="w-4 h-4 text-white/40" />
          </div>

          {/* Số thẻ hiển thị trực quan live */}
          <div className="font-mono text-lg sm:text-xl tracking-widest font-semibold relative z-10 drop-shadow-sm">
            {displayCardNumber()}
          </div>

          {/* Thông tin chủ thẻ & ngày phát hành */}
          <div className="mt-3 flex items-end justify-between relative z-10 text-xs">
            <div>
              <div className="text-[9px] text-white/70 uppercase tracking-wider">
                Chủ thẻ / Card Holder
              </div>
              <div className="font-mono font-bold tracking-wider uppercase truncate max-w-[190px]">
                {cardHolder || 'CARD HOLDER NAME'}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[9px] text-white/70 uppercase tracking-wider">
                Phát hành / Exp
              </div>
              <div className="font-mono font-bold tracking-wider">
                {issueDate || 'MM/YY'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Form nhập dữ liệu */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {errorMsg && (
          <div className="flex items-center gap-2 text-xs p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700">
              Số thẻ ATM <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: 9704 2200 1234 5678"
              value={cardNumber}
              onChange={handleCardNumberChange}
              maxLength={23}
              className="font-mono text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Tên in trên thẻ (không dấu) <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: NGUYEN VAN AN"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              className="uppercase font-mono text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Ngày hết hạn / phát hành (MM/YY) <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="MM/YY (VD: 08/28)"
              value={issueDate}
              onChange={handleIssueDateChange}
              maxLength={5}
              className="font-mono text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Số điện thoại nhận OTP <span className="text-rose-500">*</span>
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

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Email nhận hóa đơn (tùy chọn)
            </label>
            <Input
              type="email"
              placeholder="an.nguyen@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        <div className="flex items-start gap-2 pt-2">
          <input
            type="checkbox"
            id="agreeTermsAtm"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
          />
          <label htmlFor="agreeTermsAtm" className="text-xs text-slate-600 cursor-pointer leading-relaxed">
            Tôi đồng ý với các{' '}
            <span className="text-blue-600 underline font-medium">Điều khoản sử dụng</span> và chính sách thanh toán bảo mật của YouMed và cổng thanh toán NAPAS.
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
