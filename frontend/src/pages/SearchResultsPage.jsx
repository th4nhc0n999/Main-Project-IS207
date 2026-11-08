import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Stethoscope,
  Hospital,
  Building2,
  MapPin,
  Award,
  ArrowRight,
  RotateCcw,
  Navigation,
  CheckCircle,
} from 'lucide-react'
import useApi from '@/api/useApi'
import './search-results.css'

function getInitials(name = '') {
  const cleanName = name.replace(/^(BS|BS\.CKI|BS\.CKII|ThS\.BS|TS\.BS|GS\.TS|PGS\.TS)\s*/i, '').trim()
  const parts = cleanName.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return (cleanName.slice(0, 2) || 'BS').toUpperCase()
}

function DoctorAvatar({ id, name }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <div className="doctor-avatar-fallback">{getInitials(name)}</div>
  }
  return (
    <img
      src={`/media/directory/doctor-${id}.jpg`}
      alt={name}
      className="doctor-avatar-circle"
      onError={() => setFailed(true)}
    />
  )
}

function HospitalCover({ id, name }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="card-top-cover flex items-center justify-center bg-emerald-900/10 text-emerald-800">
        <Hospital size={36} />
      </div>
    )
  }
  return (
    <img
      src={`/media/directory/hospital-${id}.jpg`}
      alt={name}
      className="card-top-cover"
      onError={() => setFailed(true)}
    />
  )
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const currentType = searchParams.get('type') || ''
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || '')
  const [radius, setRadius] = useState('5')
  const [coords, setCoords] = useState(null)
  const [notice, setNotice] = useState('')
  const [locating, setLocating] = useState(false)

  // Construct query parameters for /directory API
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (specialty) params.set('specialty', specialty)
  if (city) params.set('city', city)
  if (coords) {
    params.set('lat', coords.latitude)
    params.set('lng', coords.longitude)
    params.set('radius', radius)
  }

  const { data, error } = useApi('/directory?' + params.toString())
  const allData = data?.data || []

  // Counts for each category tab
  const totalAll = allData.length
  const totalDoctors = allData.filter((r) => r.kind === 'doctor').length
  const totalHospitals = allData.filter(
    (r) => r.kind === 'hospital' && !/phòng khám|clinic/i.test(r.name)
  ).length
  const totalClinics = allData.filter(
    (r) => r.kind === 'hospital' && /phòng khám|clinic/i.test(r.name)
  ).length

  // Filter rows based on active category
  const rows = allData.filter((row) => {
    if (currentType === 'doctor') return row.kind === 'doctor'
    const isClinic = /phòng khám|clinic/i.test(row.name)
    if (currentType === 'clinic') return row.kind === 'hospital' && isClinic
    if (currentType === 'hospital') return row.kind === 'hospital' && !isClinic
    return true
  })

  // Handle switching category tab
  function handleTypeChange(newType) {
    const next = new URLSearchParams(searchParams)
    if (newType) {
      next.set('type', newType)
    } else {
      next.delete('type')
    }
    setSearchParams(next, { replace: true, preventScrollReset: true })
  }

  // Clear all filters
  function handleClearFilters() {
    setQuery('')
    setCity('')
    setSpecialty('')
    setCoords(null)
    setNotice('')
    setSearchParams({}, { replace: true })
  }

  // Geolocation
  function handleNearby() {
    const fallback = () => {
      setCoords(null)
      setLocating(false)
      setNotice('Không lấy được vị trí. Hãy chọn tỉnh/thành để tìm nơi khám gần bạn.')
    }
    if (!navigator.geolocation) return fallback()
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCity('')
        setCoords(position.coords)
        setLocating(false)
        setNotice('')
      },
      fallback,
      { timeout: 10000 }
    )
  }

  const hasFiltersActive = Boolean(
    query.trim() || specialty || city || coords || currentType
  )

  const searchPlaceholder =
    currentType === 'doctor'
      ? 'Nhập tên bác sĩ cần tìm…'
      : currentType === 'hospital'
      ? 'Nhập tên bệnh viện cần tìm…'
      : currentType === 'clinic'
      ? 'Nhập tên phòng khám…'
      : 'Tên bác sĩ, bệnh viện hoặc phòng khám…'

  return (
    <section className="search-results-container">
      {/* Page Header */}
      <div className="search-header-row">
        <h1 className="search-header-title">Tìm nơi khám</h1>
        <p className="search-header-desc">
          Tra cứu bác sĩ chuyên khoa và cơ sở y tế uy tín trên toàn hệ thống MedSi.
        </p>
      </div>

      {/* Category Tabs: Tất cả / Bác sĩ / Bệnh viện / Phòng khám */}
      <div className="search-type-pills" role="tablist" aria-label="Lọc theo đối tượng khám">
        <button
          type="button"
          role="tab"
          aria-selected={!currentType}
          className={`type-pill-btn ${!currentType ? 'active' : ''}`}
          onClick={() => handleTypeChange('')}
        >
          <span>Tất cả</span>
          <span className="type-pill-count">{totalAll}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentType === 'doctor'}
          className={`type-pill-btn ${currentType === 'doctor' ? 'active' : ''}`}
          onClick={() => handleTypeChange('doctor')}
        >
          <Stethoscope size={16} />
          <span>Bác sĩ</span>
          <span className="type-pill-count">{totalDoctors}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentType === 'hospital'}
          className={`type-pill-btn ${currentType === 'hospital' ? 'active' : ''}`}
          onClick={() => handleTypeChange('hospital')}
        >
          <Hospital size={16} />
          <span>Bệnh viện</span>
          <span className="type-pill-count">{totalHospitals}</span>
        </button>

        {totalClinics > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={currentType === 'clinic'}
            className={`type-pill-btn ${currentType === 'clinic' ? 'active' : ''}`}
            onClick={() => handleTypeChange('clinic')}
          >
            <Building2 size={16} />
            <span>Phòng khám</span>
            <span className="type-pill-count">{totalClinics}</span>
          </button>
        )}
      </div>

      {/* Filter Card */}
      <div className="search-filter-box">
        <div className="filter-grid-fields">
          {/* Tên tìm kiếm */}
          <div className="filter-field-group">
            <label htmlFor="search-input-field">
              {currentType === 'doctor'
                ? 'Tên bác sĩ'
                : currentType === 'hospital'
                ? 'Tên bệnh viện'
                : 'Tên bác sĩ hoặc bệnh viện'}
            </label>
            <input
              id="search-input-field"
              value={query}
              maxLength={150}
              placeholder={searchPlaceholder}
              autoComplete="off"
              spellCheck="false"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Chuyên khoa */}
          <div className="filter-field-group">
            <label htmlFor="specialty-select-field">Chuyên khoa</label>
            <select
              id="specialty-select-field"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              <option value="">Tất cả chuyên khoa</option>
              {(data?.specialties || []).map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tỉnh / thành */}
          <div className="filter-field-group">
            <label htmlFor="city-select-field">Tỉnh / thành</label>
            <select
              id="city-select-field"
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setCoords(null)
              }}
            >
              <option value="">Tất cả tỉnh/thành</option>
              {(data?.cities || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Actions: Gần tôi & Xóa bộ lọc */}
          <div className="filter-actions-row">
            <button
              type="button"
              className="btn-nearby"
              disabled={locating}
              onClick={handleNearby}
              title="Tìm cơ sở y tế gần toạ độ hiện tại của bạn"
            >
              <Navigation size={15} />
              {locating ? 'Đang định vị…' : 'Gần tôi'}
            </button>

            {hasFiltersActive && (
              <button
                type="button"
                className="btn-reset-filter"
                onClick={handleClearFilters}
                title="Đặt lại toàn bộ tiêu chí tìm kiếm"
              >
                <RotateCcw size={14} /> Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* Location radius selector if coords active */}
        {coords && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3">
            <label htmlFor="radius-select" className="text-sm font-semibold text-slate-700">
              Bán kính quét:
            </label>
            <select
              id="radius-select"
              value={radius}
              className="h-9 px-3 border border-slate-300 rounded-md text-sm"
              onChange={(e) => setRadius(e.target.value)}
            >
              {[2, 5, 10, 20].map((r) => (
                <option key={r} value={r}>
                  {r} km
                </option>
              ))}
            </select>
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle size={14} /> Đã bật định vị GPS
            </span>
          </div>
        )}
      </div>

      {notice && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4" role="status">
          {notice}
        </p>
      )}

      {/* Map Embed if coordinates exist */}
      {coords && (
        <iframe
          title="Bản đồ OpenStreetMap quanh vị trí của bạn"
          className="w-full h-72 border border-slate-300 rounded-xl mb-6 shadow-sm"
          src={
            'https://www.openstreetmap.org/export/embed.html?' +
            new URLSearchParams({
              bbox: [
                coords.longitude - radius / (111 * Math.max(0.01, Math.cos((coords.latitude * Math.PI) / 180))),
                coords.latitude - radius / 111,
                coords.longitude + radius / (111 * Math.max(0.01, Math.cos((coords.latitude * Math.PI) / 180))),
                coords.latitude + radius / 111,
              ].join(','),
              marker: [coords.latitude, coords.longitude].join(','),
              layer: 'mapnik',
            })
          }
        />
      )}

      {/* Status or Error */}
      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl mb-6" role="alert">
          {error}
        </div>
      ) : !data ? (
        <div className="p-8 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-emerald-700 mb-2"></div>
          <p>Đang tải danh sách nơi khám…</p>
        </div>
      ) : (
        <>
          {/* Result Count Status */}
          <div className="results-status-bar">
            <span>
              Tìm thấy <strong>{rows.length}</strong>{' '}
              {currentType === 'doctor'
                ? 'bác sĩ'
                : currentType === 'hospital'
                ? 'bệnh viện'
                : currentType === 'clinic'
                ? 'phòng khám'
                : 'kết quả'}
            </span>
          </div>

          {/* Cards Grid */}
          {rows.length === 0 ? (
            <div className="search-empty-state">
              <Stethoscope size={44} className="mx-auto text-slate-400 mb-2" />
              <p>Chưa tìm thấy bác sĩ hoặc cơ sở y tế nào phù hợp với bộ lọc hiện tại.</p>
              <button
                type="button"
                className="btn-nearby mx-auto"
                onClick={handleClearFilters}
              >
                Xóa bộ lọc để xem tất cả
              </button>
            </div>
          ) : (
            <div className="results-cards-grid">
              {rows.map((r) => {
                const isDoc = r.kind === 'doctor'
                const targetLink = isDoc
                  ? `/doctors/${r.id}`
                  : `/hospitals/${r.id}/book`

                return (
                  <article key={r.kind + r.id} className="provider-card-item">
                    {/* Facility Cover if hospital */}
                    {!isDoc && <HospitalCover id={r.id} name={r.name} />}

                    <div className="card-body-content">
                      {isDoc ? (
                        <>
                          <div className="card-doctor-header">
                            <DoctorAvatar id={r.id} name={r.name} />
                            <div>
                              <span className="card-specialty-tag">
                                {r.specialty || 'Chuyên khoa'}
                              </span>
                              <h2 className="card-provider-name">
                                <Link to={targetLink}>
                                  {[r.title, r.name].filter(Boolean).join(' ')}
                                </Link>
                              </h2>
                            </div>
                          </div>

                          <div className="card-info-list">
                            {r.hospital && (
                              <div className="card-info-item">
                                <Building2 size={15} />
                                <span>{r.hospital}</span>
                              </div>
                            )}

                            <div className="card-info-item">
                              <MapPin size={15} />
                              <span>
                                {[r.address, r.city].filter(Boolean).join(' · ')}
                              </span>
                            </div>

                            {r.years_experience != null && (
                              <div className="card-info-item">
                                <Award size={15} />
                                <span>{r.years_experience} năm kinh nghiệm</span>
                              </div>
                            )}

                            {r.km != null && (
                              <div className="card-info-item text-emerald-700 font-medium">
                                <Navigation size={14} />
                                <span>Cách bạn {r.km.toFixed(1)} km</span>
                              </div>
                            )}
                          </div>

                          <div className="card-footer-action">
                            <div className="card-fee-badge">
                              <span>Phí khám:</span>
                              <strong>
                                {r.consultation_fee
                                  ? Number(r.consultation_fee).toLocaleString('vi-VN') + ' ₫'
                                  : 'Theo ca khám'}
                              </strong>
                            </div>

                            <Link className="card-cta-btn" to={targetLink}>
                              Chọn ca khám <ArrowRight size={15} />
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="card-specialty-tag">
                              {/phòng khám|clinic/i.test(r.name) ? 'Phòng khám' : 'Bệnh viện'}
                            </span>
                            <h2 className="card-provider-name">
                              <Link to={targetLink}>{r.name}</Link>
                            </h2>
                          </div>

                          <div className="card-info-list">
                            <div className="card-info-item">
                              <MapPin size={15} />
                              <span>
                                {[r.address, r.city].filter(Boolean).join(' · ')}
                              </span>
                            </div>

                            {r.km != null && (
                              <div className="card-info-item text-emerald-700 font-medium">
                                <Navigation size={14} />
                                <span>Cách bạn {r.km.toFixed(1)} km</span>
                              </div>
                            )}
                          </div>

                          <div className="card-footer-action">
                            <div className="card-fee-badge">
                              <span>Dịch vụ:</span>
                              <strong>Đặt lịch theo chuyên khoa</strong>
                            </div>

                            <Link className="card-cta-btn" to={targetLink}>
                              Đặt khám cơ sở <ArrowRight size={15} />
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}
    </section>
  )
}
