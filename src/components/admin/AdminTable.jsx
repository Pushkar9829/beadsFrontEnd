export default function AdminTable({ columns, rows, rowKey = (r) => r._id, empty = 'No records yet.' }) {
  return (
    <div className="overflow-x-auto rounded-2xl gold-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="sticky top-0 bg-raised text-[11px] uppercase tracking-widest text-gold">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`whitespace-nowrap px-4 py-3 font-medium ${c.align === 'right' ? 'text-right' : ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-lilac">{empty}</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-gold/15 hover:bg-raised/60">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 align-middle ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
