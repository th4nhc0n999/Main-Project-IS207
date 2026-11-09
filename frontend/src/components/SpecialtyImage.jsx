import { Stethoscope } from 'lucide-react'

// Official YouMed specialty icons downloaded directly from https://youmed.vn
const images = [
  // 14 Core Specialties in Database & UI
  [/xương khớp|cơ xương khớp/i, 'Coxuongkhop'],
  [/da liễu/i, 'Dalieu'],
  [/hô hấp|phổi/i, 'Hohap'],
  [/mắt|nhãn khoa/i, 'Nhankhoa'],
  [/ngoại tổng quát/i, 'ngoaitongquat'],
  [/nhi khoa/i, 'Nhikhoa'],
  [/nội tổng quát|đa khoa/i, 'Noitongquat'],
  [/răng.*hàm.*mặt|nha khoa/i, 'Ranghammat'],
  [/sản phụ khoa|sản khoa|phụ khoa/i, 'sanphukhoa'],
  [/tai.*mũi.*họng/i, 'taimuihong'],
  [/ngoại thần kinh/i, 'Ngoaithankinh'],
  [/nội thần kinh|thần kinh/i, 'Noithankinh'],
  [/tiêu (hóa|hoá)|gan mật/i, 'tieuhoa'],
  [/tim mạch/i, 'timmach'],
  [/ung bướu|ung thư/i, 'ungbuou'],

  // Additional Specializations
  [/nội tiết|tiểu đường/i, 'Noitiet'],
  [/nam khoa/i, 'Namkhoa'],
  [/nội thận|thận/i, 'Noithan'],
  [/ngoại tiết niệu|tiết niệu/i, 'Ngoaitietnieu'],
  [/tâm lý/i, 'tamly'],
  [/tâm thần/i, 'tamthan'],
  [/chấn thương chỉnh hình/i, 'Chanthuongchinhhinh'],
  [/dị ứng.*miễn dịch/i, 'Diungmiendich'],
  [/y học cổ truyền|đông y/i, 'Yhoccotruyen'],
  [/xét nghiệm/i, 'xetnghiem'],
  [/chẩn đoán hình ảnh|siêu âm|x-quang|mri|ct/i, 'Chandoanhinhanh'],
  [/dinh dưỡng/i, 'Dinhduong'],
  [/vật lý trị liệu|phục hồi chức năng/i, 'vatlitrilieu'],
  [/vô sinh|hiếm muộn/i, 'vosinhhiemmuon'],
  [/lao.*bệnh phổi/i, 'laobenhphoi'],
  [/truyền nhiễm/i, 'truyennhiem'],
  [/hồi sức.*cấp cứu|cấp cứu/i, 'hoisuccapcuu'],
  [/lão khoa|người cao tuổi/i, 'laokhoa'],
  [/lồng ngực.*mạch máu|mạch máu/i, 'ngoailongngucmachmau'],
  [/huyết học|máu/i, 'huyet-hoc'],
  [/ngôn ngữ trị liệu/i, 'ngonngutrilieu'],
  [/tạo hình|thẩm mỹ|phẫu thuật tạo hình/i, '37_phauthuattaohinhthammy'],
  [/thể thao|y học thể thao/i, 'yhocthethao'],
  [/gây mê.*hồi sức/i, 'Gaymehoisuc'],
  [/dự phòng|y học dự phòng/i, 'yhocduphong'],
]

export default function SpecialtyImage({ name, size = 48, className = '' }) {
  if (!name) return <Stethoscope size={size} aria-hidden="true" className={className} />

  const matched = images.find(([pattern]) => pattern.test(name))
  const filename = matched ? matched[1] : null

  if (filename) {
    return (
      <img
        src={`/media/specialties/${filename}.png`}
        alt=""
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'contain', flexShrink: 0 }}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    )
  }

  return <Stethoscope size={size} aria-hidden="true" className={className} />
}
