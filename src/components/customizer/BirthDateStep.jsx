import { useEffect, useMemo, useState } from 'react';
import { useCustomizerStore } from '../../store/customizerStore';
import { bhagyankFromDate, mulankFromDate, zodiacFromDate } from '../../lib/calibration';
import StrandReorder from './StrandReorder';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function DateOfBirthFields({ value, onChange }) {
  const now = new Date();
  const maxYear = now.getFullYear();
  const parsed = String(value || '').split('-');
  const [year, setYear] = useState(Number(parsed[0]) || '');
  const [month, setMonth] = useState(Number(parsed[1]) || '');
  const [day, setDay] = useState(Number(parsed[2]) || '');

  useEffect(() => {
    if (!value) return;
    const next = String(value).split('-');
    setYear(Number(next[0]) || '');
    setMonth(Number(next[1]) || '');
    setDay(Number(next[2]) || '');
  }, [value]);

  const maxDay = daysInMonth(year || maxYear, month || 1);
  const years = useMemo(() => {
    const list = [];
    for (let y = maxYear; y >= 1920; y -= 1) list.push(y);
    return list;
  }, [maxYear]);

  function emit(nextYear, nextMonth, nextDay) {
    setYear(nextYear);
    setMonth(nextMonth);
    let safeDay = nextDay;
    if (nextYear && nextMonth && nextDay) {
      const dim = daysInMonth(nextYear, nextMonth);
      safeDay = Math.min(nextDay, dim);
      setDay(safeDay);
      onChange(`${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`);
    } else {
      setDay(safeDay);
      onChange('');
    }
  }

  return (
    <div className="studio-birth-fields">
      <label>
        Day
        <select className="studio-select" value={day} onChange={(e) => emit(year, month, Number(e.target.value) || '')}>
          <option value="">Day</option>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
      <label>
        Month
        <select className="studio-select" value={month} onChange={(e) => emit(year, Number(e.target.value) || '', day)}>
          <option value="">Month</option>
          {MONTHS.map((label, i) => (
            <option key={label} value={i + 1}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        Year
        <select className="studio-select" value={year} onChange={(e) => emit(Number(e.target.value) || '', month, day)}>
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default function BirthDateStep() {
  const intention = useCustomizerStore((s) => s.intention);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const setDateOfBirth = useCustomizerStore((s) => s.setDateOfBirth);
  const calibration = useCustomizerStore((s) => s.calibration);
  const calibrating = useCustomizerStore((s) => s.calibrating);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const reorderLayout = useCustomizerStore((s) => s.reorderLayout);
  const picked = recommended.filter((b) => (quantities[b._id] || 0) > 0);

  const preview = useMemo(() => {
    if (!dateOfBirth) return null;
    try {
      return {
        mulank: mulankFromDate(dateOfBirth),
        bhagyank: bhagyankFromDate(dateOfBirth),
        sign: zodiacFromDate(dateOfBirth).sign,
      };
    } catch {
      return null;
    }
  }, [dateOfBirth]);

  const showLayout = calibration && calibration.dateOfBirth === dateOfBirth;
  const layout = showLayout ? calibration.layout || [] : [];

  return (
    <div className="studio-birth">
      <p className="studio-birth-kicker">
        {picked.length} crystal{picked.length === 1 ? '' : 's'} · {intention?.name || 'Intention'}
      </p>

      <DateOfBirthFields value={dateOfBirth} onChange={setDateOfBirth} />

      {preview && (
        <div className="studio-birth-stats">
          <div className="studio-birth-stat">
            <span>Mulank</span>
            <strong>{preview.mulank}</strong>
          </div>
          <div className="studio-birth-stat">
            <span>Bhagyank</span>
            <strong>{preview.bhagyank}</strong>
          </div>
          <div className="studio-birth-stat">
            <span>Zodiac</span>
            <strong>{preview.sign}</strong>
          </div>
        </div>
      )}

      {calibrating && <p className="studio-birth-note">Calibrating…</p>}

      {showLayout && (
        <StrandReorder
          layout={layout}
          onMove={reorderLayout}
          hint={`Mulank ${calibration.mulank} · ${layout.length} beads. Drag to rearrange.`}
        />
      )}
    </div>
  );
}
