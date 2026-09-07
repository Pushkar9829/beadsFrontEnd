import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import Card from '../ui/Card';
import QtyControl from '../ui/QtyControl';
import Price from '../ui/Price';
import GemVisual from '../ui/GemVisual';
import Button from '../ui/Button';

export default function BeadGrid() {
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const setQty = useCustomizerStore((s) => s.setQty);
  const quote = useCustomizerQuote();
  const remaining = (useCustomizerStore((s) => s.config?.beadLimit) || 18) - quote.beadCount;
  const setDetailBead = useCustomizerStore((s) => s.setDetailBead);
  const intention = useCustomizerStore((s) => s.intention);
  const setStep = useCustomizerStore((s) => s.setStep);

  return (
    <div>
      <Button variant="text" onClick={() => setStep(2)}>← Intention</Button>
      <h2 className="mt-2 font-serif text-2xl gold-text">Recommended beads</h2>
      <p className="mt-2 text-sm text-lilac">
        Chosen for <span className="text-gold">{intention?.name}</span>. Quantity is yours — up to the strand limit.
      </p>
      <div className="mt-6 grid gap-4">
        {recommended.map((bead) => {
          const qty = quantities[bead._id] || 0;
          const sub = qty * bead.pricePerBead;
          return (
            <Card key={bead._id} className="overflow-hidden p-4">
              <div className="flex gap-4">
                <button type="button" onClick={() => setDetailBead(bead)} className="shrink-0">
                  <GemVisual
                    color={bead.colorHex}
                    image={bead.image}
                    name={bead.name}
                    className="h-24 w-24 rounded-2xl"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => setDetailBead(bead)} className="text-left">
                    <h3 className="font-serif text-xl text-ivory">{bead.name}</h3>
                    <p className="text-sm text-lilac">{bead.shortDescriptor}</p>
                  </button>
                  <p className="mt-2 text-sm text-ivory/80">{bead.powerUse}</p>
                  <ul className="mt-2 list-disc pl-4 text-xs text-lilac">
                    {(bead.benefits || []).slice(0, 5).map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs leading-relaxed text-amethyst-light">{bead.reason}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-gold">
                        <Price value={bead.pricePerBead} /> <span className="text-xs text-lilac">/ bead</span>
                      </div>
                      <div className="text-xs text-lilac">
                        Subtotal <Price value={sub} />
                      </div>
                    </div>
                    <QtyControl
                      value={qty}
                      max={qty + remaining}
                      onChange={(n) => setQty(bead._id, n)}
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={() => setStep(4)}>Continue to charm</Button>
      </div>
    </div>
  );
}
