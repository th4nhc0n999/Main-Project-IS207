import BookingSteps from '@/components/BookingSteps'
import {useState,useEffect} from 'react'
import {Link,useSearchParams,useParams} from 'react-router-dom'
import client from '@/api/axiosClient'
import useApi,{money} from '@/api/useApi'

const refundLabels={requested:'Đã yêu cầu',approved:'Đã duyệt',processing:'Đang xử lý',succeeded:'Đã hoàn tiền',failed:'Thất bại',rejected:'Bị từ chối'}
export default function PaymentPage(){
  const [params]=useSearchParams()
  const {bookingId}=useParams()
  const id=bookingId || params.get('booking_id')
  return <PaymentDetail key={id} id={id} refundsOnly={Boolean(bookingId)}/>
}
function PaymentDetail({id,refundsOnly}){
  const [revision,refresh]=useState(0)
  const {data,error}=useApi(id?'/me/bookings/'+id:null,revision)
  const booking=data?.data
  const [now,setNow]=useState(Date.now)
  const [tx,setTx]=useState(null)
  const [issue,setIssue]=useState('')
  const [busy,setBusy]=useState(false)
  useEffect(()=>{
    if (!booking || booking.status!=='pending_payment') return
    const timer=setInterval(()=>setNow(Date.now()),1000)
    return ()=>clearInterval(timer)
  },[booking])
  const remaining=Math.max(0,Math.ceil((Date.parse(booking?.hold_expires_at)-now)/1000))
  async function pay(){
    setBusy(true);setIssue('')
    try {
      if (!tx) setTx((await client.post('/payments/start',{booking_id:id,method:'qr_pay'})).data)
      else {await client.post('/payments/simulate',{transaction_code:tx.transaction_code,status:'success'});refresh(v=>v+1)}
    } catch(err){setIssue(err.message)} finally {setBusy(false)}
  }
  return <section className="clinic payment-sheet"><Link to="/my-bookings">Lịch khám của tôi</Link><h1>{refundsOnly?'Theo dõi hoàn tiền':'Thanh toán QR'}</h1>{!refundsOnly && <BookingSteps current={3}/>}
    {!booking ? <p role="status">{error || (id?'Đang tải lịch…':'Hãy chọn lịch cần thanh toán.')}</p> : <article><h2>{booking.code}</h2><p>{[booking.doctor_name,booking.hospital_name,booking.work_date,booking.start_time].filter(Boolean).join(' · ')}</p>
    {refundsOnly ? <>{booking.refunds.length===0 && <p>Chưa có yêu cầu hoàn tiền.</p>}{booking.refunds.map(r=><p key={r.id}>{refundLabels[r.status]} · {money(r.amount)} · Ngày yêu cầu {r.requested_at}{r.processed_at && ' · Xử lý '+r.processed_at}</p>)}</> :
    <><p>Phí khám {money(booking.payment.exam_fee)} · Phí tiện ích {money(booking.payment.service_fee)}</p><h2>Tổng {money(booking.payment.total_amount)}</h2>
    {booking.status==='pending_payment' ? remaining>0 ? <><p>Thời gian giữ chỗ còn {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</p>
    {tx?.qr_svg && <img width="240" height="240" alt="Mã QR thanh toán thử nghiệm" src={'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(tx.qr_svg)}/>}
    <button disabled={busy} onClick={pay}>{tx?'Xác nhận giao dịch thử nghiệm':'Lấy mã QR thử nghiệm'}</button></> : <p>Đã hết thời gian giữ chỗ.</p> : <p>{booking.payment.status==='paid'?'Đã thanh toán.':'Lịch đã kết thúc thanh toán.'}</p>}
    {booking.ticket && <Link to={'/bookings/'+id+'/ticket'}>Xem phiếu khám</Link>}</>}
    <p role="alert">{issue}</p><button className="secondary-action" onClick={()=>refresh(v=>v+1)}>Cập nhật trạng thái</button></article>}</section>
}