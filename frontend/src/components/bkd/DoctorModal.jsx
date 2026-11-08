import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

export default function DoctorModal({ title, busy = false, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const node = ref.current
    const previousFocus = document.activeElement
    node.showModal()
    return () => { node.close(); previousFocus?.focus() }
  }, [])
  return <dialog ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) onClose() }}
    className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-[14px] border border-[var(--med-line)] bg-white p-6 text-[var(--med-ink)] shadow-xl backdrop:bg-slate-900/40">
    <div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-[22px] font-semibold">{title}</h2><Button variant="outline" className="min-h-11" disabled={busy} onClick={onClose}>Đóng</Button></div>
    {children}
  </dialog>
}
