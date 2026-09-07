import { X } from 'lucide-react';
import { useCustomizerStore } from '../../store/customizerStore';
import GemVisual from '../ui/GemVisual';
import Price from '../ui/Price';

export default function BeadDetailDrawer() {
  const bead = useCustomizerStore((s) => s.detailBead);
  const close = useCustomizerStore((s) => s.setDetailBead);
  if (!bead) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => close(null)}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-surface p-6 gold-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-serif text-2xl gold-text">{bead.name}</h2>
          <button type="button" onClick={() => close(null)} className="text-lilac hover:text-ivory">
            <X />
          </button>
        </div>
        <GemVisual color={bead.colorHex} image={bead.image} name={bead.name} className="mt-4 h-52 w-full rounded-2xl" />
        <p className="mt-4 text-lilac">{bead.shortDescriptor}</p>
        <h3 className="mt-5 text-xs uppercase tracking-widest text-gold">Traditional power / use</h3>
        <p className="mt-1 text-sm text-ivory/85">{bead.powerUse}</p>
        <h3 className="mt-5 text-xs uppercase tracking-widest text-gold">Benefits</h3>
        <ul className="mt-1 list-disc pl-4 text-sm text-lilac">
          {(bead.benefits || []).map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        {bead.chakra && (
          <>
            <h3 className="mt-5 text-xs uppercase tracking-widest text-gold">Chakra / energy</h3>
            <p className="mt-1 text-sm">{bead.chakra}</p>
          </>
        )}
        {bead.reason && (
          <>
            <h3 className="mt-5 text-xs uppercase tracking-widest text-gold">Why it is recommended</h3>
            <p className="mt-1 text-sm text-amethyst-light">{bead.reason}</p>
          </>
        )}
        <h3 className="mt-5 text-xs uppercase tracking-widest text-gold">Care</h3>
        <p className="mt-1 text-sm text-lilac">{bead.careNotes}</p>
        <p className="mt-6 text-xs leading-relaxed text-ivory/45">{bead.disclaimer}</p>
        <p className="mt-4 text-gold">
          <Price value={bead.pricePerBead} /> <span className="text-xs text-lilac">/ bead</span>
        </p>
      </aside>
    </div>
  );
}
