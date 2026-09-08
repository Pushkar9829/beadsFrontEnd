import { X } from 'lucide-react';
import { useCustomizerStore } from '../../store/customizerStore';
import GemVisual from '../ui/GemVisual';
import Price from '../ui/Price';

export default function BeadDetailDrawer() {
  const bead = useCustomizerStore((s) => s.detailBead);
  const close = useCustomizerStore((s) => s.setDetailBead);
  if (!bead) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close crystal details"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={() => close(null)}
      />
      <aside
        className="relative z-10 flex h-dvh w-full max-w-md flex-col border-l border-[rgba(198,167,94,0.32)] bg-[#0d0d10] shadow-[-24px_0_60px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[rgba(198,167,94,0.2)] px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Crystal</p>
            <h2 className="font-serif text-xl gold-text">{bead.name}</h2>
          </div>
          <button
            type="button"
            onClick={() => close(null)}
            className="grid h-9 w-9 place-items-center rounded-full text-lilac transition hover:bg-gold/10 hover:text-ivory"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <GemVisual color={bead.colorHex} image={bead.image} name={bead.name} className="h-52 w-full rounded-2xl" />
          <p className="mt-4 text-lilac">{bead.shortDescriptor}</p>
          <h3 className="mt-5 text-[11px] uppercase tracking-[0.2em] text-gold">Traditional power / use</h3>
          <p className="mt-1 text-sm text-ivory/85">{bead.powerUse}</p>
          <h3 className="mt-5 text-[11px] uppercase tracking-[0.2em] text-gold">Benefits</h3>
          <ul className="mt-1 list-disc pl-4 text-sm text-lilac">
            {(bead.benefits || []).map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {bead.chakra && (
            <>
              <h3 className="mt-5 text-[11px] uppercase tracking-[0.2em] text-gold">Chakra / energy</h3>
              <p className="mt-1 text-sm">{bead.chakra}</p>
            </>
          )}
          {bead.reason && (
            <>
              <h3 className="mt-5 text-[11px] uppercase tracking-[0.2em] text-gold">Why it is recommended</h3>
              <p className="mt-1 text-sm text-amethyst-light">{bead.reason}</p>
            </>
          )}
          <h3 className="mt-5 text-[11px] uppercase tracking-[0.2em] text-gold">Care</h3>
          <p className="mt-1 text-sm text-lilac">{bead.careNotes}</p>
          <p className="mt-6 text-xs leading-relaxed text-ivory/45">{bead.disclaimer}</p>
          <p className="mt-4 text-gold">
            <Price value={bead.pricePerBead} /> <span className="text-xs text-lilac">/ bead</span>
          </p>
        </div>
      </aside>
    </div>
  );
}
