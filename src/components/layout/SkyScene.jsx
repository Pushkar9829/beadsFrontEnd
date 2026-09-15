import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sparkles, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';

const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const CHART_LABELS = [
  { t: '14', a: -2.35, d: 0.48 },
  { t: '23', a: -0.85, d: 0.52 },
  { t: '17', a: -0.45, d: 0.78 },
  { t: '80', a: 0.42, d: 0.42 },
  { t: '56', a: 0.95, d: 0.58 },
  { t: '100', a: 0.72, d: 0.74 },
  { t: '777', a: 1.12, d: 0.88 },
];
const NUMBERS = [
  { t: '9', x: -0.32, y: -0.12, s: 1.35, spark: true },
  { t: '10', x: -0.04, y: 0.34, s: 0.62, spark: true },
  { t: '7', x: 0.06, y: 0.04, s: 0.58, spark: true },
  { t: '5', x: -0.38, y: 0.28, s: 0.42 },
  { t: '8', x: -0.4, y: 0.02, s: 0.46 },
  { t: '12', x: -0.22, y: 0.08, s: 0.44 },
  { t: '3', x: -0.42, y: 0.4, s: 0.38 },
  { t: '1', x: -0.24, y: -0.32, s: 0.48, spark: true },
  { t: '6', x: -0.36, y: -0.4, s: 0.28 },
  { t: '4', x: -0.28, y: 0.22, s: 0.26 },
  { t: '2', x: -0.44, y: -0.08, s: 0.24 },
  { t: '23', x: 0.18, y: 0.18, s: 0.4, spark: true },
  { t: '42', x: 0.08, y: -0.36, s: 0.24 },
];
const GLYPHS = '0123456789♈♉♊♋♌♍♎♏♐♑♒♓';

const nebulaVert = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFrag = /* glsl */ `
  varying vec3 vPos;
  uniform float uTime;
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.23));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.52;
    }
    return v;
  }
  void main() {
    vec3 p = normalize(vPos);
    vec3 drift = vec3(uTime * 0.018, uTime * 0.012, uTime * 0.009);
    vec3 q = p * 1.85 + drift;
    float warp = fbm(q + 2.7);
    q += vec3(warp, fbm(q + 5.1), warp * 0.65) * 1.15;
    float n = fbm(q);
    float ridge = 1.0 - abs(fbm(q * 1.55 + 9.0) * 2.0 - 1.0);
    float filaments = pow(ridge, 3.2) * n;
    float dust = smoothstep(0.18, 0.82, n);
    vec3 deep = vec3(0.035, 0.01, 0.09);
    vec3 violet = vec3(0.28, 0.05, 0.58);
    vec3 magenta = vec3(0.78, 0.14, 0.82);
    vec3 hot = vec3(1.0, 0.42, 0.92);
    vec3 cyan = vec3(0.28, 0.42, 0.95);
    vec3 col = mix(deep, violet, dust);
    col = mix(col, magenta, pow(n, 1.45) * 0.85);
    col = mix(col, hot, pow(filaments, 1.2) * 0.95);
    col += cyan * pow(1.0 - n, 2.4) * 0.18;
    col += vec3(1.0, 0.82, 1.0) * pow(filaments, 5.5) * 0.48;
    col += vec3(0.9, 0.55, 0.2) * pow(n * ridge, 8.0) * 0.08;
    col *= 0.78;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function makeRadial(rgb, size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, `rgba(${rgb}, 0.95)`);
  g.addColorStop(0.35, `rgba(${rgb}, 0.4)`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function makePlus(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const mid = size / 2;
  const glow = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid);
  glow.addColorStop(0, 'rgba(255, 220, 255, 0.95)');
  glow.addColorStop(0.18, 'rgba(236, 72, 255, 0.55)');
  glow.addColorStop(1, 'rgba(168, 40, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(255, 245, 255, 0.95)';
  ctx.lineCap = 'round';
  ctx.lineWidth = size * 0.045;
  ctx.beginPath();
  ctx.moveTo(mid, size * 0.12);
  ctx.lineTo(mid, size * 0.88);
  ctx.moveTo(size * 0.12, mid);
  ctx.lineTo(size * 0.88, mid);
  ctx.stroke();
  ctx.lineWidth = size * 0.03;
  ctx.beginPath();
  ctx.moveTo(size * 0.28, size * 0.28);
  ctx.lineTo(size * 0.72, size * 0.72);
  ctx.moveTo(size * 0.72, size * 0.28);
  ctx.lineTo(size * 0.28, size * 0.72);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function makeMoon(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const mid = size / 2;
  const halo = ctx.createRadialGradient(mid, mid, size * 0.12, mid, mid, mid);
  halo.addColorStop(0, 'rgba(255, 236, 255, 0.5)');
  halo.addColorStop(1, 'rgba(210, 140, 255, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#ffe8ff';
  ctx.beginPath();
  ctx.arc(mid, mid, size * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(mid + size * 0.12, mid - size * 0.04, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function useSkyTextures() {
  return useMemo(
    () => ({
      glow: makeRadial('255, 170, 255'),
      puffHot: makeRadial('255, 90, 220', 256),
      puffDeep: makeRadial('90, 30, 180', 256),
      puffCyan: makeRadial('70, 140, 255', 256),
      puffRose: makeRadial('255, 150, 210', 256),
      plus: makePlus(),
      moon: makeMoon(),
    }),
    [],
  );
}

function Nebula({ frozen }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: nebulaVert,
        fragmentShader: nebulaFrag,
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  useFrame((_, dt) => {
    if (!frozen) mat.uniforms.uTime.value += dt;
  });
  return (
    <mesh>
      <sphereGeometry args={[16, 32, 24]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function CloudPuff({ puff, frozen }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current || frozen) return;
    const t = clock.elapsedTime * puff.spd + puff.ph;
    ref.current.position.x = puff.p[0] + Math.sin(t) * puff.amp;
    ref.current.position.y = puff.p[1] + Math.cos(t * 0.72) * puff.amp * 0.55;
  });
  return (
    <sprite ref={ref} position={puff.p} scale={[puff.s, puff.s * puff.sy, 1]} renderOrder={1}>
      <spriteMaterial
        map={puff.map}
        color={puff.color}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={puff.opacity}
        toneMapped={false}
      />
    </sprite>
  );
}

function NumberMark({ item, width, height, tex, frozen }) {
  const ref = useRef();
  const size = item.s;
  useFrame(({ clock }) => {
    if (!ref.current || frozen) return;
    const t = clock.elapsedTime;
    ref.current.position.x = item.x * width + Math.sin(t * 0.35 + item.x) * 0.06;
    ref.current.position.y = item.y * height + Math.cos(t * 0.28 + item.y) * 0.05;
  });
  return (
    <group ref={ref} position={[item.x * width, item.y * height, 0.4]}>
      <sprite scale={[size * 2.4, size * 2.4, 1]} renderOrder={2}>
        <spriteMaterial
          map={tex.glow}
          color="#e879f9"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.34}
          toneMapped={false}
        />
      </sprite>
      <Text fontSize={size} color="#c989c8" fillOpacity={0.7} anchorX="center" anchorY="middle" characters={GLYPHS} toneMapped={false}>
        {item.t}
      </Text>
      {item.spark ? (
        <sprite position={[size * 0.42, size * 0.22, 0.05]} scale={[size * 0.5, size * 0.5, 1]} renderOrder={3}>
          <spriteMaterial map={tex.plus} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.42} toneMapped={false} />
        </sprite>
      ) : null}
    </group>
  );
}

function Wheel({ position, radius, items, frozen, speed }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current && !frozen) ref.current.rotation.z += dt * speed;
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <torusGeometry args={[radius, 0.012, 8, 72]} />
        <meshBasicMaterial color="#e8d5a3" transparent opacity={0.52} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[radius * 0.7, 0.008, 8, 64]} />
        <meshBasicMaterial color="#e8d5a3" transparent opacity={0.32} toneMapped={false} />
      </mesh>
      {items.map((label, i) => {
        const a = -Math.PI / 2 + (i / items.length) * Math.PI * 2;
        return (
          <Text
            key={label}
            position={[Math.cos(a) * radius * 0.84, Math.sin(a) * radius * 0.84, 0]}
            fontSize={radius * 0.16}
            color="#cbb98a"
            fillOpacity={0.62}
            anchorX="center"
            anchorY="middle"
            characters={GLYPHS}
            toneMapped={false}
          >
            {label}
          </Text>
        );
      })}
    </group>
  );
}

function NatalChart({ position, radius }) {
  const spokes = [0.52, 0.7, 0.88, 1.06, 1.24, 1.42].map((a) => a * Math.PI);
  return (
    <group position={position} rotation={[0, 0, -0.15]}>
      {[0.4, 0.58, 0.76, 0.96].map((scale) => (
        <mesh key={scale}>
          <torusGeometry args={[radius * scale, 0.01, 8, 80]} />
          <meshBasicMaterial color="#ec78ff" transparent opacity={0.28} toneMapped={false} />
        </mesh>
      ))}
      {spokes.map((a) => (
        <mesh key={a} rotation={[0, 0, a]} position={[Math.cos(a) * radius * 0.48, Math.sin(a) * radius * 0.48, 0]}>
          <boxGeometry args={[radius * 0.96, 0.01, 0.01]} />
          <meshBasicMaterial color="#f0abfc" transparent opacity={0.24} toneMapped={false} />
        </mesh>
      ))}
      {CHART_LABELS.map((item) => (
        <Text
          key={item.t}
          position={[Math.cos(item.a) * radius * item.d, Math.sin(item.a) * radius * item.d, 0.02]}
          fontSize={radius * 0.07}
          color="#c49acc"
          fillOpacity={0.62}
          anchorX="center"
          anchorY="middle"
          characters={GLYPHS}
          toneMapped={false}
        >
          {item.t}
        </Text>
      ))}
    </group>
  );
}

function Crystal({ position, scale }) {
  return (
    <mesh position={position} scale={scale} rotation={[0, 0.4, 0.12]}>
      <octahedronGeometry args={[0.42, 0]} />
      <meshStandardMaterial
        color="#e9d5ff"
        emissive="#c026d3"
        emissiveIntensity={0.55}
        transparent
        opacity={0.62}
        roughness={0.22}
        metalness={0.18}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function SkyScene({ frozen = false, onReady }) {
  const tex = useSkyTextures();
  const { viewport, size } = useThree();
  const width = viewport.width;
  const height = viewport.height;
  const mobile = size.width < 640;
  const painted = useRef(false);
  const frames = useRef(0);
  useFrame(() => {
    if (painted.current) return;
    frames.current += 1;
    if (frames.current < 2) return;
    painted.current = true;
    onReady?.();
  });
  const puffs = useMemo(() => {
    const m = Math.min(width, height);
    return [
      { p: [-width * 0.28, height * 0.18, -2.6], s: m * 1.35, sy: 0.7, map: tex.puffHot, color: '#ff4ad8', opacity: 0.4, spd: 0.07, ph: 0.2, amp: 0.35 },
      { p: [width * 0.26, -height * 0.06, -3.4], s: m * 1.5, sy: 0.68, map: tex.puffDeep, color: '#7b2cff', opacity: 0.44, spd: 0.05, ph: 1.4, amp: 0.4 },
      { p: [width * 0.02, height * 0.28, -3.0], s: m * 1.15, sy: 0.62, map: tex.puffRose, color: '#ff9ad8', opacity: 0.28, spd: 0.06, ph: 2.1, amp: 0.28 },
      { p: [-width * 0.08, -height * 0.28, -2.3], s: m * 1.2, sy: 0.66, map: tex.puffDeep, color: '#4c1d95', opacity: 0.36, spd: 0.045, ph: 3.3, amp: 0.32 },
      { p: [width * 0.32, height * 0.22, -2.8], s: m * 1.05, sy: 0.72, map: tex.puffCyan, color: '#60a5fa', opacity: 0.18, spd: 0.055, ph: 4.0, amp: 0.3 },
      { p: [-width * 0.38, -height * 0.02, -2.5], s: m * 1.1, sy: 0.64, map: tex.puffHot, color: '#c026d3', opacity: 0.28, spd: 0.08, ph: 5.2, amp: 0.26 },
      { p: [width * 0.12, height * 0.02, -3.6], s: m * 1.4, sy: 0.75, map: tex.puffRose, color: '#e879f9', opacity: 0.24, spd: 0.04, ph: 0.8, amp: 0.38 },
      { p: [-width * 0.18, height * 0.42, -3.1], s: m * 0.95, sy: 0.6, map: tex.puffCyan, color: '#818cf8', opacity: 0.14, spd: 0.065, ph: 2.8, amp: 0.22 },
    ];
  }, [tex, width, height]);

  return (
    <>
      <Nebula frozen={frozen} />
      <ambientLight intensity={0.38} color="#d8b4fe" />
      <pointLight position={[-3, 2, 4]} intensity={11} color="#e879f9" distance={18} />
      <pointLight position={[4, -1, 3]} intensity={6} color="#c4b5fd" distance={16} />
      {puffs.map((puff, i) => (
        <CloudPuff key={i} puff={puff} frozen={frozen} />
      ))}
      <Stars
        radius={42}
        depth={28}
        count={mobile ? 1200 : 2800}
        factor={mobile ? 2.6 : 3.6}
        saturation={0.55}
        fade
        speed={frozen ? 0 : 0.7}
      />
      <Sparkles
        count={mobile ? 40 : 90}
        scale={[width * 0.95, height * 0.9, 4]}
        size={6}
        speed={frozen ? 0 : 0.35}
        opacity={0.62}
        color="#ffc4ff"
      />
      <Sparkles
        count={mobile ? 16 : 36}
        scale={[width * 0.8, height * 0.75, 3]}
        size={11}
        speed={frozen ? 0 : 0.18}
        opacity={0.48}
        color="#ffffff"
      />
      <sprite position={[width * 0.32, height * 0.32, -0.4]} scale={[1.7, 1.7, 1]} renderOrder={2}>
        <spriteMaterial map={tex.moon} transparent depthWrite={false} toneMapped={false} />
      </sprite>
      <NatalChart position={[width * 0.42, 0.05, -1.1]} radius={Math.min(width, height) * 0.55} />
      <Wheel
        position={[-width * 0.34, height * 0.22, 0.2]}
        radius={Math.min(width, height) * 0.16}
        items={['1', '2', '3', '4', '5', '6', '7', '8', '9']}
        frozen={frozen}
        speed={0.08}
      />
      <Wheel
        position={[width * 0.34, -height * 0.28, 0.2]}
        radius={Math.min(width, height) * 0.155}
        items={ZODIAC}
        frozen={frozen}
        speed={-0.06}
      />
      <Crystal position={[-width * 0.38, -height * 0.48, 0.3]} scale={[1.1, 2.1, 1.1]} />
      <Crystal position={[-width * 0.3, -height * 0.5, 0.5]} scale={[0.7, 1.4, 0.7]} />
      <Crystal position={[width * 0.36, -height * 0.5, 0.35]} scale={[0.85, 1.7, 0.85]} />
      {NUMBERS.map((item) => (
        <NumberMark key={`${item.t}-${item.x}`} item={item} width={width} height={height} tex={tex} frozen={frozen} />
      ))}
    </>
  );
}
