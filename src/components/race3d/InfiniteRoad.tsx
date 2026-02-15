import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface InfiniteRoadProps {
  speed: number;
}

const InfiniteRoad = ({ speed }: InfiniteRoadProps) => {
  const linesRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.Group>(null);
  const offsetRef = useRef(0);

  // High-quality wet asphalt
  const roadMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x0a0a0f),
    roughness: 0.2,
    metalness: 0.4,
    envMapIntensity: 1.2,
  }), []);

  // Wet overlay for reflections
  const wetMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x060810),
    roughness: 0.05,
    metalness: 0.95,
    transparent: true,
    opacity: 0.3,
    envMapIntensity: 2.5,
  }), []);

  const cyanMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#00e5ff"),
    emissive: new THREE.Color("#00e5ff"),
    emissiveIntensity: 4,
  }), []);

  const purpleMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#aa44ff"),
    emissive: new THREE.Color("#aa44ff"),
    emissiveIntensity: 4,
  }), []);

  const yellowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#ffcc00"),
    emissive: new THREE.Color("#ffcc00"),
    emissiveIntensity: 2,
  }), []);

  const dashCount = 30;
  const dashSpacing = 3;
  const postCount = 20;
  const postSpacing = 5;

  useFrame((_, delta) => {
    offsetRef.current += speed * delta;

    // Animate lane dashes
    if (linesRef.current) {
      linesRef.current.children.forEach((child, i) => {
        const baseZ = i * dashSpacing - 45;
        child.position.z = ((baseZ + offsetRef.current) % (dashCount * dashSpacing)) - 45;
      });
    }

    // Animate grid lines
    if (gridRef.current) {
      gridRef.current.children.forEach((child, i) => {
        const baseZ = i * 4 - 80;
        child.position.z = ((baseZ + offsetRef.current * 0.5) % 160) - 80;
      });
    }
  });

  return (
    <group>
      {/* Main road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} material={roadMaterial} receiveShadow>
        <planeGeometry args={[16, 300]} />
      </mesh>

      {/* Wet reflection layer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={wetMaterial} receiveShadow>
        <planeGeometry args={[16, 300]} />
      </mesh>

      {/* Shoulder / curb - left */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-9, -0.015, 0]}>
        <planeGeometry args={[4, 300]} />
        <meshStandardMaterial color={0x050508} roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Shoulder / curb - right */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9, -0.015, 0]}>
        <planeGeometry args={[4, 300]} />
        <meshStandardMaterial color={0x050508} roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Lane dashes */}
      <group ref={linesRef}>
        {Array.from({ length: dashCount }).map((_, i) => (
          <mesh key={`dash-${i}`} position={[0, 0.01, i * dashSpacing - 45]} material={yellowMat}>
            <boxGeometry args={[0.12, 0.015, 1.5]} />
          </mesh>
        ))}
      </group>

      {/* Left neon rail - continuous strip */}
      <mesh position={[-7.5, 0.2, 0]} material={cyanMat}>
        <boxGeometry args={[0.06, 0.4, 300]} />
      </mesh>
      <mesh position={[-7.3, 0.02, 0]}>
        <boxGeometry args={[0.5, 0.01, 300]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.5} transparent opacity={0.3} />
      </mesh>

      {/* Right neon rail */}
      <mesh position={[7.5, 0.2, 0]} material={purpleMat}>
        <boxGeometry args={[0.06, 0.4, 300]} />
      </mesh>
      <mesh position={[7.3, 0.02, 0]}>
        <boxGeometry args={[0.5, 0.01, 300]} />
        <meshStandardMaterial color="#aa44ff" emissive="#aa44ff" emissiveIntensity={0.5} transparent opacity={0.3} />
      </mesh>

      {/* Barrier posts with lights - left */}
      {Array.from({ length: postCount }).map((_, i) => (
        <group key={`lp-${i}`}>
          <mesh position={[-7.5, 0.6, i * postSpacing - 50]} material={cyanMat}>
            <boxGeometry args={[0.1, 1.2, 0.1]} />
          </mesh>
          <pointLight position={[-7.5, 1, i * postSpacing - 50]} color="#00e5ff" intensity={0.8} distance={5} />
        </group>
      ))}

      {/* Barrier posts with lights - right */}
      {Array.from({ length: postCount }).map((_, i) => (
        <group key={`rp-${i}`}>
          <mesh position={[7.5, 0.6, i * postSpacing - 50]} material={purpleMat}>
            <boxGeometry args={[0.1, 1.2, 0.1]} />
          </mesh>
          <pointLight position={[7.5, 1, i * postSpacing - 50]} color="#aa44ff" intensity={0.8} distance={5} />
        </group>
      ))}

      {/* Speed grid lines on road */}
      <group ref={gridRef}>
        {Array.from({ length: 40 }).map((_, i) => (
          <mesh key={`grid-${i}`} position={[0, 0.003, i * 4 - 80]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[15, 0.02]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={0.3}
              transparent
              opacity={0.06}
            />
          </mesh>
        ))}
      </group>

      {/* Puddle reflections (random reflective patches) */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={`puddle-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[(Math.random() - 0.5) * 12, 0.002, i * 12 - 60]}
        >
          <circleGeometry args={[0.8 + Math.random() * 1.5, 16]} />
          <meshStandardMaterial
            color={0x000510}
            roughness={0.02}
            metalness={1}
            transparent
            opacity={0.4}
            envMapIntensity={3}
          />
        </mesh>
      ))}
    </group>
  );
};

export default InfiniteRoad;
