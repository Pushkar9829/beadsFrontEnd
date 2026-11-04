// Time of birth on a 12-hour clock: Hour / Minute / AM-PM. The value stays 24-hour "HH:mm" (what the API
// stores), so only the input changes. Used by the home Kundali modal, Account -> My Kundli and the admin.
import { useEffect, useState } from 'react';
import { joinTime12, splitTime12 } from '../../lib/kundli';

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export default function TimeOfBirth12({ id, value, onChange, disabled = false, className = '', selectClassName = '' }) {
  const [parts, setParts] = useState(() => splitTime12(value));
  // Follow the stored value when it changes from outside (prefill, reset), without losing a half-picked time.
  useEffect(() => {
    if (value && value !== joinTime12(parts)) setParts(splitTime12(value));
    if (!value && joinTime12(parts)) setParts({ hour: '', minute: '', ampm: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const update = (key) => (e) => {
    const next = { ...parts, [key]: e.target.value };
    // Picking an hour first fills sensible defaults so one more pick completes the time.
    if (key === 'hour' && next.minute === '') next.minute = '00';
    setParts(next);
    onChange(joinTime12(next));
  };

  return (
    <div className={`tob12 ${className}`.trim()} role="group" aria-label="Time of birth">
      <select id={id} className={selectClassName} value={parts.hour} onChange={update('hour')} disabled={disabled} aria-label="Hour">
        <option value="">Hour</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="tob12-sep" aria-hidden>
        :
      </span>
      <select className={selectClassName} value={parts.minute} onChange={update('minute')} disabled={disabled} aria-label="Minute">
        <option value="">Min</option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <select className={selectClassName} value={parts.ampm} onChange={update('ampm')} disabled={disabled} aria-label="AM or PM">
        <option value="">AM/PM</option>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
