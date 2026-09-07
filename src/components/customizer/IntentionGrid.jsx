import { useCustomizerStore } from '../../store/customizerStore';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function IntentionGrid() {
  const purpose = useCustomizerStore((s) => s.purpose);
  const intentions = useCustomizerStore((s) => s.intentions);
  const selected = useCustomizerStore((s) => s.intention);
  const selectIntention = useCustomizerStore((s) => s.selectIntention);
  const setStep = useCustomizerStore((s) => s.setStep);

  return (
    <div>
      <Button variant="text" onClick={() => setStep(1)}>← Purpose</Button>
      <h2 className="mt-2 font-serif text-2xl gold-text">Choose an intention</h2>
      <p className="mt-2 text-sm text-lilac">
        For <span className="text-gold">{purpose?.name}</span> — only the intentions that belong here.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {intentions.map((it) => (
          <Card
            key={it._id}
            onClick={() => selectIntention(it)}
            className={`p-4 ${selected?._id === it._id ? 'ring-1 ring-amethyst-light' : ''}`}
          >
            <h3 className="font-serif text-lg">{it.name}</h3>
            <p className="mt-1 text-sm text-lilac">{it.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
