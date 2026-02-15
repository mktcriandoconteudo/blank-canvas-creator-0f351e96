import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CyberpunkCity = () => {
  const groupRef = useRef<THREE.Group>(null);

  const buildings = useMemo(() => {
    const arr: { x: number; z: number; w: number; h: number; d: number; hue: number; side: "left" | "right" }[] = [];

    for (let i = 0; i < 60; i++) {
      const side = i < 30 ? "left" : "right";
      const x = side === "left" ? -(12 + Math.random() * 25) : (12 + Math.random() * 25);
      const z = (i % 30) * 8 - 120;
      const w = 2 + Math.random() * 5;
      const h = 8 + Math.random() * 35;
      const d = 2 + Math.random() * 5;
      const hue = [185, 270, 30, 150, 330][Math.floor(Math.random() * 5)];
      arr.push({ x, z, w, h, d, hue, side });
    }
    return arr;
  }, []);

  const neonSigns = useMemo(() => {
    return buildings
      .filter((_, i) => i % 3 === 0)
      .map((b) => ({
        x: b.side === "left" ? b.x + b.w / 2 + 0.1 : b.x - b.w / 2 - 0.1,
        y: b.h * 0.4 + Math.random() * b.h * 0.3,
        z: b.z,
        w: 1.5 + Math.random() * 2,
        h: 0.5 + Math.random(),
        hue: [185, 270, 30, 0, 150][Math.floor(Math.random() * 5)],
      }));
  }, [buildings]);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Subtle fog color shift
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      if ((child as THREE.Mesh).material && i < 60) {
        // gentle pulse on emissive
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Fog / atmosphere */}
      <fog attach="fog" args={["hsl(240, 15%, 4%)", 30, 150]} />

      {/* Buildings */}
      {buildings.map((b, i) => (
        <mesh key={`bld-${i}`} position={[b.x, b.h / 2, b.z]} castShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial
            color={`hsl(${220 + Math.random() * 20}, 10%, ${4 + Math.random() * 4}%)`}
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>
      ))}

      {/* Window lights on buildings */}
      {buildings.map((b, i) => {
        if (i % 2 !== 0) return null;
        const windowRows = Math.floor(b.h / 2);
        return Array.from({ length: Math.min(windowRows, 8) }).map((_, j) => (
          <mesh
            key={`win-${i}-${j}`}
            position={[
              b.side === "left" ? b.x + b.w / 2 + 0.01 : b.x - b.w / 2 - 0.01,
              2 + j * 2,
              b.z,
            ]}
          >
            <planeGeometry args={[b.w * 0.6, 0.6]} />
            <meshStandardMaterial
              color={`hsl(${[50, 185, 30, 200][j % 4]}, 60%, 50%)`}
              emissive={`hsl(${[50, 185, 30, 200][j % 4]}, 60%, 50%)`}
              emissiveIntensity={0.4 + Math.random() * 0.4}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        ));
      })}

      {/* Neon signs */}
      {neonSigns.map((sign, i) => (
        <group key={`sign-${i}`}>
          <mesh position={[sign.x, sign.y, sign.z]}>
            <boxGeometry args={[sign.w, sign.h, 0.08]} />
            <meshStandardMaterial
              color={`hsl(${sign.hue}, 80%, 55%)`}
              emissive={`hsl(${sign.hue}, 80%, 55%)`}
              emissiveIntensity={3}
            />
          </mesh>
          <pointLight
            position={[sign.x, sign.y, sign.z + 1]}
            color={`hsl(${sign.hue}, 80%, 55%)`}
            intensity={0.8}
            distance={8}
          />
        </group>
      ))}

      {/* Holographic billboards */}
      {[-40, 0, 40, 80].map((z, i) => (
        <group key={`holo-${i}`}>
          <mesh position={[i % 2 === 0 ? -20 : 20, 18, z]}>
            <planeGeometry args={[8, 5]} />
            <meshStandardMaterial
              color={`hsl(${[185, 270, 30, 150][i]}, 80%, 55%)`}
              emissive={`hsl(${[185, 270, 30, 150][i]}, 80%, 55%)`}
              emissiveIntensity={2}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
          <pointLight
            position={[i % 2 === 0 ? -18 : 18, 18, z]}
            color={`hsl(${[185, 270, 30, 150][i]}, 80%, 55%)`}
            intensity={2}
            distance={15}
          />
        </group>
      ))}

      {/* Sky dome glow */}
      <mesh position={[0, 60, 0]}>
        <sphereGeometry args={[120, 16, 16]} />
        <meshBasicMaterial
          color="hsl(260, 20%, 5%)"
          side={THREE.BackSide}
        />
      </mesh>

      {/* Low-hanging volumetric fog planes */}
      {[-30, 0, 30, 60].map((z, i) => (
        <mesh key={`fog-${i}`} position={[0, 2, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[80, 15]} />
          <meshBasicMaterial
            color="hsl(240, 20%, 10%)"
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

export default CyberpunkCity;
