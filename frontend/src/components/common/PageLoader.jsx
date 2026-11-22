import Spinner from './Spinner';

export default function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner label="Загружаем раздел…" />
    </div>
  );
}
