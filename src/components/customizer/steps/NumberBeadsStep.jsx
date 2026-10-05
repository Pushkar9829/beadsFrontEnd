import { useCustomizerStore } from '../../../store/customizerStore';
import { bhagyankFromDate, findBeadByName, mulankFromDate, MULANK_TABLE } from '../../../lib/calibration';
import GemVisual from '../../ui/GemVisual';

function YesNo({ value, onChange }) {
  return (
    <div className="flex shrink-0 gap-1.5">
      {[
        [true, 'Yes'],
        [false, 'No'],
      ].map(([next, label]) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(next)}
          className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${
            value === next
              ? 'border-[#c6a75e] bg-[#140c18] text-gold'
              : 'border-[rgba(198,167,94,0.35)] text-lilac hover:border-[#c6a75e]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function BeadOffer({ bead, name, detail }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[rgba(198,167,94,0.35)] px-3 py-2">
      <GemVisual
        color={bead?.colorHex || '#C6A75E'}
        image={bead?.image}
        name=""
        className="h-10 w-10 shrink-0 rounded-full"
      />
      <div className="min-w-0 flex-1">
        <p className="studio-bead-name truncate">{name}</p>
        <p className="truncate text-xs text-lilac">{detail}</p>
      </div>
    </div>
  );
}

export default function NumberBeadsStep() {
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const catalogBeads = useCustomizerStore((s) => s.catalogBeads);
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
  const sameBead = mulankBead && mulankBead === bhagyankBead;
  const rows = sameBead
    ? [{ name: mulankBead, detail: `Mulank ${mulank} · Bhagyank ${bhagyank}` }]
    : [
      mulankBead ? { name: mulankBead, detail: `Mulank ${mulank}` } : null,
      bhagyankBead ? { name: bhagyankBead, detail: `Bhagyank ${bhagyank}` } : null,
    ].filter(Boolean);

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <BeadOffer
          key={row.detail}
          bead={findBeadByName(catalogBeads, row.name)}
          name={row.name}
          detail={row.detail}
        />
      ))}
      <div className="flex items-center justify-end">
        <YesNo value={includeNumberBeads} onChange={setIncludeNumberBeads} />
      </div>
    </div>
  );
}
