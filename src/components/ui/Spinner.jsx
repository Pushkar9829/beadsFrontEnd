export default function Spinner({ label = 'Loading' }) {
  return (
    <div className="nx-spin" role="status">
      <span aria-hidden />
      {label}
    </div>
  );
}
