export default function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-lilac">
      <span className="h-4 w-4 animate-spin rounded-full border border-gold border-t-transparent" />
      <span className="text-sm tracking-widest uppercase">{label}</span>
    </div>
  );
}
