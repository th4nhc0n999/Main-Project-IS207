import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    // Luôn cuộn lên đầu trang khi chuyển trang hoặc đổi tham số màn hình
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [pathname, search])

  return null
}

