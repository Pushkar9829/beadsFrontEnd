import { useCustomizerStore } from '../../../store/customizerStore';
import { bhagyankFromDate, mulankFromDate, MULANK_TABLE } from '../../../lib/calibration';

function Choice({ on, title, detail, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-5 text-center transition ${
        on
          ? 'border-[#c6a75e] bg-[#140c18] shadow-[0_0_0_2px_rgba(198,167,94,0.4)]'
          : 'border-[rgba(198,167,94,0.35)] hover:border-[#c6a75e]'
      }`}
    >
      <span className="block font-serif text-3xl text-gold">{title}</span>
      <span className="mt-2 block text-sm leading-snug text-lilac">{detail}</span>
    </button>
  );
}

export default function NumberBeadsStep() {
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const includeNumberBeads = useCustomizerStore((s) => s.includeNumberBeads);
  const setIncludeNumberBeads = useCustomizerStore((s) => s.setIncludeNumberBeads);

  let mulank = null;
  let bhagyank = null;
  if (dateOfBirth) {
    try {
      mulank = mulankFromDate(dateOfBirth);
      bhagyank = bhagyankFromDate(dateOfBirth);
    } catch {
      mulank = null;
    }
  }
  const mulankBead = mulank ? MULANK_TABLE[mulank]?.beadName : '';
  const bhagyankBead = bhagyank ? MULANK_TABLE[bhagyank]?.beadName : '';

  return (
    <div>
      <p className="text-sm leading-relaxed text-lilac">
        Mulank {mulank} is {mulankBead}. Bhagyank {bhagyank} is {bhagyankBead}.
      </p>
      <p className="mt-1 text-sm text-lilac">Add these beads to the strand?</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Choice
          on={includeNumberBeads === true}
          title="Yes"
          detail="Add the Mulank and Bhagyank beads."
          onClick={() => setIncludeNumberBeads(true)}
        />
        <Choice
          on={includeNumberBeads === false}
          title="No"
          detail="Keep only the intention crystals."
          onClick={() => setIncludeNumberBeads(false)}
        />
      </div>
    </div>
  );
}
