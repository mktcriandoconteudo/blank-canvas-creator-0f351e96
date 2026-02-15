import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface InfiniteRoadProps {
  speed: number;
}

const InfiniteRoad = ({ speed }: InfiniteRoadProps) => {
  const roadRef = useRef<THREE.Mesh>(null);
  const linesRef = useRef<THREE.Group>(null);
  const offsetRef = useRef(0);

  // Asphalt material with subtle reflections
  const roadMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("hsl(220, 10%, 6%)"),
      roughness: 0.35,
      metalness: 0.15,
      envMapIntensity: 0.6,
    });
  }, []);

  // Lane divider material (emissive yellow)
  const laneMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("hsl(50, 70%, 50%)"),
      emissive: new THREE.Color("hsl(50, 70%, 50%)"),
      emissiveIntensity: 0.8,
    });
  }, []);

  // Neon edge materials
  const cyanMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("hsl(185, 80%, 55%)"),
      emissive: new THREE.Color("hsl(185, 80%, 55%)"),
      emissiveIntensity: 2.5,
    });
  }, []);

  const purpleMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("hsl(270, 60%, 60%)"),
      emissive: new THREE.Color("hsl(270, 60%, 60%)"),
      emissiveIntensity: 2.5,
    });
  }, []);

  // Create dashed lane segments
  const dashSegments = useMemo(() => {
    const segments: { z: number }[] = [];
    for (let i = 0; i < 30; i++) {
      segments.push({ z: i * 3 - 45 });
    }
    return segments;
  }, []);

  // Neon barrier posts
  const barrierPosts = useMemo(() => {
    const posts: { z: number }[] = [];
    for (let i = 0; i < 20; i++) {
      posts.push({ z: i * 5 - 50 });
    }
    return posts;
  }, []);

  useFrame((_, delta) => {
    offsetRef.current += speed * delta;
    const mod = 3; // lane dash repeat distance

    // Animate lane dashes
    if (linesRef.current) {
      linesRef.current.children.forEach((child, i) => {
        const baseZ = (i % dashSegments.length) * mod - 45;
        child.position.z = ((baseZ + offsetRef.current) % (dashSegments.length * mod)) - 45;
      });
    }
  });

  return (
    <group>
      {/* Main road surface */}
      <mesh
        ref={roadRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        material={roadMaterial}
        receiveShadow
      >
        <planeGeometry args={[14, 200]} />
      </mesh>

      {/* Wet reflection plane (slightly above road) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[14, 200]} />
        <meshStandardMaterial
          color="hsl(200, 15%, 8%)"
          transparent
          opacity={0.15}
          roughness={0.05}
          metalness={0.9}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Lane dashes */}
      <group ref={linesRef}>
        {dashSegments.map((seg, i) => (
          <mesh
            key={`dash-${i}`}
            position={[0, 0.02, seg.z]}
            material={laneMat}
          >
            <boxGeometry args={[0.15, 0.02, 1.2]} />
          </mesh>
        ))}
      </group>

      {/* Left neon edge rail */}
      <mesh position={[-7, 0.15, 0]} material={cyanMat}>
        <boxGeometry args={[0.08, 0.3, 200]} />
      </mesh>

      {/* Right neon edge rail */}
      <mesh position={[7, 0.15, 0]} material={purpleMat}>
        <boxGeometry args={[0.08, 0.3, 200]} />
      </mesh>

      {/* Barrier posts left */}
      {barrierPosts.map((post, i) => (
        <group key={`lpost-${i}`}>
          <mesh position={[-7, 0.5, post.z]} material={cyanMat}>
            <boxGeometry args={[0.12, 1, 0.12]} />
          </mesh>
          <pointLight
            position={[-7, 0.8, post.z]}
            color="hsl(185, 80%, 55%)"
            intensity={0.5}
            distance={4}
          />
        </group>
      ))}

      {/* Barrier posts right */}
      {barrierPosts.map((post, i) => (
        <group key={`rpost-${i}`}>
          <mesh position={[7, 0.5, post.z]} material={purpleMat}>
            <boxGeometry args={[0.12, 1, 0.12]} />
          </mesh>
          <pointLight
            position={[7, 0.8, post.z]}
            color="hsl(270, 60%, 60%)"
            intensity={0.5}
            distance={4}
          />
        </group>
      ))}

      {/* Ground grid lines (speed effect) */}
      {Array.from({ length: 40 }).map((_, i) => (
        <mesh
          key={`grid-${i}`}
          position={[0, 0.005, i * 5 - 100]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[14, 0.03]} />
          <meshStandardMaterial
            color="hsl(185, 60%, 40%)"
            emissive="hsl(185, 60%, 40%)"
            emissiveIntensity={0.5}
            transparent
            opacity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
};

export default InfiniteRoad;
