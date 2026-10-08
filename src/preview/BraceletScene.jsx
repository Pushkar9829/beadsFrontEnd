// Bracelet preview: view toggle and frame. The 3D scene itself (three.js) loads separately the
// first time a preview appears, so the studio opens without waiting for it.
import { Component, lazy, Suspense, useMemo, useState } from 'react';
import GemVisual from '../components/ui/GemVisual';

const BraceletCanvas = lazy(() => import('./BraceletCanvas'));

class WebGLGuard extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

// Interleaves the crystals round the strand (A B C A B C …) the way the studio lays them out.
function expandBeads(lines = []) {
  const queues = (lines || []).map((l) => Array.from({ length: l.quantity || 0 }, () => ({ colorHex: l.colorHex || '#c6a75e', name: l.name })));
  const out = [];
  let added = true;
  while (added) {
    added = false;
    for (const queue of queues) {
      if (queue.length) {
        out.push(queue.shift());
        added = true;
      }
    }
  }
  return out;
}

function beadsForPreview(layout, lines) {
  if (Array.isArray(layout) && layout.length) {
    return layout.map((slot) => ({ colorHex: slot.colorHex || '#c6a75e', name: slot.name }));
  }
  return expandBeads(lines);
}

// Flat strip of beads for browsers without WebGL.
function FallbackStrip({ beads }) {
  return (
    <div className="nx-stage-flat">
      {beads.length === 0 && <p className="nx-note">Add beads to see your strand.</p>}
      {beads.slice(0, 24).map((b, i) => (
        <span key={i} className="nx-stage-bead">
          <GemVisual color={b.colorHex} className="h-full w-full" />
        </span>
      ))}
    </div>
  );
}

// Shown while the 3D scene downloads: a faint ring in the strand's colours.
function RingPlaceholder({ beads }) {
  const n = beads.length || 18;
  return (
    <div className="nx-stage-ring" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} style={{ '--a': `${(i / n) * 360}deg`, background: beads[i]?.colorHex || '#2a2730' }} />
      ))}
    </div>
  );
}

export default function BraceletPreview({ lines, layout, finish, charm, compact }) {
  const [view, setView] = useState('front');
  const beads = useMemo(() => beadsForPreview(layout, lines), [layout, lines]);
  const metal = charm ? finish?.metalColor || '#d4af37' : null;
  const charmKind = String(charm?.slug || charm?.name || '').toLowerCase().includes('om') ? 'om' : 'sriyantra';

  return (
    <div className="nx-preview">
      <div className={`nx-stage${compact ? ' is-compact' : ''}`}>
        <WebGLGuard fallback={<FallbackStrip beads={beads} />}>
          <Suspense fallback={<RingPlaceholder beads={beads} />}>
            <BraceletCanvas beads={beads} view={view} metalColor={metal} charmKind={charmKind} />
          </Suspense>
        </WebGLGuard>
        <div className="nx-view-tabs" role="group" aria-label="Preview view">
          {[
            ['front', 'Front'],
            ['wrist', 'On the wrist'],
          ].map(([v, label]) => (
            <button key={v} type="button" onClick={() => setView(v)} className={view === v ? 'is-on' : ''} aria-pressed={view === v}>
              {label}
            </button>
          ))}
        </div>
        <span className="nx-stage-hint">Drag to turn</span>
      </div>
    </div>
  );
}
