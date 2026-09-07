import { useEffect } from 'react';
import { useCustomizerStore, useCustomizerQuote } from '../store/customizerStore';
import Stepper from '../components/customizer/Stepper';
import PurposeGrid from '../components/customizer/PurposeGrid';
import IntentionGrid from '../components/customizer/IntentionGrid';
import BeadGrid from '../components/customizer/BeadGrid';
import CharmStep from '../components/customizer/CharmStep';
import ReviewStep from '../components/customizer/ReviewStep';
import PreviewPanel from '../components/customizer/PreviewPanel';
import BeadDetailDrawer from '../components/customizer/BeadDetailDrawer';
import Spinner from '../components/ui/Spinner';
import Price from '../components/ui/Price';

export default function CustomizePage() {
  const init = useCustomizerStore((s) => s.init);
  const loading = useCustomizerStore((s) => s.loading);
  const error = useCustomizerStore((s) => s.error);
  const step = useCustomizerStore((s) => s.step);
  const quote = useCustomizerQuote();
  const config = useCustomizerStore((s) => s.config);

  useEffect(() => {
    init();
  }, [init]);

  if (loading) return <Spinner label="Opening the atelier" />;
  if (error) return <p className="p-8 text-center text-red-300">{error}</p>;

  const pane = {
    1: <PurposeGrid />,
    2: <IntentionGrid />,
    3: <BeadGrid />,
    4: <CharmStep />,
    5: <ReviewStep />,
  }[step];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 lg:pb-8">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">Customize Your Bracelet</p>
      <h1 className="mt-2 font-serif text-3xl gold-text md:text-4xl">Build a personal piece</h1>
      <p className="mt-2 max-w-2xl text-lilac">
        Purpose, then intention, then the beads themselves. Pricing updates with every quantity change.
      </p>
      <div className="mt-6">
        <Stepper />
      </div>

      <div className="mt-8 lg:hidden">
        <PreviewPanel mobile />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>{pane}</div>
        <div className="hidden lg:block">
          <PreviewPanel />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/30 bg-black/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-sm">
          <span className="text-lilac">{quote.beadCount} / {config?.beadLimit} beads</span>
          <span className="font-serif text-lg text-gold"><Price value={quote.total} /></span>
        </div>
      </div>
      <BeadDetailDrawer />
    </div>
  );
}
