export default function BookingSteps({ current }) {
  return <ol className="booking-steps" aria-label="Tiến trình đặt lịch">
    {['Chọn ca khám', 'Hồ sơ người khám', 'Thanh toán'].map((label, index) =>
      <li key={label} aria-current={index + 1 === current ? 'step' : undefined} data-complete={index + 1 < current}>
        <span>{index + 1 < current ? '✓' : index + 1}</span>{label}
      </li>
    )}
  </ol>
}
