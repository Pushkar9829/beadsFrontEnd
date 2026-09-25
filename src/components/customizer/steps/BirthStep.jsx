import { useCustomizerStore } from '../../../store/customizerStore';
import { bhagyankFromDate, mulankFromDate } from '../../../lib/calibration';
import DateFields from '../DateFields';

export default function BirthStep() {
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const setDateOfBirth = useCustomizerStore((s) => s.setDateOfBirth);
  const calibrating = useCustomizerStore((s) => s.calibrating);

  let numbers = null;
  if (dateOfBirth) {
    try {
      numbers = {
        mulank: mulankFromDate(dateOfBirth),
        bhagyank: bhagyankFromDate(dateOfBirth),
      };
    } catch {
      numbers = null;
    }
  }

  return (
    <div className="auth-card">
      <p className="studio-birth-kicker">Date of birth</p>
      <p className="mt-2 text-sm text-lilac">
        Day, month and year set Mulank and Bhagyank. Next continues once both numbers are shown.
      </p>
      <div className="mt-4">
        <DateFields value={dateOfBirth} onChange={setDateOfBirth} />
      </div>
      {numbers ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[rgba(198,167,94,0.35)] px-4 py-5 text-center">
            <p className="studio-birth-kicker">Mulank</p>
            <p className="mt-2 font-serif text-5xl text-gold">{numbers.mulank}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(198,167,94,0.35)] px-4 py-5 text-center">
            <p className="studio-birth-kicker">Bhagyank</p>
            <p className="mt-2 font-serif text-5xl text-gold">{numbers.bhagyank}</p>
          </div>
        </div>
      ) : null}
      {numbers ? (
        <p className="studio-birth-note mt-4">Mulank {numbers.mulank} and Bhagyank {numbers.bhagyank} are set. Continue to the beads.</p>
      ) : null}
      {calibrating ? <p className="studio-birth-note mt-4">Calibrating…</p> : null}
    </div>
  );
}
