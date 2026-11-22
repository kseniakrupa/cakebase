export default function Spinner({ label = 'Загрузка…', small = false }) {
  return (
    <span className={`spinner${small ? ' spinner--small' : ''}`} role="status">
      <span className="spinner__ring" aria-hidden="true" />
      <span className="spinner__label">{label}</span>
    </span>
  );
}
