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

function BeadOffer({ bead, name, detail, value, onChange }) {
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
      <YesNo value={value} onChange={onChange} />
    </div>
  );
}

export default function NumberBeadsStep() {
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const catalogBeads = useCustomizerStore((s) => s.catalogBeads);
  const includeMulankBead = useCustomizerStore((s) => s.includeMulankBead);
  const includeBhagyankBead = useCustomizerStore((s) => s.includeBhagyankBead);
  const setIncludeNumberBead = useCustomizerStore((s) => s.setIncludeNumberBead);

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
  const rows = [
    mulankBead ? { kind: 'mulank', name: mulankBead, detail: `Mulank ${mulank}`, value: includeMulankBead } : null,
    bhagyankBead ? { kind: 'bhagyank', name: bhagyankBead, detail: `Bhagyank ${bhagyank}`, value: includeBhagyankBead } : null,
  ].filter(Boolean);

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <BeadOffer
          key={row.kind}
          bead={findBeadByName(catalogBeads, row.name)}
          name={row.name}
          detail={row.detail}
          value={row.value}
          onChange={(yes) => setIncludeNumberBead(row.kind, yes)}
        />
      ))}
    </div>
  );
}
