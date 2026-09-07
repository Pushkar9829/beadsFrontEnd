export default function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-surface gold-border ${onClick ? 'cursor-pointer hover:border-gold/70 transition' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
