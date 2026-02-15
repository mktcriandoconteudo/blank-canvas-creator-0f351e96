import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import InfiniteRoad from "./InfiniteRoad";
import Car3D from "./Car3D";
import CyberpunkCity from "./CyberpunkCity";
import ChaseCamera from "./ChaseCamera";
import PostEffects from "./PostEffects";

interface RaceSceneProps {
  playerProgress: number;
  opponentProgress: number;
  raceState: "countdown" | "racing" | "finished";
  cameraShake: boolean;
  nitroActive: boolean;
}

const RaceScene = ({
  playerProgress,
  opponentProgress,
  raceState,
  cameraShake,
  nitroActive,
}: RaceSceneProps) => {
  const isRacing = raceState === "racing";
  const speed = isRacing ? 15 + (playerProgress / 100) * 10 : 0;

  // Cars stay in scene, road moves.
  // Player in right lane, opponent in left
  const playerX = 2.5;
  const opponentX = -2.5;

  // Relative z offset based on who's ahead
  const diff = (playerProgress - opponentProgress) * 0.15;
  const playerZ = 0;
  const opponentZ = -diff;

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        toneMapping: 3, // ACESFilmic
        toneMappingExposure: 0.8,
      }}
      camera={{ fov: 65, near: 0.1, far: 300, position: [0, 6, -12] }}
      style={{ background: "hsl(240, 15%, 3%)" }}
    >
      {/* Ambient light (very dim) */}
      <ambientLight intensity={0.08} color="hsl(240, 20%, 30%)" />

      {/* Directional moonlight */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.15}
        color="hsl(220, 30%, 70%)"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Chase camera */}
      <ChaseCamera
        playerZ={playerZ}
        playerX={playerX}
        shaking={cameraShake}
        nitroActive={nitroActive}
      />

      {/* Road */}
      <InfiniteRoad speed={speed} />

      {/* Player car */}
      <Car3D
        position={[playerX, 0, playerZ]}
        color="cyan"
        isRacing={isRacing}
        nitroActive={nitroActive}
      />

      {/* Opponent car */}
      <Car3D
        position={[opponentX, 0, opponentZ]}
        color="red"
        isRacing={isRacing}
      />

      {/* City backdrop */}
      <CyberpunkCity />

      {/* Environment for reflections */}
      <Environment preset="night" />

      {/* Post-processing */}
      <PostEffects nitroActive={nitroActive} />
    </Canvas>
  );
};

export default RaceScene;
