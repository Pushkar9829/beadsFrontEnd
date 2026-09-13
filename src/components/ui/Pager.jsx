export default function Pager({ page = 1, pages = 1, onPage, total, className = '' }) {
  if (pages <= 1) return null;
  return (
    <div className={`mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-lilac ${className}`}>
      <span>{total != null ? `${total} pieces` : `Page ${page} of ${pages}`}</span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-full border border-gold/30 px-3 py-1.5 uppercase tracking-widest text-gold disabled:opacity-30"
        >
          Prev
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-full border border-gold/30 px-3 py-1.5 uppercase tracking-widest text-gold disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}
