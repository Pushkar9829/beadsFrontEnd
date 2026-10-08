// The 3D bracelet. Loaded on its own (three.js is large) by BraceletScene.jsx.
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Color } from 'three';

const RING = 1; // strand radius in scene units

// Where the camera sits for each view; the bracelet always fills most of the frame.
const VIEWS = {
  front: { camera: [0, 2.35, 3.55], target: [0, -0.14, 0], fov: 34 },
  wrist: { camera: [3.9, 1.35, 4.0], target: [0.15, 0.05, 0], fov: 34 },
};

// Same colour, slightly different per bead, so the strand reads as natural stone, not plastic.
function beadColor(hex, i) {
  const c = new Color(hex || '#c6a75e');
  const hsl = {};
  c.getHSL(hsl);
  const wobble = Math.sin(i * 12.9898) * 0.5; // stable per index, -0.5..0.5
  c.setHSL(hsl.h, Math.min(1, hsl.s * (1 + wobble * 0.12)), Math.min(0.92, Math.max(0.06, hsl.l * (1 + wobble * 0.16))));
  return c;
}

function Bead({ color, position, radius }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[radius, 40, 40]} />
      <meshPhysicalMaterial color={color} roughness={0.22} clearcoat={1} clearcoatRoughness={0.12} metalness={0.02} envMapIntensity={1.1} />
    </mesh>
  );
}

// A gold medallion on a jump ring, hanging from the front of the strand.
function Charm({ color, beadRadius, kind }) {
  const metal = { color, metalness: 0.85, roughness: 0.28, envMapIntensity: 2 };
  const z = RING + beadRadius * 0.55;
  return (
    <group position={[0, -beadRadius * 0.6, z]}>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[0, -0.02, 0]}>
        <torusGeometry args={[0.045, 0.012, 12, 28]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      {/* tipped back toward the viewer so the face catches the light */}
      <group position={[0, -0.16, 0.02]} rotation={[-0.55, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.105, 0.105, 0.022, 48]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {/* raised mark on the face: a ring for Om, a triangle for Sri Yantra */}
        <mesh position={[0, 0, 0.014]} rotation={kind === 'om' ? [0, 0, 0] : [0, 0, Math.PI]}>
          {kind === 'om' ? <torusGeometry args={[0.055, 0.009, 10, 32]} /> : <circleGeometry args={[0.06, 3]} />}
          <meshStandardMaterial {...metal} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

function Strand({ beads, metalColor, charmKind, threadColor }) {
  const n = beads.length || 18;
  // Beads sit touching all the way round, like a real strung bracelet.
  const radius = Math.min(0.2, Math.max(0.06, ((Math.PI * RING) / n) * 0.97));
  const slots = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        // start at the front so the charm hangs between the first and last bead
        const t = Math.PI / 2 + ((i + 0.5) / n) * Math.PI * 2;
        return [Math.cos(t) * RING, 0, Math.sin(t) * RING];
      }),
    [n]
  );

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RING, 0.012, 8, 160]} />
        <meshStandardMaterial color={threadColor} roughness={0.7} />
      </mesh>
      {beads.length
        ? beads.map((b, i) => <Bead key={i} color={beadColor(b.colorHex, i)} position={slots[i]} radius={radius} />)
        : slots.map((p, i) => (
            <mesh key={i} position={p}>
              <sphereGeometry args={[radius, 24, 24]} />
              <meshStandardMaterial color="#2a2730" roughness={0.6} transparent opacity={0.55} />
            </mesh>
          ))}
      {metalColor && <Charm color={metalColor} beadRadius={radius} kind={charmKind} />}
    </group>
  );
}

// A velvet display arm (as in a jewellery case) the strand sits on in the wrist view; long enough
// that its ends stay out of frame.
function Wrist({ beadRadius }) {
  const r = RING - beadRadius - 0.03;
  return (
    <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.82]}>
      <cylinderGeometry args={[r, r, 14, 64]} />
      <meshStandardMaterial color="#3a3340" roughness={0.95} />
    </mesh>
  );
}

function CameraRig({ view }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  useEffect(() => {
    const v = VIEWS[view] || VIEWS.front;
    camera.position.set(...v.camera);
    camera.fov = v.fov;
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.set(...v.target);
      controls.update();
    }
  }, [view, camera, controls]);
  return null;
}

export default function BraceletCanvas({ beads, view, metalColor, charmKind, threadColor = '#d8cfc2' }) {
  const n = beads.length || 18;
  const beadRadius = Math.min(0.2, Math.max(0.06, ((Math.PI * RING) / n) * 0.97));
  const wrist = view === 'wrist';
  const spin = useRef(null);

  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }} camera={{ position: VIEWS.front.camera, fov: VIEWS.front.fov }} shadows>
      <CameraRig view={view} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.4} castShadow />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.4} position={[0, 4, 2]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[0, 1.5, 5]} scale={[5, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#f3e3c3" position={[-4, 1, 1]} rotation-y={Math.PI / 2} scale={[4, 1.5, 1]} />
        <Lightformer form="ring" intensity={0.8} color="#c9b8ff" position={[4, 1, -2]} scale={2} />
      </Environment>

      {/* The wrist view stands the strand up around a forearm lying along X. */}
      <group ref={spin} rotation={wrist ? [0, 0, Math.PI / 2] : [0, 0, 0]}>
        <Strand beads={beads} metalColor={metalColor} charmKind={charmKind} threadColor={threadColor} />
      </group>
      {wrist && <Wrist beadRadius={beadRadius} />}

      <ContactShadows position={[0, wrist ? -1.15 : -beadRadius - 0.02, 0]} opacity={0.45} scale={5} blur={2.6} far={2} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        autoRotate={!wrist}
        autoRotateSpeed={0.7}
        minPolarAngle={0.35}
        maxPolarAngle={1.45}
      />
    </Canvas>
  );
}
