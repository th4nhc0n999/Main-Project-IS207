import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"
import Footer from "./Footer"

export default function PageLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-sage-500 selection:text-white">
      <Navbar />
      <main className="med-content flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
