import { useState, useRef } from 'react'
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react'

export default function AttachmentUploader({ files = [], onChange, maxFiles = 5, maxSizeMb = 15 }) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const dragCounter = useRef(0)

  function handleFiles(incomingFiles) {
    setError('')
    if (!incomingFiles || incomingFiles.length === 0) return

    const valid = []
    const limit = maxFiles - files.length

    if (limit <= 0) {
      setError(`Bạn chỉ có thể tải lên tối đa ${maxFiles} tập tin.`)
      return
    }

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i]
      if (valid.length >= limit) {
        setError(`Chỉ nhận thêm tối đa ${limit} tập tin (tổng cộng tối đa ${maxFiles} tập tin).`)
        break
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        setError(`Tập tin "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)}MB) vượt quá dung lượng tối đa ${maxSizeMb}MB.`)
        continue
      }
      const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name)
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
      if (!isImg && !isPdf) {
        setError(`Tập tin "${file.name}" không hợp lệ. Chỉ hỗ trợ ảnh (.PNG, .JPG) hoặc .PDF.`)
        continue
      }

      const previewUrl = isImg ? URL.createObjectURL(file) : null
      valid.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        previewUrl,
      })
    }

    if (valid.length > 0) {
      onChange([...files, ...valid])
    }
  }

  function handleDragEnter(e) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setDragActive(false)
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    dragCounter.current = 0
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  function removeFile(id) {
    const target = files.find(f => f.id === id)
    if (target?.previewUrl) {
      try {
        URL.revokeObjectURL(target.previewUrl)
      } catch (_) {}
    }
    onChange(files.filter(f => f.id !== id))
    setError('')
  }

  return (
    <div className="med-attachment-uploader">
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs font-semibold text-slate-700">
          Tập tin đính kèm ({files.length}/{maxFiles})
        </label>
        {files.length > 0 && (
          <span className="text-xs text-emerald-700 font-medium inline-flex items-center gap-1">
            <CheckCircle2 size={13} /> Đã chọn {files.length} tập tin
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,application/pdf"
        className="hidden"
        style={{ display: 'none' }}
        onChange={e => {
          if (e.target.files) handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {files.length < maxFiles && (
        <div
          className={`attachment-dropzone ${dragActive ? 'dragover' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
        >
          <Upload size={24} className="mx-auto text-sage-700 mb-1 pointer-events-none" />
          <div className="dropzone-label pointer-events-none">
            {dragActive ? 'Thả tập tin vào đây...' : 'Chọn tập tin hoặc kéo thả vào đây'}
          </div>
          <div className="dropzone-sub pointer-events-none">.PNG, .JPG, .PDF tối đa {maxSizeMb}MB</div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-rose-600 font-medium bg-rose-50 border border-rose-200 p-2 rounded">
          {error}
        </p>
      )}

      {/* Selected Files Preview List */}
      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {files.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-white shadow-xs"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="w-10 h-10 rounded object-cover border border-slate-100 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                    <FileText size={20} />
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-800 truncate" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-[11px] text-slate-400">{item.size}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  removeFile(item.id)
                }}
                className="file-item-remove-btn"
                title="Xóa tập tin"
                aria-label="Xóa tập tin"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
