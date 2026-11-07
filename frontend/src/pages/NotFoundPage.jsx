import { Link } from "react-router-dom"
import { Home, Search, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-medical">
        <div className="w-20 h-20 rounded-3xl bg-sage-50 text-sage-600 flex items-center justify-center mx-auto shadow-inner">
          <Stethoscope className="w-10 h-10" />
        </div>

        <div>
          <span className="text-4xl sm:text-5xl font-black text-sage-600 tracking-tight block">404</span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            Không Tìm Thấy Trang Yêu Cầu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            Trang bạn đang truy cập có thể đã đổi tên, bị xóa hoặc đường dẫn không chính xác trên hệ thống MedSi.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-sage-600 hover:bg-sage-700 text-white font-semibold">
            <Link to="/" className="flex items-center gap-1.5">
              <Home className="w-4 h-4" />
              <span>Về Trang Chủ</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="border-slate-300">
            <Link to="/doctors" className="flex items-center gap-1.5">
              <Search className="w-4 h-4" />
              <span>Tìm Bác Sĩ</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
