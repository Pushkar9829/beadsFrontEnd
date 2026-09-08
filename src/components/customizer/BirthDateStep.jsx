import { useEffect, useMemo, useState } from 'react';
import { useCustomizerStore } from '../../store/customizerStore';
import { bhagyankFromDate, mulankFromDate, zodiacFromDate, dateRangeLabel } from '../../lib/calibration';
import Card from '../ui/Card';
import GemVisual from '../ui/GemVisual';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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

  const field = 'mt-2 w-full rounded-xl border border-gold/30 bg-raised px-3 py-2.5 text-base text-ivory';

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block text-xs uppercase tracking-widest text-gold">
        Day
        <select className={field} value={day} onChange={(e) => emit(year, month, Number(e.target.value) || '')}>
          <option value="">Day</option>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
      <label className="block text-xs uppercase tracking-widest text-gold">
        Month
        <select className={field} value={month} onChange={(e) => emit(year, Number(e.target.value) || '', day)}>
          <option value="">Month</option>
          {MONTHS.map((label, i) => (
            <option key={label} value={i + 1}>{label}</option>
          ))}
        </select>
      </label>
      <label className="block text-xs uppercase tracking-widest text-gold">
        Year
        <select className={field} value={year} onChange={(e) => emit(Number(e.target.value) || '', month, day)}>
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
  const picked = recommended.filter((b) => (quantities[b._id] || 0) > 0);

  const preview = useMemo(() => {
    if (!dateOfBirth) return null;
    try {
      const sign = zodiacFromDate(dateOfBirth);
      return {
        mulank: mulankFromDate(dateOfBirth),
        bhagyank: bhagyankFromDate(dateOfBirth),
        sign: sign.sign,
        dateRange: dateRangeLabel(sign),
      };
    } catch {
      return null;
    }
  }, [dateOfBirth]);

  const showLayout = calibration && calibration.dateOfBirth === dateOfBirth;

  return (
    <div>
      <h2 className="font-serif text-2xl gold-text">Date of birth</h2>
      <p className="mt-2 text-sm text-lilac">
        Choose day, month and year. Mulank is calculated from the day, then crystals for
        {' '}<span className="text-gold">{intention?.name}</span> are positioned on the strand.
      </p>
      {picked.length > 0 && (
        <p className="mt-2 text-xs uppercase tracking-widest text-gold">
          {picked.length} crystal{picked.length === 1 ? '' : 's'} carrying forward
        </p>
      )}

      <div className="mt-6">
        <DateOfBirthFields value={dateOfBirth} onChange={setDateOfBirth} />
      </div>

      {preview && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-[11px] uppercase tracking-widest text-gold">Mulank</p>
            <p className="mt-1 font-serif text-3xl text-ivory">{preview.mulank}</p>
            <p className="mt-1 text-xs text-lilac">Birth number from the day</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] uppercase tracking-widest text-gold">Bhagyank</p>
            <p className="mt-1 font-serif text-3xl text-ivory">{preview.bhagyank}</p>
            <p className="mt-1 text-xs text-lilac">Destiny number from the full date</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] uppercase tracking-widest text-gold">Zodiac</p>
            <p className="mt-1 font-serif text-2xl text-ivory">{preview.sign}</p>
            <p className="mt-1 text-xs text-lilac">{preview.dateRange}</p>
          </Card>
        </div>
      )}

      {calibrating && <p className="mt-4 text-sm text-lilac">Calibrating the strand…</p>}

      {showLayout && (
        <div className="mt-8 space-y-4">
          {calibration.mulankCrystal && (
            <p className="text-sm text-lilac">{calibration.mulankCrystal.reason}</p>
          )}
          <p className="text-sm text-ivory/80">{calibration.explanation}</p>
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Calibrated positions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(calibration.layout || []).map((slot) => (
                <div key={slot.position} className="w-14 text-center">
                  <GemVisual
                    color={slot.colorHex}
                    image={slot.image}
                    name={slot.name}
                    className="mx-auto h-10 w-10 rounded-full"
                  />
                  <p className="mt-1 text-[10px] text-lilac">{slot.position}</p>
                  <p className="truncate text-[10px] text-ivory">{slot.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
