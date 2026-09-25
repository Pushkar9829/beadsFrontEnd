import { useCustomizerStore } from '../../../store/customizerStore';
import { bhagyankFromDate, mulankFromDate, zodiacFromDate } from '../../../lib/calibration';
import DateFields from '../DateFields';

export default function BirthStep() {
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const setDateOfBirth = useCustomizerStore((s) => s.setDateOfBirth);
  const calibrating = useCustomizerStore((s) => s.calibrating);

  let preview = null;
  if (dateOfBirth) {
    try {
      preview = {
        mulank: mulankFromDate(dateOfBirth),
        bhagyank: bhagyankFromDate(dateOfBirth),
        sign: zodiacFromDate(dateOfBirth).sign,
      };
    } catch {
      preview = null;
    }
  }

  return (
    <div className="auth-card">
      <p className="studio-birth-kicker">Date of birth</p>
      <p className="mt-2 text-sm text-lilac">
        Day, month and year set Mulank. Next places the crystals in a repeating pattern.
      </p>
      <div className="mt-4">
        <DateFields value={dateOfBirth} onChange={setDateOfBirth} />
      </div>
      {preview ? (
        <p className="studio-birth-note mt-4">
          Mulank {preview.mulank} · Bhagyank {preview.bhagyank} · {preview.sign}
        </p>
      ) : null}
      {calibrating ? <p className="studio-birth-note mt-4">Calibrating…</p> : null}
    </div>
  );
}
