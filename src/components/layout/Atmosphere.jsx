import { Component, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import SkyScene from './SkyScene';

const SKY_SRC = '/atmosphere/sky.mp4';

function canWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

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

function VideoSky({ onReady }) {
  return (
    <video
      className="atm-video"
      src={SKY_SRC}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onPlaying={() => onReady?.()}
      onCanPlay={() => onReady?.()}
      onError={() => onReady?.()}
    />
  );
}

function Kick({ live, onReady }) {
  const invalidate = useThree((s) => s.invalidate);
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    onReady?.();
  });
  useEffect(() => {
    if (!live) invalidate();
  }, [live, invalidate]);
  return null;
}

export default function Atmosphere({ onReady }) {
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  const fired = useRef(false);

  const markReady = () => {
    if (fired.current) return;
    fired.current = true;
    readyRef.current?.();
  };
  const [webgl] = useState(canWebGL);
  const [live, setLive] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setLive(document.visibilityState === 'visible' && !reduced.matches);
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
    };
  }, []);

  return (
    <div className="atm" aria-hidden>
      {webgl ? (
        <WebGLGuard fallback={<VideoSky onReady={markReady} />}>
          <Canvas
            className="atm-canvas"
            frameloop={live ? 'always' : 'demand'}
            dpr={[1, 1.2]}
            flat
            gl={{
              antialias: false,
              alpha: false,
              powerPreference: 'high-performance',
              toneMapping: THREE.NoToneMapping,
            }}
            camera={{ position: [0, 0, 6.2], fov: 50 }}
            onCreated={() => markReady()}
          >
            <color attach="background" args={['#140428']} />
            <Suspense fallback={null}>
              <Kick live={live} onReady={markReady} />
              <SkyScene frozen={!live} />
            </Suspense>
          </Canvas>
        </WebGLGuard>
      ) : (
        <VideoSky onReady={markReady} />
      )}
    </div>
  );
}
