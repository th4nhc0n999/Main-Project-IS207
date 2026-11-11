import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import BookingSteps from '@/components/BookingSteps'
import BookingSignIn from '@/components/BookingSignIn'
import { useAuth } from '@/context/AuthContext'
import paymentApi from '@/api/paymentApi'
import useApi, { money } from '@/api/useApi'

const methods = [
  { id: 'momo', name: 'Ví MoMo', logo: 'momo.png' },
  { id: 'qr_pay', name: 'Chuyển khoản VietQR', logo: 'vietqr.png' },
  { id: 'atm', name: 'Thẻ ATM nội địa', logo: 'napas.png' },
  { id: 'credit_card', name: 'Thẻ quốc tế', logo: 'visa.svg' },
]
const refundLabels = { requested: 'Đã yêu cầu', approved: 'Đã duyệt', processing: 'Đang xử lý', succeeded: 'Đã hoàn tiền', failed: 'Hoàn tiền thất bại', rejected: 'Bị từ chối' }
const providerMethods = ['momo', 'atm', 'credit_card']
const dateTime = value => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

export default function PaymentPage() {
  const [params] = useSearchParams()
  const { bookingId } = useParams()
  const id = bookingId || params.get('booking_id')
  const { user, loading } = useAuth()
  if (loading) return <p className="clinic">Đang kiểm tra tài khoản…</p>
  if (!user) return <BookingSignIn title="Thanh toán lịch khám" />
  const returnedOrder = params.get('from') === 'momo' ? params.get('orderId') : null
  return <PaymentDetail key={id} id={id} refundsOnly={Boolean(bookingId)} returnedOrder={returnedOrder} />
}

function PaymentDetail({ id, refundsOnly, returnedOrder }) {
  const [revision, refresh] = useState(0)
  const { data, error } = useApi(id ? '/me/bookings/' + id : null, revision)
  const booking = data?.data
  const payment = booking?.payment
  const [choice, choose] = useState('')
  const [checkout, setTx] = useState(null)
  const [busy, setBusy] = useState(false)
  const [issue, setIssue] = useState('')
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(Date.now)
  const pending = booking?.status === 'pending_payment'
  const code = payment?.pending_transaction_code
  const tx = code && checkout?.transaction_code === code ? checkout : null
  const method = code ? payment.method : choice
  const counter = method === 'store_pay' && Boolean(code)
  const provider = providerMethods.includes(method)
  const pendingCode = payment?.pending_transaction_code
  useEffect(() => {
    if (!pending || !provider || !pendingCode || pendingCode !== returnedOrder) return
    let active = true
    paymentApi.queryMomo(pendingCode).then(({ data: result }) => {
      if (!active) return
      if (result.status === 'pending') setNotice('MoMo đang xử lý. Bạn có thể kiểm tra lại tại đây.')
      else {
        if (result.status === 'failed') setNotice('Giao dịch đã dừng. Bạn có thể chọn lại nếu lịch còn hạn.')
        refresh(v => v + 1)
      }
    }).catch(err => {
      if (active) setIssue(err.message || 'Chưa lấy được kết quả từ MoMo.')
    })
    return () => { active = false }
  }, [returnedOrder, pending, provider, pendingCode])
  const deadline = Date.parse(tx?.hold_expires_at || booking?.hold_expires_at)
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000))
  const grace = code && !counter && now >= deadline && now < deadline + payment?.grace_minutes * 60000
  useEffect(() => {
    if (!pending) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [pending])

  async function act(action) {
    if (busy) return
    setBusy(true)
    setIssue('')
    setNotice('')
    try {
      if (action === 'start') {
        const { data: result } = await paymentApi.start({ booking_id: Number(id), method })
        setTx({ ...result, method })
      } else if (action === 'query') {
        const { data: result } = await paymentApi.queryMomo(code)
        if (result.status === 'pending') setNotice('MoMo chưa có kết quả cuối cùng.')
        if (result.status === 'failed') setNotice('Giao dịch thất bại. Bạn có thể chọn lại nếu lịch còn hạn.')
        if (result.status !== 'pending') setTx(null)
      } else {
        const abandon = action === 'change-method'
        const { data: result } = await paymentApi.simulate({ transaction_code: code, status: abandon ? 'failed' : action })
        setTx(null)
        if (abandon && result.status === 'failed') {
          choose('')
          setNotice('Đã dừng lượt VietQR thử nghiệm. Bạn có thể chọn phương thức khác trong thời gian còn lại.')
        }
        if (action === 'failed') setNotice('Giao dịch thử nghiệm thất bại. Hạn giữ chỗ vẫn giữ nguyên.')
      }
    } catch (err) {
      setIssue(err.message || 'Không thể kiểm tra thanh toán.')
    } finally {
      refresh(v => v + 1)
      setBusy(false)
    }
  }

  return <section className="clinic payment-sheet">
    <Link to="/my-bookings">← Lịch khám của tôi</Link>
    <h1>{refundsOnly ? 'Theo dõi hoàn tiền' : 'Thanh toán lịch khám'}</h1>
    {!refundsOnly && <BookingSteps current={3} />}
    {!booking ? <p role="status">{error || (id ? 'Đang tải lịch khám…' : 'Vui lòng chọn lịch cần thanh toán.')}</p> :
      <article className="space-y-4">
        <h2>{booking.doctor_name || booking.hospital_name}</h2>
        <p>Mã lịch <strong>{booking.code}</strong> · {booking.work_date} · {booking.start_time?.slice(0,5)}</p>
        {refundsOnly ? <>{!booking.refunds?.length && <p>Chưa có yêu cầu hoàn tiền.</p>}
          {booking.refunds?.map(r => <p key={r.id}>{refundLabels[r.status]} · {money(r.amount)} · {dateTime(r.requested_at)}{r.processed_at && ' · Xử lý ' + dateTime(r.processed_at)}</p>)}</> :
          !payment ? <p role="alert">Lịch này chưa có hóa đơn.</p> : <>
          <dl className="space-y-2 border-y py-3">
            <div className="flex justify-between"><dt>Phí khám</dt><dd>{money(payment.exam_fee)}</dd></div>
            <div className="flex justify-between"><dt>Phí tiện ích</dt><dd>{money(payment.service_fee)}</dd></div>
            {payment.discount_amount > 0 && <div className="flex justify-between"><dt>Giảm giá</dt><dd>{money(payment.discount_amount)}</dd></div>}
            <div className="flex justify-between font-bold"><dt>Tổng thanh toán</dt><dd>{money(payment.total_amount)}</dd></div>
          </dl>
          {pending && remaining > 0 ? <>
            <p>{counter ? 'Hạn thanh toán tại quầy: ' + dateTime(deadline) :
              'Thời gian giữ chỗ còn ' + Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2,'0')}</p>
            {!code && <fieldset disabled={busy}><legend>Chọn phương thức thanh toán</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">{methods.map(({id: value, name, logo}) =>
                <label key={value} className="pay-choice">
                  <img className="pay-method-logo" src={'/media/payment/' + logo} alt=""/>
                  <span>{name}</span>
                  <input type="radio" name="method" value={value} checked={method===value} onChange={() => {choose(value);setIssue('');setNotice('')}}/>
                </label>)}</div></fieldset>}
            {code && <p>Phương thức: <strong>{counter ? 'Tại quầy (lịch cũ)' : methods.find(m => m.id === method)?.name}</strong></p>}
            {counter ? <p>Lịch này đã đăng ký trả tại quầy trước khi phương thức ngừng hỗ trợ. Vui lòng liên hệ hỗ trợ và cung cấp mã lịch {booking.code}.</p> : <>
              {!tx && <button disabled={busy || !method} onClick={() => act('start')}>{code ? 'Mở lại giao dịch' : 'Tiếp tục thanh toán'}</button>}
              {tx?.qr_svg && <figure><img width="288" height="288" alt={provider ? 'Mã thanh toán từ MoMo Sandbox' : 'Mã chuyển khoản VietQR'} src={'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(tx.qr_svg)}/>
                <figcaption>{method === 'qr_pay' ? <div className="vietqr-apps">
                  <strong>Dùng ứng dụng để quét VietQR</strong>
                  <ul aria-label="Ví và ứng dụng ngân hàng">
                    {[['MoMo','momo'], ['Vietcombank','VCB'], ['BIDV','BIDV'], ['Techcombank','TCB'], ['VietinBank','ICB'], ['MB','MB']].map(([name, file]) =>
                      <li key={name}><img src={'/media/payment/' + file + '.png'} alt={name}/></li>)}
                  </ul>
                </div> : 'Quét bằng MoMo Test.'}</figcaption></figure>}
              {tx?.payment_description && <p>Nội dung: {tx.payment_description}</p>}
              {tx?.checkout?.payUrl && <a className="inline-block font-semibold underline" href={tx.checkout.payUrl}>Mở trang thanh toán của MoMo Sandbox</a>}
              {tx?.needs_query && <p>Đang chờ kết quả tạo giao dịch từ MoMo.</p>}
              {code && method === 'qr_pay' && <button disabled={busy} className="secondary-action" onClick={() => act('change-method')}>Đổi phương thức thanh toán</button>}
              {provider && code && <p>Để đổi phương thức, trên trang MoMo chọn “Quay về”, rồi chọn “Huỷ giao dịch”. MedSi sẽ kiểm tra kết quả khi bạn quay lại lịch này.</p>}
              {method==='qr_pay' && tx?.simulation && <div><p>Mô phỏng kết quả thu tiền để kiểm thử:</p>
                <button disabled={busy} onClick={()=>act('success')}>Mô phỏng đã thu tiền</button>
                <button disabled={busy} className="secondary-action" onClick={()=>act('failed')}>Mô phỏng thất bại</button></div>}
            </>}
          </> : <p role="status">{pending ? (grace ? 'Đã hết thời gian tạo thanh toán. Đang chờ kết quả giao dịch cũ.' : 'Đã hết thời gian giữ chỗ.') :
            ({pending_approval:'Đã nhận tiền. Lịch đang chờ bác sĩ duyệt.', confirmed:'Lịch khám đã xác nhận.', expired:'Lịch khám đã hết hạn.',cancelled:'Lịch khám đã hủy.'}[booking.status] || 'Đã kết thúc bước thanh toán.')}</p>}
          {provider && code && <button disabled={busy} className="secondary-action" onClick={()=>act('query')}>Kiểm tra kết quả từ MoMo</button>}
          {booking.ticket && <p><Link to={'/bookings/'+id+'/ticket'}>Xem phiếu khám</Link></p>}
          {booking.refunds?.length > 0 && <Link to={'/bookings/'+id+'/refunds'}>Theo dõi hoàn tiền</Link>}
        </>}
        {issue && <p role="alert">{issue}</p>}
        {notice && <p role="status">{notice}</p>}
        <button disabled={busy} className="secondary-action" onClick={()=>refresh(v=>v+1)}>Cập nhật trạng thái</button>
      </article>}
  </section>
}
