import { useMemo, useState } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function splitDate(value) {
  const [y, m, d] = String(value || '').split('-');
  return { year: Number(y) || '', month: Number(m) || '', day: Number(d) || '' };
}

const pad = (n) => String(n).padStart(2, '0');

export default function DateFields({ value, onChange }) {
  const maxYear = new Date().getFullYear();
  // The three selects need their own state because a half-finished date is not a date:
  // the parent holds '' until all three are set, so it cannot round-trip the partial pick.
  const [parts, setParts] = useState(() => splitDate(value));
  const [synced, setSynced] = useState(value);
  const [typed, setTyped] = useState(null);
  const { year, month, day } = parts;

  // A complete date arriving from outside (deep link, or a reset) replaces the local pick.
  if (value !== synced) {
    setSynced(value);
    if (value) setParts(splitDate(value));
  }

  const maxDay = daysInMonth(year || maxYear, month || 1);
  const years = useMemo(() => {
    const list = [];
    for (let y = maxYear; y >= 1920; y -= 1) list.push(y);
    return list;
  }, [maxYear]);

  function emit(nextYear, nextMonth, nextDay) {
    if (nextYear && nextMonth && nextDay) {
      const safeDay = Math.min(nextDay, daysInMonth(nextYear, nextMonth));
      setParts({ year: nextYear, month: nextMonth, day: safeDay });
      onChange(`${nextYear}-${pad(nextMonth)}-${pad(safeDay)}`);
      return;
    }
    setParts({ year: nextYear, month: nextMonth, day: nextDay });
    onChange('');
  }

  return (
    <div className="sb-date">
      {/* Source L966-1062: number boxes for day and year, a dropdown for the month. */}
      <label>
        <span className="sb-date-l">Day</span>
        <input
          className="sb-input"
          type="number"
          inputMode="numeric"
          min="1"
          max={maxDay}
          placeholder="DD"
          value={day}
          onChange={(e) => {
            const n = Number(e.target.value);
            emit(year, month, n >= 1 && n <= 31 ? n : '');
          }}
        />
      </label>
      <label>
        <span className="sb-date-l">Month</span>
        <select
          className="sb-input"
          value={month}
          onChange={(e) => emit(year, Number(e.target.value) || '', day)}
        >
          <option value="">Month</option>
          {MONTHS.map((label, i) => (
            <option key={label} value={i + 1}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="sb-date-l">Year</span>
        <input
          className="sb-input"
          type="number"
          inputMode="numeric"
          min={years[years.length - 1]}
          max={maxYear}
          placeholder="YYYY"
          value={typed ?? year}
          onChange={(e) => {
            // A year only counts once it has four digits and is in range; keep partial typing local.
            const raw = e.target.value.slice(0, 4);
            const n = Number(raw);
            const ok = raw.length === 4 && n >= years[years.length - 1] && n <= maxYear;
            setTyped(ok ? null : raw);
            emit(ok ? n : '', month, day);
          }}
        />
      </label>
    </div>
  );
}
