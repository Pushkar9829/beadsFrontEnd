import { useCustomizerStore } from '../../store/customizerStore';
import Card from '../ui/Card';

export default function PurposeGrid() {
  const purposes = useCustomizerStore((s) => s.purposes);
  const selected = useCustomizerStore((s) => s.purpose);
  const selectPurpose = useCustomizerStore((s) => s.selectPurpose);

  return (
    <div>
      <h2 className="font-serif text-2xl gold-text">Choose a purpose</h2>
      <p className="mt-2 max-w-xl text-sm text-lilac">
        Start with the feeling you want this piece to hold. Intentions appear only after you choose.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {purposes.map((p) => (
          <Card
            key={p._id}
            onClick={() => selectPurpose(p)}
            className={`p-4 ${selected?._id === p._id ? 'ring-1 ring-amethyst-light' : ''}`}
          >
            <h3 className="font-serif text-lg text-ivory">{p.name}</h3>
            <p className="mt-1 text-sm text-lilac">{p.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
