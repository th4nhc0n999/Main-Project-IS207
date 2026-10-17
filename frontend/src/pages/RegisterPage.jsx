import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  ShieldCheck, 
  Stethoscope, 
  CheckCircle2, 
  ArrowRight,
  AlertCircle
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirmation: "",
    agreeTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    if (errorMsg) setErrorMsg("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.passwordConfirmation) {
      setErrorMsg("Mật khẩu xác nhận không khớp!")
      return
    }
    if (!formData.agreeTerms) {
      setErrorMsg("Vui lòng đồng ý với Điều khoản dịch vụ y tế.")
      return
    }

    setIsSubmitting(true)
    setErrorMsg("")

    const res = await register(formData)
    setIsSubmitting(false)

    if (res.success) {
      setFormSubmitted(true)
      setTimeout(() => navigate("/"), 800)
    } else {
      // Hiển thị lỗi từ server (email trùng, v.v.)
      if (res.errors) {
        const firstError = Object.values(res.errors)[0]
        setErrorMsg(Array.isArray(firstError) ? firstError[0] : firstError)
      } else {
        setErrorMsg(res.message || "Đăng ký thất bại. Vui lòng thử lại.")
      }
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-sky-50/60 via-slate-50 to-white">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white shadow-lg shadow-sky-500/25 mb-1">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tạo tài khoản Med<span className="text-sky-600">Si</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Đăng ký tài khoản bệnh nhân để dễ dàng đặt khám và theo dõi lịch sử điều trị
          </p>
        </div>

        {/* Register Card */}
        <Card className="shadow-medical border-slate-200/90 bg-white">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-slate-800">
              Thông tin đăng ký
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Vui lòng điền đầy đủ và chính xác thông tin để thuận tiện khi đến cơ sở y tế khám bệnh
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {formSubmitted && (
              <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Tài khoản đã được tạo thành công!</p>
                  <p className="text-emerald-700 mt-0.5">Đang chuyển hướng về trang chủ...</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Họ và tên */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                  Họ và tên bệnh nhân <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="vd: Nguyễn Văn A (như trên CCCD/BHYT)"
                    className="pl-10 h-11 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-sky-500"
                  />
                </div>
              </div>

              {/* Grid: Số điện thoại + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0912345678"
                      className="pl-10 h-11 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                    Địa chỉ Email <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className="pl-10 h-11 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Grid: Mật khẩu + Xác nhận mật khẩu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Tối thiểu 6 ký tự"
                      className="pl-10 pr-9 h-11 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirmation" className="text-xs font-semibold text-slate-700">
                    Xác nhận mật khẩu <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <Input
                      id="passwordConfirmation"
                      name="passwordConfirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={formData.passwordConfirmation}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu"
                      className="pl-10 pr-9 h-11 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Checkbox Agree terms */}
              <div className="flex items-start pt-1">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="ml-2.5 block text-xs text-slate-600 leading-snug cursor-pointer select-none">
                  Tôi đồng ý với{" "}
                  <span className="text-sky-600 hover:underline font-medium">Điều khoản sử dụng</span> và{" "}
                  <span className="text-sky-600 hover:underline font-medium">Chính sách bảo mật y tế</span> của MedSi.
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-md shadow-sky-600/20 text-sm mt-2 transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang tạo tài khoản...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Đăng ký tài khoản
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-0 border-t border-slate-100 mt-2">
            <div className="text-center text-xs text-slate-600 pt-3">
              Bạn đã có tài khoản MedSi?{" "}
              <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700 hover:underline inline-flex items-center gap-0.5">
                Đăng nhập ngay
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Medical Guarantee badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Thông tin đăng ký được cam kết bảo mật theo tiêu chuẩn y khoa</span>
        </div>
      </div>
    </div>
  )
}
