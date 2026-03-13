import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef } from "react";

type SliceProps = {
  texture: THREE.Texture;
  uvOffset: [number, number];
  uvRepeat: [number, number];
  targetX: number;
  delay: number;
};

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function LogoSlice({ texture, uvOffset, uvRepeat, targetX, delay }: SliceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const start = useRef<number | null>(null);

  const material = useMemo(() => {
    const t = texture.clone();
    t.needsUpdate = true;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.offset.set(uvOffset[0], uvOffset[1]);
    t.repeat.set(uvRepeat[0], uvRepeat[1]);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      map: t,
      transparent: true,
      roughness: 0.65,
      metalness: 0.1,
    });
  }, [texture, uvOffset, uvRepeat]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const now = state.clock.elapsedTime;
    if (start.current == null) start.current = now;
    const t = Math.max(0, now - start.current - delay);
    const duration = 1.0;
    const p = Math.min(1, t / duration);
    const e = easeOutCubic(p);

    const fromX = -3.2;
    const fromZ = -0.6;
    meshRef.current.position.x = THREE.MathUtils.lerp(fromX, targetX, e);
    meshRef.current.position.z = THREE.MathUtils.lerp(fromZ, 0, e);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(0.55, 0, e);
    meshRef.current.rotation.x = THREE.MathUtils.lerp(-0.15, 0, e);

    // subtle "snap" at end
    if (p === 1) {
      meshRef.current.position.x = targetX;
      meshRef.current.position.z = 0;
      meshRef.current.rotation.set(0, 0, 0);
    }
  });

  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[1.15, 1.15]} />
    </mesh>
  );
}

function Candles() {
  const groupRef = useRef<THREE.Group>(null);

  const candles = useMemo(() => {
    const count = 18;
    return Array.from({ length: count }).map((_, i) => {
      // deterministic pseudo-random
      const seed = i * 9973;
      const rand = (n: number) => {
        const x = Math.sin(seed + n) * 10000;
        return x - Math.floor(x);
      };
      const open = rand(1) * 0.7 - 0.35;
      const close = open + (rand(2) * 0.7 - 0.35);
      const high = Math.max(open, close) + rand(3) * 0.25;
      const low = Math.min(open, close) - rand(4) * 0.25;
      const bullish = close >= open;
      return {
        x: -1.7 + i * 0.2,
        open,
        close,
        high,
        low,
        bullish,
      };
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    // gentle breathing motion
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 0.6) * 0.05;
  });

  return (
    <group ref={groupRef} position={[0, -0.35, 0]}>
      {candles.map((c, idx) => {
        const bodyY = (c.open + c.close) / 2;
        const bodyH = Math.max(0.06, Math.abs(c.close - c.open));
        const wickY = (c.high + c.low) / 2;
        const wickH = Math.max(0.08, c.high - c.low);
        const color = c.bullish ? "#22c55e" : "#ef4444";
        return (
          <group key={idx} position={[c.x, 0, 0]}>
            <mesh position={[0, wickY, -0.02]}>
              <boxGeometry args={[0.03, wickH, 0.03]} />
              <meshStandardMaterial color={color} roughness={0.65} metalness={0.05} />
            </mesh>
            <mesh position={[0, bodyY, 0]}>
              <boxGeometry args={[0.12, bodyH, 0.08]} />
              <meshStandardMaterial color={color} roughness={0.5} metalness={0.08} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Scene() {
  const { viewport } = useThree();
  const logoTex = useTexture("/src/assets/logo.png");

  const slices = useMemo(() => {
    // split logo into 5 vertical slices
    const n = 5;
    return Array.from({ length: n }).map((_, i) => {
      const repeatX = 1 / n;
      const offsetX = i * repeatX;
      return {
        uvOffset: [offsetX, 0] as [number, number],
        uvRepeat: [repeatX, 1] as [number, number],
        targetX: -0.85 + i * 0.42,
        delay: i * 0.08,
      };
    });
  }, []);

  return (
    <group scale={Math.min(1.1, viewport.width / 6)}>
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 3, 2]} intensity={1.1} />
      <pointLight position={[-3, 1.5, 2]} intensity={0.6} />

      {/* Candles in the middle (classic trading vibe) */}
      <Candles />

      {/* Assembling logo slices left → right */}
      <group position={[0, 0.55, 0]}>
        {slices.map((s, idx) => (
          <LogoSlice
            key={idx}
            texture={logoTex}
            uvOffset={s.uvOffset}
            uvRepeat={s.uvRepeat}
            targetX={s.targetX}
            delay={s.delay}
          />
        ))}
      </group>
    </group>
  );
}

export default function LoginHeroAnimation() {
  return (
    <div className="w-full h-full">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 3.2], fov: 45 }}
      >
        <color attach="background" args={["#000000"]} />
        <Scene />
      </Canvas>
    </div>
  );
}

