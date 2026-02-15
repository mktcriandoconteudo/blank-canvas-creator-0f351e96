import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

interface Car3DProps {
  position: [number, number, number];
  color: "cyan" | "red";
  isRacing: boolean;
  nitroActive?: boolean;
  textureSrc: string;
}

const Car3D = ({ position, color, isRacing, nitroActive = false, textureSrc }: Car3DProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const flameRef2 = useRef<THREE.Mesh>(null);

  const texture = useTexture(textureSrc);

  const neonColor = color === "cyan" ? "hsl(185, 90%, 60%)" : "hsl(350, 80%, 55%)";
  const neonHex = color === "cyan" ? "#00d4ff" : "#ff3355";

  // Sprite material with transparency
  const spriteMat = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    return mat;
  }, [texture]);

  const flameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(nitroActive ? "hsl(210, 100%, 60%)" : "hsl(30, 100%, 50%)"),
    emissive: new THREE.Color(nitroActive ? "hsl(210, 100%, 70%)" : "hsl(30, 100%, 60%)"),
    emissiveIntensity: 5,
    transparent: true,
    opacity: 0.85,
  }), [nitroActive]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Subtle wobble
    if (isRacing) {
      groupRef.current.position.y = position[1] + Math.sin(t * 10) * 0.015;
      groupRef.current.position.x = position[0] + Math.sin(t * 6) * 0.03;
    }

    // Flame animation
    [flameRef, flameRef2].forEach((ref, i) => {
      if (ref.current) {
        const show = isRacing;
        ref.current.visible = show;
        if (show) {
          const scale = nitroActive ? 1.5 + Math.sin(t * 30 + i) * 0.5 : 0.4 + Math.sin(t * 15 + i) * 0.2;
          ref.current.scale.set(0.15 + i * 0.05, scale, 0.15 + i * 0.05);
          ref.current.material = flameMat;
        }
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Car sprite billboard - facing camera */}
      <mesh
        material={spriteMat}
        position={[0, 1.8, 0]}
      >
        <planeGeometry args={[5.5, 2.75]} />
      </mesh>

      {/* Underglow light on asphalt */}
      <pointLight
        position={[0, 0.1, 0]}
        color={neonHex}
        intensity={2}
        distance={6}
        decay={2}
      />

      {/* Headlight projection forward */}
      <spotLight
        position={[0, 0.5, 3]}
        color="hsl(50, 80%, 85%)"
        intensity={3}
        distance={20}
        angle={0.4}
        penumbra={0.6}
        castShadow={false}
      />

      {/* Taillight glow */}
      <pointLight
        position={[0, 0.8, -1.5]}
        color={color === "cyan" ? "#00aaff" : "#ff2200"}
        intensity={1.5}
        distance={4}
      />

      {/* Exhaust flames */}
      <mesh ref={flameRef} position={[-0.4, 0.4, -2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 1, 6]} />
        <meshStandardMaterial
          color="hsl(30, 100%, 50%)"
          emissive="hsl(30, 100%, 60%)"
          emissiveIntensity={3}
          transparent
          opacity={0.8}
        />
      </mesh>
      <mesh ref={flameRef2} position={[0.4, 0.4, -2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 1, 6]} />
        <meshStandardMaterial
          color="hsl(30, 100%, 50%)"
          emissive="hsl(30, 100%, 60%)"
          emissiveIntensity={3}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Nitro boost intense light */}
      {nitroActive && (
        <>
          <pointLight
            position={[0, 0.5, -3]}
            color="#4488ff"
            intensity={8}
            distance={10}
          />
          <pointLight
            position={[0, 0.2, -1]}
            color="#00ccff"
            intensity={3}
            distance={5}
          />
        </>
      )}
    </group>
  );
};

export default Car3D;
