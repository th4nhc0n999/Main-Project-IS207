import { Stethoscope } from 'lucide-react'

// Source images: https://youmed.vn/ — section “Đặt lịch theo Chuyên khoa”.
const images = [
  [/tim mạch/i, 'timmach'], [/nhi khoa/i, 'Nhikhoa'],
  [/da liễu/i, 'Dalieu'], [/tai.*mũi.*họng/i, 'taimuihong'],
  [/xương khớp/i, 'Coxuongkhop'], [/sản phụ khoa/i, 'sanphukhoa'],
  [/tiêu (hóa|hoá)/i, 'tieuhoa'], [/mắt|nhãn khoa/i, 'Nhankhoa'],
]

export default function SpecialtyImage({ name, size = 48 }) {
  const image = images.find(([pattern]) => pattern.test(name))?.[1]
  return image
    ? <img src={'/media/specialties/' + image + '.png'} alt="" width={size} height={size} style={{objectFit:'contain',flexShrink:0}}/>
    : <Stethoscope size={size} aria-hidden="true"/>
}

