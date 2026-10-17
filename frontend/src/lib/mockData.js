// Mock Data and LocalStorage Store for MedSi Application

const STORAGE_KEYS = {
  BOOKINGS: "medsi_mock_bookings",
  SPECIALTIES: "medsi_mock_specialties",
  DOCTORS: "medsi_mock_doctors",
  HOSPITALS: "medsi_mock_hospitals",
  SLOTS: "medsi_mock_slots",
  PATIENT_PROFILES: "medsi_mock_patient_profiles",
}

// 1. Initial Specialties
export const initialSpecialties = [
  {
    id: 1,
    name: "Tim Mạch",
    description: "Khám và điều trị các bệnh lý huyết áp, mạch vành, rối loạn nhịp tim",
    icon: "HeartPulse",
    image: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=300&auto=format&fit=crop&q=80",
    doctorCount: 8,
  },
  {
    id: 2,
    name: "Nhi Khoa",
    description: "Chăm sóc sức khỏe toàn diện và tiêm chủng cho trẻ sơ sinh và trẻ nhỏ",
    icon: "Baby",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=300&auto=format&fit=crop&q=80",
    doctorCount: 12,
  },
  {
    id: 3,
    name: "Da Liễu",
    description: "Chẩn đoán và điều trị bệnh ngoài da, dị ứng, thẩm mỹ da liễu",
    icon: "Sparkles",
    image: "https://images.unsplash.com/photo-1512290900672-1f5be6343513?w=300&auto=format&fit=crop&q=80",
    doctorCount: 9,
  },
  {
    id: 4,
    name: "Tai Mũi Họng",
    description: "Nội soi, điều trị viêm xoang, viêm họng, viêm amidan và thính giác",
    icon: "Ear",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=300&auto=format&fit=crop&q=80",
    doctorCount: 11,
  },
  {
    id: 5,
    name: "Cơ Xương Khớp",
    description: "Thoái hóa cột sống, thoát vị đĩa đệm, chấn thương thể thao và phục hồi chức năng",
    icon: "Activity",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&auto=format&fit=crop&q=80",
    doctorCount: 7,
  },
  {
    id: 6,
    name: "Sản Phụ Khoa",
    description: "Khám thai định kỳ, sàng lọc dị tật thai nhi, điều trị phụ khoa chuyên sâu",
    icon: "HeartHandshake",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300&auto=format&fit=crop&q=80",
    doctorCount: 10,
  },
  {
    id: 7,
    name: "Tiêu Hóa - Gan Mật",
    description: "Nội soi dạ dày - đại tràng không đau, tầm soát ung thư đường tiêu hóa",
    icon: "Stethoscope",
    image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=300&auto=format&fit=crop&q=80",
    doctorCount: 6,
  },
  {
    id: 8,
    name: "Mắt - Nhãn Khoa",
    description: "Khám tật khúc xạ, phẫu thuật cận thị, điều trị đục thủy tinh thể",
    icon: "Eye",
    image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=300&auto=format&fit=crop&q=80",
    doctorCount: 5,
  },
]

// 2. Initial Doctors
export const initialDoctors = [
  {
    id: 1,
    name: "BS. CKII Nguyễn Văn Hùng",
    title: "Bác sĩ Chuyên khoa II",
    specialty_id: 1,
    specialty_name: "Tim Mạch",
    experience_years: 18,
    city: "Hồ Chí Minh",
    district: "Quận 1",
    address: "Phòng khám MedSi Quận 1 — 120 Hai Bà Trưng, P. Bến Nghé, Quận 1, TP.HCM",
    lat: 10.7816,
    lng: 106.6992,
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
    fee: 400000,
    rating: 4.9,
    reviews_count: 245,
    bio: "Nguyên Trưởng khoa Tim Mạch Can Thiệp Bệnh viện Chợ Rẫy với hơn 18 năm kinh nghiệm chuyên sâu trong điều trị tăng huyết áp, suy tim và can thiệp mạch vành.",
    workplace: "Bệnh viện Chợ Rẫy & MedSi Clinic",
  },
  {
    id: 2,
    name: "PGS.TS.BS Trần Thị Mai Lan",
    title: "Phó Giáo sư, Tiến sĩ, Bác sĩ",
    specialty_id: 2,
    specialty_name: "Nhi Khoa",
    experience_years: 22,
    city: "Hồ Chí Minh",
    district: "Quận 5",
    address: "Phòng khám Nhi MedSi — 340 Nguyễn Trãi, Phường 8, Quận 5, TP.HCM",
    lat: 10.7562,
    lng: 106.6698,
    avatar: "https://images.unsplash.com/photo-1594824813589-f3089d533b63?w=400&auto=format&fit=crop&q=80",
    fee: 450000,
    rating: 5.0,
    reviews_count: 380,
    bio: "Chuyên gia hàng đầu về hô hấp và dinh dưỡng nhi khoa tại TP.HCM. Giảng viên cao cấp Đại học Y Dược TP.HCM.",
    workplace: "Bệnh viện Nhi Đồng 1 & MedSi Kids",
  },
  {
    id: 3,
    name: "ThS.BS Lê Hoàng Nam",
    title: "Thạc sĩ, Bác sĩ Chuyên khoa I",
    specialty_id: 3,
    specialty_name: "Da Liễu",
    experience_years: 12,
    city: "Hồ Chí Minh",
    district: "Quận 3",
    address: "Trung tâm Da Liễu Thẩm Mỹ MedSi — 88 Nam Kỳ Khởi Nghĩa, Quận 3, TP.HCM",
    lat: 10.7820,
    lng: 106.6885,
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80",
    fee: 350000,
    rating: 4.8,
    reviews_count: 190,
    bio: "Tốt nghiệp Thạc sĩ Da liễu ĐHYD, tu nghiệp chuyên sâu về Laser và thẩm mỹ da tại Hàn Quốc. Chuyên trị mụn trứng cá, nám da và sẹo rỗ.",
    workplace: "Bệnh viện Da Liễu TP.HCM & MedSi Skin",
  },
  {
    id: 4,
    name: "BS. CKI Phạm Thanh Tùng",
    title: "Bác sĩ Chuyên khoa I",
    specialty_id: 4,
    specialty_name: "Tai Mũi Họng",
    experience_years: 15,
    city: "Hà Nội",
    district: "Hoàn Kiếm",
    address: "Phòng khám MedSi Hà Nội — 45 Tràng Thi, Hoàn Kiếm, Hà Nội",
    lat: 21.0261,
    lng: 105.8504,
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80",
    fee: 350000,
    rating: 4.9,
    reviews_count: 210,
    bio: "Hơn 15 năm công tác tại Bệnh viện Tai Mũi Họng Trung ương. Chuyên nội soi tầm soát ung thư vòm họng và phẫu thuật nội soi xoang.",
    workplace: "Bệnh viện Tai Mũi Họng TW & MedSi Hà Nội",
  },
  {
    id: 5,
    name: "BS. CKII Đặng Quốc Bảo",
    title: "Bác sĩ Chuyên khoa II",
    specialty_id: 5,
    specialty_name: "Cơ Xương Khớp",
    experience_years: 20,
    city: "Hồ Chí Minh",
    district: "Quận 5",
    address: "Trung tâm Chấn Thương Chỉnh Hình MedSi — 215 Hồng Bàng, Quận 5, TP.HCM",
    lat: 10.7554,
    lng: 106.6596,
    avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80",
    fee: 400000,
    rating: 4.85,
    reviews_count: 165,
    bio: "Chuyên gia phẫu thuật khớp và phục hồi chức năng vận động. Từng tham gia các khóa đào tạo nâng cao tại Pháp và Singapore.",
    workplace: "Bệnh viện Chấn Thương Chỉnh Hình & MedSi",
  },
  {
    id: 6,
    name: "BS. CKI Vũ Thu Hương",
    title: "Bác sĩ Chuyên khoa I",
    specialty_id: 6,
    specialty_name: "Sản Phụ Khoa",
    experience_years: 14,
    city: "Đà Nẵng",
    district: "Hải Châu",
    address: "Phòng khám MedSi Đà Nẵng — 108 Hải Phòng, Thạch Thang, Hải Châu, Đà Nẵng",
    lat: 16.0718,
    lng: 108.2198,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
    fee: 380000,
    rating: 4.95,
    reviews_count: 312,
    bio: "Nguyên bác sĩ khoa Sản Bệnh viện Phụ Sản - Nhi Đà Nẵng. Đồng hành cùng hàng ngàn thai phụ trong hành trình vượt cạn an toàn.",
    workplace: "MedSi Đà Nẵng & BV Phụ Sản Nhi",
  },
  {
    id: 7,
    name: "BS. CKI Phan Thị Minh Tâm",
    title: "Bác sĩ Chuyên khoa I",
    specialty_id: 2,
    specialty_name: "Nhi Khoa",
    experience_years: 10,
    city: "Hồ Chí Minh",
    district: "Quận 10",
    address: "Phòng khám Nhi MedSi Vạn Hạnh — 341 Sư Vạn Hạnh, P. 10, Quận 10, TP.HCM",
    lat: 10.7712,
    lng: 106.6672,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
    fee: 320000,
    rating: 4.88,
    reviews_count: 142,
    bio: "Chuyên gia dinh dưỡng và tiêm chủng nhi khoa, tận tình và chu đáo với các bé nhỏ.",
    workplace: "Bệnh viện Nhi Đồng 1 & MedSi Vạn Hạnh",
  },
  {
    id: 8,
    name: "ThS.BS Đỗ Minh Khang",
    title: "Thạc sĩ, Bác sĩ Chuyên khoa",
    specialty_id: 7,
    specialty_name: "Tiêu Hóa - Gan Mật",
    experience_years: 16,
    city: "Hồ Chí Minh",
    district: "Bình Thạnh",
    address: "Phòng khám Đa Khoa MedSi Bình Thạnh — 152 Điện Biên Phủ, P. 25, Bình Thạnh, TP.HCM",
    lat: 10.8035,
    lng: 106.6958,
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
    fee: 380000,
    rating: 4.92,
    reviews_count: 178,
    bio: "Chuyên sâu nội soi can thiệp, tầm soát sớm polyp và ung thư đường tiêu hóa bằng công nghệ NBI hiện đại.",
    workplace: "Bệnh viện Nhân Dân Gia Định & MedSi Clinic",
  },
]

// 3. Initial Hospitals / Clinics
export const initialHospitals = [
  {
    id: 1,
    name: "Bệnh Viện Đại Học Y Dược TP.HCM",
    description: "Bệnh viện đa khoa tuyến trung ương hiện đại với đội ngũ giáo sư, tiến sĩ đầu ngành và trang thiết bị chẩn đoán tân tiến.",
    address: "215 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh",
    city: "Hồ Chí Minh",
    district: "Quận 5",
    lat: 10.7554,
    lng: 106.6596,
    hotline: "1900-7178",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80",
    rating: 4.9,
    exam_types: [
      { id: 101, name: "Khám Tổng Quát Tiêu Chuẩn", price: 650000 },
      { id: 102, name: "Gói Tầm Soát Ung Thư Toàn Diện", price: 2800000 },
      { id: 103, name: "Khám Chuyên Khoa Tim Mạch Kèm Siêu Âm Tim", price: 850000 },
      { id: 104, name: "Nội Soi Dạ Dày Đại Tràng Gây Mê", price: 1950000 },
    ],
  },
  {
    id: 2,
    name: "Bệnh Viện Đa Khoa Chợ Rẫy",
    description: "Một trong những bệnh viện lớn nhất Việt Nam, tiếp nhận và điều trị các ca bệnh phức tạp ở tất cả chuyên khoa.",
    address: "201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP. Hồ Chí Minh",
    city: "Hồ Chí Minh",
    district: "Quận 5",
    lat: 10.7578,
    lng: 106.6595,
    hotline: "028-3855-4137",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80",
    rating: 4.8,
    exam_types: [
      { id: 201, name: "Khám Chuyên Gia Theo Yêu Cầu", price: 500000 },
      { id: 202, name: "Gói Khám Tim Mạch - Huyết Áp", price: 1200000 },
      { id: 203, name: "Chụp Cộng Hưởng Từ (MRI) Não", price: 2200000 },
    ],
  },
  {
    id: 3,
    name: "Hệ Thống Phòng Khám Quốc Tế MedSi Sài Gòn",
    description: "Không gian khám bệnh tiêu chuẩn khách sạn, đặt lịch không chờ đợi, dịch vụ chăm sóc tận tâm và bảo mật tuyệt đối.",
    address: "Số 68 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    city: "Hồ Chí Minh",
    district: "Quận 1",
    lat: 10.7745,
    lng: 106.7036,
    hotline: "1900-2805",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80",
    rating: 4.95,
    exam_types: [
      { id: 301, name: "Khám Sức Khỏe Định Kỳ VIP", price: 1500000 },
      { id: 302, name: "Khám Nhi & Tư Vấn Dinh Dưỡng", price: 450000 },
      { id: 303, name: "Gói Kiểm Tra Gan - Mật Toàn Diện", price: 1100000 },
      { id: 304, name: "Khám Da Liễu & Phân Tích Da Kỹ Thuật Số", price: 500000 },
    ],
  },
  {
    id: 4,
    name: "Bệnh Viện Nhi Đồng 1",
    description: "Cơ sở chuyên khoa nhi hàng đầu khu vực phía Nam, trang bị đầy đủ khoa cấp cứu, sơ sinh và phẫu thuật nhi khoa.",
    address: "341 Sư Vạn Hạnh, Phường 10, Quận 10, TP. Hồ Chí Minh",
    city: "Hồ Chí Minh",
    district: "Quận 10",
    lat: 10.7712,
    lng: 106.6672,
    hotline: "028-3927-1119",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80",
    rating: 4.85,
    exam_types: [
      { id: 401, name: "Khám Nhi Theo Hẹn Chất Lượng Cao", price: 300000 },
      { id: 402, name: "Tư Vấn Tiêm Chủng Trọn Gói", price: 200000 },
      { id: 403, name: "Khám & Đánh Giá Phát Triển Thể Chất", price: 400000 },
    ],
  },
]

// 4. Generate Slots for next 7 days
export const generateDefaultSlots = () => {
  const slots = []
  const timeFrames = [
    { start: "08:00", end: "09:00", period: "morning" },
    { start: "09:00", end: "10:00", period: "morning" },
    { start: "10:00", end: "11:00", period: "morning" },
    { start: "13:30", end: "14:30", period: "afternoon" },
    { start: "14:30", end: "15:30", period: "afternoon" },
    { start: "15:30", end: "16:30", period: "afternoon" },
  ]

  const today = new Date()
  let slotIdCounter = 1

  // Generate slots for doctors 1 to 8 for the next 7 days
  for (let d = 0; d < 7; d++) {
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + d)
    const dateStr = targetDate.toISOString().split("T")[0]

    for (let docId = 1; docId <= 8; docId++) {
      timeFrames.forEach((tf, index) => {
        // Pseudo-random capacity & booked count
        const capacity = 8
        let booked_count = 0
        if (d === 0 && index === 0) booked_count = 8 // Full slot demo
        else if (d === 0 && index === 1) booked_count = 5
        else if (d === 1 && index === 3) booked_count = 4

        slots.push({
          id: slotIdCounter++,
          owner_type: "doctor",
          owner_id: docId,
          work_date: dateStr,
          start_time: tf.start,
          end_time: tf.end,
          period: tf.period,
          capacity: capacity,
          booked_count: booked_count,
          status: booked_count >= capacity ? "full" : "available",
        })
      })
    }

    // Generate slots for hospitals 1 to 4
    for (let hospId = 1; hospId <= 4; hospId++) {
      timeFrames.forEach((tf) => {
        slots.push({
          id: slotIdCounter++,
          owner_type: "hospital",
          owner_id: hospId,
          work_date: dateStr,
          start_time: tf.start,
          end_time: tf.end,
          period: tf.period,
          capacity: 15,
          booked_count: Math.floor(Math.random() * 5),
          status: "available",
        })
      })
    }
  }

  return slots
}

// 5. Initial Patient Profiles
export const initialPatientProfiles = [
  {
    id: 1,
    user_id: 1,
    full_name: "Nguyễn Văn A",
    dob: "1992-06-15",
    gender: "male",
    phone: "0901234567",
    relationship: "Bản thân",
    identity_card: "079092001234",
    address: "123 Cách Mạng Tháng 8, P. 10, Quận 3, TP.HCM",
  },
  {
    id: 2,
    user_id: 1,
    full_name: "Nguyễn Gia Bảo",
    dob: "2018-09-20",
    gender: "male",
    phone: "0901234567",
    relationship: "Con trai",
    identity_card: "",
    address: "123 Cách Mạng Tháng 8, P. 10, Quận 3, TP.HCM",
  },
  {
    id: 3,
    user_id: 1,
    full_name: "Trần Thị Hạnh",
    dob: "1960-03-12",
    gender: "female",
    phone: "0912345678",
    relationship: "Mẹ ruột",
    identity_card: "079160009876",
    address: "45 Lê Lợi, P. Bến Thành, Quận 1, TP.HCM",
  },
]

// 6. Initial Bookings
export const initialBookings = [
  {
    id: 1,
    code: "MEDSI-91048",
    user_id: 1,
    patient_profile_id: 1,
    patient_name: "Nguyễn Văn A",
    patient_phone: "0901234567",
    patient_gender: "male",
    patient_dob: "1992-06-15",
    relationship: "Bản thân",
    booking_type: "doctor",
    doctor_id: 1,
    doctor_name: "BS. CKII Nguyễn Văn Hùng",
    specialty_name: "Tim Mạch",
    hospital_name: "Phòng khám MedSi Quận 1",
    work_date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "10:00",
    slot_id: 2,
    symptoms: "Thường xuyên tức ngực trái khi vận động nhẹ, huyết áp dao động thất thường 140/90 mmHg.",
    note: "Có mang theo kết quả siêu âm tim 3 tháng trước.",
    status: "confirmed", // pending | confirmed | completed | cancelled
    created_at: new Date(Date.now() - 86400000).toISOString(),
    payment: {
      method: "cash",
      exam_fee: 400000,
      service_fee: 20000,
      total_amount: 420000,
      status: "pending",
      transaction_code: "TXN-88412",
    },
  },
  {
    id: 2,
    code: "MEDSI-82315",
    user_id: 1,
    patient_profile_id: 2,
    patient_name: "Nguyễn Gia Bảo",
    patient_phone: "0901234567",
    patient_gender: "male",
    patient_dob: "2018-09-20",
    relationship: "Con trai",
    booking_type: "doctor",
    doctor_id: 2,
    doctor_name: "PGS.TS.BS Trần Thị Mai Lan",
    specialty_name: "Nhi Khoa",
    hospital_name: "Phòng khám Nhi MedSi Quận 5",
    work_date: new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0],
    start_time: "14:30",
    end_time: "15:30",
    slot_id: 10,
    symptoms: "Bé ho đêm kéo dài 1 tuần, có đờm nhẹ, biếng ăn và sụt cân.",
    note: "Cần tư vấn phác đồ dinh dưỡng kèm theo.",
    status: "pending",
    created_at: new Date().toISOString(),
    payment: {
      method: "vnpay",
      exam_fee: 450000,
      service_fee: 20000,
      total_amount: 470000,
      status: "paid",
      transaction_code: "VNPAY-99210",
      paid_at: new Date().toISOString(),
    },
  },
  {
    id: 3,
    code: "MEDSI-71204",
    user_id: 1,
    patient_profile_id: 3,
    patient_name: "Trần Thị Hạnh",
    patient_phone: "0912345678",
    patient_gender: "female",
    patient_dob: "1960-03-12",
    relationship: "Mẹ ruột",
    booking_type: "hospital",
    hospital_id: 1,
    hospital_name: "Bệnh Viện Đại Học Y Dược TP.HCM",
    exam_type_id: 101,
    exam_type_name: "Khám Tổng Quát Tiêu Chuẩn",
    work_date: new Date(Date.now() - 86400000 * 10).toISOString().split("T")[0],
    start_time: "08:00",
    end_time: "09:00",
    slot_id: 40,
    symptoms: "Khám tổng quát định kỳ hàng năm theo chỉ định của bác sĩ gia đình.",
    note: "Cần nhịn ăn sáng để xét nghiệm máu.",
    status: "completed",
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    payment: {
      method: "momo",
      exam_fee: 650000,
      service_fee: 20000,
      total_amount: 670000,
      status: "paid",
      transaction_code: "MOMO-33109",
      paid_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    },
  },
]

// ==========================================
// STORE HELPERS WITH LOCALSTORAGE PERSISTENCE
// ==========================================

export function getStoredSpecialties() {
  const raw = localStorage.getItem(STORAGE_KEYS.SPECIALTIES)
  if (raw) {
    try { return JSON.parse(raw) } catch { /* fallback */ }
  }
  localStorage.setItem(STORAGE_KEYS.SPECIALTIES, JSON.stringify(initialSpecialties))
  return initialSpecialties
}

export function saveSpecialties(data) {
  localStorage.setItem(STORAGE_KEYS.SPECIALTIES, JSON.stringify(data))
}

export function getStoredDoctors() {
  const raw = localStorage.getItem(STORAGE_KEYS.DOCTORS)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      let updated = false
      const merged = initialDoctors.map((initDoc) => {
        const found = parsed.find((d) => d.id === initDoc.id)
        if (!found) {
          updated = true
          return initDoc
        }
        if (found.lat == null || found.lng == null) {
          updated = true
          return { ...found, lat: initDoc.lat, lng: initDoc.lng, district: initDoc.district }
        }
        return found
      })
      if (updated || parsed.length < initialDoctors.length) {
        localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(merged))
        return merged
      }
      return parsed
    } catch { /* fallback */ }
  }
  localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(initialDoctors))
  return initialDoctors
}

export function saveDoctors(data) {
  localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(data))
}

export function getStoredHospitals() {
  const raw = localStorage.getItem(STORAGE_KEYS.HOSPITALS)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      let updated = false
      const merged = initialHospitals.map((initHosp) => {
        const found = parsed.find((h) => h.id === initHosp.id)
        if (!found) {
          updated = true
          return initHosp
        }
        if (found.lat == null || found.lng == null) {
          updated = true
          return { ...found, lat: initHosp.lat, lng: initHosp.lng, district: initHosp.district }
        }
        return found
      })
      if (updated || parsed.length < initialHospitals.length) {
        localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(merged))
        return merged
      }
      return parsed
    } catch { /* fallback */ }
  }
  localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(initialHospitals))
  return initialHospitals
}

export function getStoredSlots() {
  const raw = localStorage.getItem(STORAGE_KEYS.SLOTS)
  if (raw) {
    try { return JSON.parse(raw) } catch { /* fallback */ }
  }
  const defaultSlots = generateDefaultSlots()
  localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(defaultSlots))
  return defaultSlots
}

export function saveSlots(data) {
  localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(data))
}

export function getStoredBookings() {
  const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS)
  if (raw) {
    try { return JSON.parse(raw) } catch { /* fallback */ }
  }
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(initialBookings))
  return initialBookings
}

export function saveBookings(data) {
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(data))
}

export function getStoredPatientProfiles() {
  const raw = localStorage.getItem(STORAGE_KEYS.PATIENT_PROFILES)
  if (raw) {
    try { return JSON.parse(raw) } catch { /* fallback */ }
  }
  localStorage.setItem(STORAGE_KEYS.PATIENT_PROFILES, JSON.stringify(initialPatientProfiles))
  return initialPatientProfiles
}

export function savePatientProfiles(data) {
  localStorage.setItem(STORAGE_KEYS.PATIENT_PROFILES, JSON.stringify(data))
}

// Generate unique booking code e.g. MEDSI-48192
export function generateBookingCode() {
  const randomNum = Math.floor(10000 + Math.random() * 90000)
  return `MEDSI-${randomNum}`
}

// Helper: Format VND currency
export function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0)
}

// Helper: Format Date VN
export function formatDateVN(dateStr) {
  if (!dateStr) return ""
  try {
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    const d = new Date(dateStr)
    return d.toLocaleDateString("vi-VN")
  } catch {
    return dateStr
  }
}
