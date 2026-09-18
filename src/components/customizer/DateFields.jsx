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
    <div className="studio-birth-fields">
      <label>
        Day
        <select
          className="studio-select"
          value={day}
          onChange={(e) => emit(year, month, Number(e.target.value) || '')}
        >
          <option value="">Day</option>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
      <label>
        Month
        <select
          className="studio-select"
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
        Year
        <select
          className="studio-select"
          value={year}
          onChange={(e) => emit(Number(e.target.value) || '', month, day)}
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
