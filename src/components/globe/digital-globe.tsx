"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";

import { cn } from "@/lib/utils";

interface DigitalGlobeProps {
  className?: string;
  pointCount?: number;
}

interface GlobeSceneProps {
  pointCount: number;
  reducedMotion: boolean;
  pointer: { x: number; y: number };
}

const CONTINENT_MASKS = [
  { lat: 46, lon: -102, latRadius: 24, lonRadius: 46 },
  { lat: 18, lon: -88, latRadius: 16, lonRadius: 20 },
  { lat: -16, lon: -59, latRadius: 34, lonRadius: 18 },
  { lat: 52, lon: 12, latRadius: 16, lonRadius: 24 },
  { lat: 6, lon: 20, latRadius: 35, lonRadius: 24 },
  { lat: 36, lon: 76, latRadius: 27, lonRadius: 54 },
  { lat: 12, lon: 105, latRadius: 18, lonRadius: 25 },
  { lat: -25, lon: 134, latRadius: 14, lonRadius: 20 },
  { lat: 72, lon: -42, latRadius: 9, lonRadius: 16 },
];

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function normalizeLongitudeDelta(delta: number) {
  return ((((delta + 180) % 360) + 360) % 360) - 180;
}

function isLikelyLand(lat: number, lon: number) {
  return CONTINENT_MASKS.some((mask) => {
    const latScore = (lat - mask.lat) / mask.latRadius;
    const lonScore = normalizeLongitudeDelta(lon - mask.lon) / mask.lonRadius;
    return latScore * latScore + lonScore * lonScore <= 1;
  });
}

function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createContinentPointGeometry(count: number) {
  const random = seededRandom(1473);
  const positions: number[] = [];
  const colors: number[] = [];
  const color = new THREE.Color();
  const radius = 1.92;
  let attempts = 0;

  while (positions.length / 3 < count && attempts < count * 160) {
    attempts += 1;

    const lat = THREE.MathUtils.radToDeg(Math.asin(random() * 2 - 1));
    const lon = random() * 360 - 180;
    if (!isLikelyLand(lat, lon)) continue;

    const jittered = latLonToVector3(
      lat + (random() - 0.5) * 0.8,
      lon + (random() - 0.5) * 0.8,
      radius + random() * 0.035
    );

    positions.push(jittered.x, jittered.y, jittered.z);

    const mix = random();
    color.setRGB(0.08 + mix * 0.08, 0.46 + mix * 0.28, 1);
    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();

  return geometry;
}

function GlobeScene({ pointCount, reducedMotion, pointer }: GlobeSceneProps) {
  const groupRef = React.useRef<THREE.Group>(null);
  const pointsGeometry = React.useMemo(
    () => createContinentPointGeometry(pointCount),
    [pointCount]
  );

  React.useEffect(() => {
    return () => {
      pointsGeometry.dispose();
    };
  }, [pointsGeometry]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    group.rotation.y += delta * (reducedMotion ? 0.008 : 0.06);

    if (!reducedMotion) {
      group.rotation.x += (pointer.y * -0.14 - group.rotation.x) * 0.035;
      group.rotation.z += (pointer.x * -0.08 - group.rotation.z) * 0.035;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.08, -0.55, 0]}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 3, 5]} intensity={1.55} color="#d9f5ff" />
      <pointLight position={[-3, -1, 4]} intensity={1.35} color="#1473ff" />

      <mesh>
        <sphereGeometry args={[1.86, 96, 96]} />
        <meshStandardMaterial
          color="#031837"
          emissive="#061f52"
          emissiveIntensity={0.38}
          metalness={0.12}
          roughness={0.72}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[1.875, 48, 48]} />
        <meshBasicMaterial
          color="#1b7cff"
          wireframe
          transparent
          opacity={0.085}
          depthWrite={false}
        />
      </mesh>

      <points geometry={pointsGeometry}>
        <pointsMaterial
          vertexColors
          size={0.018}
          sizeAttenuation
          transparent
          opacity={0.92}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <mesh scale={1.14}>
        <sphereGeometry args={[1.9, 64, 64]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.11}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function usePointerParallax() {
  const [pointer, setPointer] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    let frame = 0;

    const onPointerMove = (event: PointerEvent) => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setPointer({
          x: event.clientX / window.innerWidth - 0.5,
          y: event.clientY / window.innerHeight - 0.5,
        });
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return pointer;
}

export function DigitalGlobe({ className, pointCount }: DigitalGlobeProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const pointer = usePointerParallax();
  const resolvedPointCount =
    pointCount ?? (reducedMotion ? 1200 : isMobile ? 2200 : 8200);

  return (
    <div
      className={cn("pointer-events-none relative size-full", className)}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5.4], fov: 42 }}
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
          stencil: false,
          depth: true,
        }}
      >
        <AdaptiveDpr pixelated />
        <GlobeScene
          pointCount={resolvedPointCount}
          pointer={pointer}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  );
}

export default DigitalGlobe;
