import { useState } from 'react'

export default function DoctorAvatar({ src, name }) {
  const [failed, setFailed] = useState('')
  const style = 'w-9 h-9 shrink-0 rounded-xl object-cover'
  if (!src || failed === src) return <span aria-hidden="true" className={style + ' grid place-items-center bg-sage-100 text-sage-800 font-semibold'}>{name.trim().split(/\s+/).slice(-2).map(part=>part[0]).join('')}</span>
  return <img src={src} alt="" className={style} onError={()=>setFailed(src)}/>
}
