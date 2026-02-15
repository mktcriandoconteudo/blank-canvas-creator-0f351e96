import { useMemo } from "react";
import * as THREE from "three";

const CyberpunkCity = () => {
  const buildings = useMemo(() => {
    const arr: { x: number; z: number; w: number; h: number; d: number; hue: number }[] = [];
    for (let i = 0; i < 80; i++) {
      const side = i < 40 ? -1 : 1;
      const x = side * (14 + Math.random() * 30);
      const z = (i % 40) * 6 - 120;
      const w = 2 + Math.random() * 6;
      const h = 10 + Math.random() * 50;
      const d = 2 + Math.random() * 6;
      const hue = [185, 270, 30, 150, 0][Math.floor(Math.random() * 5)];
      arr.push({ x, z, w, h, d, hue });
    }
    return arr;
  }, []);

  const neonSigns = useMemo(() => {
    return buildings.filter((_, i) => i % 4 === 0).map((b) => ({
      x: b.x > 0 ? b.x - b.w / 2 - 0.05 : b.x + b.w / 2 + 0.05,
      y: 5 + Math.random() * b.h * 0.5,
      z: b.z,
      w: 1.5 + Math.random() * 3,
      h: 0.4 + Math.random() * 1.2,
      hue: b.hue,
      facing: b.x > 0 ? -1 : 1,
    }));
  }, [buildings]);

  return (
    <group>
      {/* Sky dome */}
      <mesh>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial color="#030308" side={THREE.BackSide} />
      </mesh>

      {/* Fog */}
      <fog attach="fog" args={["#050510", 40, 180]} />

      {/* Buildings */}
      {buildings.map((b, i) => (
        <mesh key={`b-${i}`} position={[b.x, b.h / 2, b.z]} castShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial
            color={`hsl(${230 + (i % 20)}, 8%, ${3 + (i % 3)}%)`}
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>
      ))}

      {/* Window strips on buildings */}
      {buildings.filter((_, i) => i % 2 === 0).map((b, i) => {
        const rows = Math.min(Math.floor(b.h / 3), 10);
        const faceX = b.x > 0 ? b.x - b.w / 2 - 0.01 : b.x + b.w / 2 + 0.01;
        return Array.from({ length: rows }).map((_, j) => (
          <mesh key={`w-${i}-${j}`} position={[faceX, 3 + j * 3, b.z]} rotation={[0, b.x > 0 ? Math.PI : 0, 0]}>
            <planeGeometry args={[b.w * 0.8, 0.4]} />
            <meshStandardMaterial
              color={`hsl(${[50, 185, 30, 270, 0][j % 5]}, 50%, 45%)`}
              emissive={`hsl(${[50, 185, 30, 270, 0][j % 5]}, 50%, 45%)`}
              emissiveIntensity={0.6}
              transparent
              opacity={0.5 + Math.random() * 0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        ));
      })}

      {/* Neon signs */}
      {neonSigns.map((s, i) => (
        <group key={`sign-${i}`}>
          <mesh position={[s.x, s.y, s.z]} rotation={[0, s.facing > 0 ? 0 : Math.PI, 0]}>
            <boxGeometry args={[s.w, s.h, 0.06]} />
            <meshStandardMaterial
              color={`hsl(${s.hue}, 80%, 55%)`}
              emissive={`hsl(${s.hue}, 80%, 55%)`}
              emissiveIntensity={4}
            />
          </mesh>
          <pointLight position={[s.x + s.facing * 0.5, s.y, s.z]} color={`hsl(${s.hue}, 80%, 55%)`} intensity={1.2} distance={10} />
        </group>
      ))}

      {/* Giant holographic billboards */}
      {[
        { pos: [-25, 25, -40] as [number, number, number], hue: 185, w: 12, h: 7 },
        { pos: [28, 30, 0] as [number, number, number], hue: 270, w: 10, h: 6 },
        { pos: [-22, 20, 50] as [number, number, number], hue: 30, w: 14, h: 8 },
        { pos: [30, 35, 80] as [number, number, number], hue: 150, w: 11, h: 7 },
      ].map((bb, i) => (
        <group key={`holo-${i}`}>
          <mesh position={bb.pos}>
            <planeGeometry args={[bb.w, bb.h]} />
            <meshStandardMaterial
              color={`hsl(${bb.hue}, 80%, 55%)`}
              emissive={`hsl(${bb.hue}, 80%, 55%)`}
              emissiveIntensity={3}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
          <pointLight position={bb.pos} color={`hsl(${bb.hue}, 80%, 55%)`} intensity={3} distance={20} />
        </group>
      ))}

      {/* Ground below road (city ground) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#020205" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Atmospheric fog planes */}
      {[-50, -20, 10, 40, 70, 100].map((z, i) => (
        <mesh key={`atm-${i}`} position={[0, 3, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[120, 20]} />
          <meshBasicMaterial color="#0a0515" transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

export default CyberpunkCity;
