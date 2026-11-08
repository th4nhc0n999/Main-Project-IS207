import { useEffect, useState } from 'react'
import client from './axiosClient'

export default function useApi(path, revision = 0) {
  const [result, setResult] = useState(null)
  useEffect(() => {
    if (!path) return
    let active = true
    client.get(path).then(data => { if (active) setResult({ path, revision, data }) })
      .catch(error => { if (active) setResult({ path, revision, error: error.message }) })
    return () => { active = false }
  }, [path, revision])
  return result?.path === path && result.revision === revision ? result : {}
}
export const money = value => Number(value).toLocaleString('vi-VN') + ' ₫'
