import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import PageLayout from "@/components/layout/PageLayout"

// Core screens according to project specifications
import DoctorAppointments from "@/pages/DoctorAppointments"
import ProviderDirectory from "@/pages/ProviderDirectory"
import AppointmentPreview from "@/pages/AppointmentPreview"
import HomePage from "@/pages/HomePage"
import SearchResultsPage from "@/pages/SearchResultsPage"
import DoctorDetailPage from "@/pages/DoctorDetailPage"
import BookingConfirmPage from "@/pages/BookingConfirmPage"
import PaymentPage from "@/pages/PaymentPage"
import LoginPage from "@/pages/LoginPage"
import RegisterPage from "@/pages/RegisterPage"
import MyBookingsPage from "@/pages/MyBookingsPage"
import BookingHistoryPage from "@/pages/BookingHistoryPage"
import HospitalBookingPage from "@/pages/HospitalBookingPage"
import TicketPage from "@/pages/TicketPage"
import CheckInPage from "@/pages/CheckInPage"
import AdminBookingsPage from "@/pages/Admin/AdminBookingsPage"
import AdminCatalogPage from "@/pages/Admin/AdminCatalogPage"
import NotFoundPage from "@/pages/NotFoundPage"

function MyBookingsRoute() {
  const [params] = useSearchParams()
  return ['profiles', 'account'].includes(params.get('tab')) ? <MyBookingsPage /> : <BookingHistoryPage />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* All main screens use PageLayout (Navbar + Outlet + Footer) */}
          <Route element={<PageLayout />}>
            {/* 1. Trang chủ */}
            <Route path="/" element={<HomePage />} />
            <Route path="/dat-kham/bac-si" element={<ProviderDirectory/>}/>
            <Route path="/dat-kham/benh-vien" element={<ProviderDirectory hospital/>}/>
            <Route path="/dat-lich/bac-si" element={<AppointmentPreview key="doctor"/>}/>
            <Route path="/dat-lich/benh-vien" element={<HospitalBookingPage/>}/>

            {/* 2. Danh sách bác sĩ, bệnh viện */}
            <Route path="/doctors" element={<SearchResultsPage />} />

            {/* 3. Chi tiết bác sĩ, bệnh viện + chọn slot */}
            <Route path="/doctors/:id" element={<DoctorDetailPage />} />

            {/* 3.1. Xác nhận đặt lịch */}
            <Route path="/booking/confirm" element={<BookingConfirmPage />} />

            {/* 3.2. Thanh toán đặt khám */}
            <Route path="/bookings/:bookingId/refunds" element={<PaymentPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payments" element={<Navigate to="/payment" replace />} />

            {/* 4. Đăng nhập / Đăng ký */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* 5. Lịch sử đặt lịch của tôi */}
            <Route path="/my-bookings" element={<MyBookingsRoute />} />
            <Route path="/hospital-booking" element={<HospitalBookingPage />} />
            <Route path="/hospitals/:hospitalId/book" element={<HospitalBookingPage />} />
            <Route path="/bookings/:bookingId/ticket" element={<TicketPage />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route path="/check-in" element={<CheckInPage />} />

            {/* 6. Trang quản trị Admin */}
            <Route path="/admin" element={<Navigate to="/admin/bookings" replace />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            <Route path="/admin/catalog" element={<AdminCatalogPage />} />

            {/* Fallback 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
