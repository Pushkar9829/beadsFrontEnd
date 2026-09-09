import { Component, Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { parseWristInches } from '../lib/format';
import GemVisual from '../components/ui/GemVisual';

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

function expandBeads(lines = []) {
  const out = [];
  lines.forEach((l) => {
    for (let i = 0; i < (l.quantity || 0); i += 1) {
      out.push({ colorHex: l.colorHex || '#c6a75e', name: l.name });
    }
  });
  return out;
}

function beadsForPreview(layout, lines) {
  if (Array.isArray(layout) && layout.length) {
    return layout.map((slot) => ({
      colorHex: slot.colorHex || '#c6a75e',
      name: slot.name,
      role: slot.role,
    }));
  }
  return expandBeads(lines);
}

function OvalCharm({ color, radius }) {
  return (
    <mesh position={[radius + 0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.72, 1.15, 0.45]}>
      <sphereGeometry args={[0.16, 24, 16]} />
      <meshStandardMaterial color={color} metalness={0.92} roughness={0.18} envMapIntensity={1.2} />
    </mesh>
  );
}

function BeadMesh({ color, position }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.13, 32, 32]} />
      <meshStandardMaterial
        color={color}
        roughness={color === '#F2F0EA' || color === '#D9D6E8' ? 0.12 : 0.28}
        metalness={0.18}
        envMapIntensity={0.9}
      />
    </mesh>
  );
}

function BraceletModel({ lines, layout, wristSize, metalColor, view }) {
  const beads = beadsForPreview(layout, lines);
  const inches = parseWristInches(wristSize);
  const radius = 0.82 + (inches - 6.5) * 0.1;
  const rot = view === 'wrist' ? [0.55, 0.95, 0.1] : [0.2, 0.15, 0];

  const positions = useMemo(() => {
    return Array.from({ length: beads.length }, (_, i) => {
      const t = (i / Math.max(beads.length, 1)) * Math.PI * 2 - Math.PI / 2;
      return [Math.cos(t) * radius, Math.sin(t) * 0.04, Math.sin(t) * radius];
    });
  }, [beads.length, radius]);

  return (
    <group rotation={rot}>
      {view === 'wrist' && (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius - 0.22, radius - 0.22, 1.6, 32]} />
          <meshStandardMaterial color="#3a2f2a" roughness={0.9} metalness={0} transparent opacity={0.35} />
        </mesh>
      )}
      {beads.length === 0 &&
        Array.from({ length: 8 }).map((_, i) => {
          const t = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(t) * radius, 0, Math.sin(t) * radius]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#222" roughness={0.6} />
            </mesh>
          );
        })}
      {beads.map((b, i) => (
        <BeadMesh key={`${b.name}-${i}`} color={b.colorHex} position={positions[i]} />
      ))}
      <OvalCharm color={metalColor || '#D4AF37'} radius={radius} />
    </group>
  );
}

function FallbackStrip({ lines, layout, metalColor }) {
  const beads = beadsForPreview(layout, lines);
  return (
    <div className="flex h-56 items-center justify-center gap-1 overflow-hidden rounded-2xl bg-raised px-4">
      {beads.length === 0 && <p className="text-sm text-lilac">Add beads to see your strand.</p>}
      {beads.map((b, i) => (
        <div key={i} className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-gold/30">
          <GemVisual color={b.colorHex} className="h-full w-full" />
        </div>
      ))}
      <div
        className="ml-1 h-10 w-6 rounded-full ring-1 ring-gold/50"
        style={{ background: metalColor || '#D4AF37' }}
      />
    </div>
  );
}

export default function BraceletPreview({ lines, layout, wristSize, finish, compact }) {
  const [view, setView] = useState('front');
  const metal = finish?.metalColor || '#D4AF37';

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {['front', 'wrist'].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-widest ${
              view === v ? 'bg-amethyst text-[#FCF8F4]' : 'border border-gold/30 text-lilac'
            }`}
          >
            {v === 'front' ? 'Front view' : 'Wrist view'}
          </button>
        ))}
      </div>
      <WebGLGuard fallback={<FallbackStrip lines={lines} layout={layout} metalColor={metal} />}>
        <div className={`overflow-hidden rounded-2xl bg-gradient-to-b from-[#16131c] to-black gold-border ${compact ? 'h-48' : 'h-72'}`}>
          <Canvas camera={{ position: [0, 0.6, 3.1], fov: 40 }} gl={{ antialias: true }}>
            <color attach="background" args={['#08070a']} />
            <ambientLight intensity={0.45} />
            <directionalLight position={[3, 5, 4]} intensity={1.6} color="#f6f1e8" />
            <spotLight position={[4, 6, 4]} intensity={18} angle={0.4} color="#e8d5a3" />
            <spotLight position={[-4, 2, -3]} intensity={12} color="#F0C0CF" />
            <pointLight position={[0, -2, 2]} intensity={6} color="#c6a75e" />
            <Suspense fallback={null}>
              <BraceletModel lines={lines} layout={layout} wristSize={wristSize} metalColor={metal} view={view} />
              <ContactShadows opacity={0.35} scale={8} blur={2.4} far={4} />
            </Suspense>
            <OrbitControls enablePan={false} minDistance={2.2} maxDistance={4.5} />
          </Canvas>
        </div>
      </WebGLGuard>
    </div>
  );
}
