import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Car3DProps {
  position: [number, number, number];
  color: "cyan" | "red";
  isRacing: boolean;
  nitroActive?: boolean;
}

const Car3D = ({ position, color, isRacing, nitroActive = false }: Car3DProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);

  const bodyColor = color === "cyan" ? "hsl(200, 80%, 25%)" : "hsl(0, 70%, 30%)";
  const accentColor = color === "cyan" ? "hsl(185, 80%, 55%)" : "hsl(0, 70%, 55%)";
  const neonColor = color === "cyan" ? "hsl(185, 90%, 60%)" : "hsl(350, 80%, 55%)";

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(bodyColor),
    roughness: 0.2,
    metalness: 0.85,
  }), [bodyColor]);

  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(accentColor),
    emissive: new THREE.Color(accentColor),
    emissiveIntensity: 1.5,
    roughness: 0.3,
    metalness: 0.5,
  }), [accentColor]);

  const glassMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("hsl(200, 30%, 15%)"),
    roughness: 0.05,
    metalness: 0.9,
    transparent: true,
    opacity: 0.7,
  }), []);

  const headlightMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("hsl(60, 90%, 80%)"),
    emissive: new THREE.Color("hsl(60, 90%, 80%)"),
    emissiveIntensity: 3,
  }), []);

  const taillightMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("hsl(0, 90%, 50%)"),
    emissive: new THREE.Color("hsl(0, 90%, 50%)"),
    emissiveIntensity: 3,
  }), []);

  const nitroFlameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("hsl(210, 100%, 60%)"),
    emissive: new THREE.Color("hsl(210, 100%, 70%)"),
    emissiveIntensity: 5,
    transparent: true,
    opacity: 0.8,
  }), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Subtle side-to-side wobble while racing
    if (isRacing) {
      groupRef.current.rotation.z = Math.sin(t * 8) * 0.01;
      groupRef.current.position.y = position[1] + Math.sin(t * 12) * 0.01;
    }

    // Nitro flame animation
    if (flameRef.current) {
      if (nitroActive) {
        flameRef.current.visible = true;
        flameRef.current.scale.z = 1 + Math.sin(t * 30) * 0.5;
        flameRef.current.scale.x = 0.8 + Math.sin(t * 25) * 0.3;
      } else {
        flameRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Car body - lower chassis */}
      <mesh material={bodyMat} position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1.8, 0.35, 4.2]} />
      </mesh>

      {/* Car body - upper cabin */}
      <mesh material={bodyMat} position={[0, 0.5, -0.2]} castShadow>
        <boxGeometry args={[1.5, 0.3, 2.0]} />
      </mesh>

      {/* Windshield */}
      <mesh material={glassMat} position={[0, 0.55, 0.8]}>
        <boxGeometry args={[1.4, 0.25, 0.5]} />
      </mesh>

      {/* Rear window */}
      <mesh material={glassMat} position={[0, 0.55, -1.1]}>
        <boxGeometry args={[1.4, 0.2, 0.4]} />
      </mesh>

      {/* Accent stripe */}
      <mesh material={accentMat} position={[0, 0.39, 0]}>
        <boxGeometry args={[0.3, 0.02, 4.3]} />
      </mesh>

      {/* Side skirts */}
      <mesh material={accentMat} position={[-0.92, 0.12, 0]}>
        <boxGeometry args={[0.05, 0.1, 3.8]} />
      </mesh>
      <mesh material={accentMat} position={[0.92, 0.12, 0]}>
        <boxGeometry args={[0.05, 0.1, 3.8]} />
      </mesh>

      {/* Spoiler */}
      <mesh material={accentMat} position={[0, 0.65, -2.0]}>
        <boxGeometry args={[1.8, 0.05, 0.3]} />
      </mesh>
      <mesh material={bodyMat} position={[-0.6, 0.5, -1.9]}>
        <boxGeometry args={[0.08, 0.3, 0.15]} />
      </mesh>
      <mesh material={bodyMat} position={[0.6, 0.5, -1.9]}>
        <boxGeometry args={[0.08, 0.3, 0.15]} />
      </mesh>

      {/* Wheels */}
      {[[-0.85, 0.15, 1.3], [0.85, 0.15, 1.3], [-0.85, 0.15, -1.3], [0.85, 0.15, -1.3]].map((pos, i) => (
        <mesh key={`wheel-${i}`} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.2, 12]} />
          <meshStandardMaterial color="hsl(0, 0%, 15%)" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}

      {/* Headlights */}
      <mesh material={headlightMat} position={[-0.6, 0.25, 2.12]}>
        <boxGeometry args={[0.35, 0.12, 0.05]} />
      </mesh>
      <mesh material={headlightMat} position={[0.6, 0.25, 2.12]}>
        <boxGeometry args={[0.35, 0.12, 0.05]} />
      </mesh>

      {/* Taillights */}
      <mesh material={taillightMat} position={[-0.65, 0.3, -2.12]}>
        <boxGeometry args={[0.4, 0.08, 0.05]} />
      </mesh>
      <mesh material={taillightMat} position={[0.65, 0.3, -2.12]}>
        <boxGeometry args={[0.4, 0.08, 0.05]} />
      </mesh>

      {/* Underglow neon */}
      <pointLight
        position={[0, 0.05, 0]}
        color={neonColor}
        intensity={1.2}
        distance={4}
      />

      {/* Headlight cone */}
      <spotLight
        position={[0, 0.3, 2.5]}
        target-position={[0, 0, 10]}
        color="hsl(50, 80%, 80%)"
        intensity={2}
        distance={15}
        angle={0.5}
        penumbra={0.5}
      />

      {/* Taillight glow */}
      <pointLight
        position={[0, 0.3, -2.2]}
        color="hsl(0, 90%, 50%)"
        intensity={1}
        distance={3}
      />

      {/* Nitro flame */}
      <mesh ref={flameRef} material={nitroFlameMat} position={[0, 0.2, -2.8]} visible={false}>
        <coneGeometry args={[0.3, 1.5, 8]} />
      </mesh>
      {nitroActive && (
        <pointLight
          position={[0, 0.2, -3.5]}
          color="hsl(210, 100%, 70%)"
          intensity={4}
          distance={6}
        />
      )}
    </group>
  );
};

export default Car3D;
