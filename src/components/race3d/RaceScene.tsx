import { Canvas } from "@react-three/fiber";
import { Environment, Preload } from "@react-three/drei";
import { Suspense } from "react";
import InfiniteRoad from "./InfiniteRoad";
import Car3D from "./Car3D";
import CyberpunkCity from "./CyberpunkCity";
import ChaseCamera from "./ChaseCamera";
import PostEffects from "./PostEffects";
import carPlayerImg from "@/assets/car-player-3d.png";
import carOpponentImg from "@/assets/car-opponent-3d.png";

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
  const speed = isRacing ? 18 + (playerProgress / 100) * 15 : raceState === "finished" ? 3 : 0;

  // Cars stay in place, road moves
  const playerX = 2.8;
  const opponentX = -2.8;
  const diff = (playerProgress - opponentProgress) * 0.2;
  const playerZ = 0;
  const opponentZ = -diff;

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        toneMapping: 3,
        toneMappingExposure: 0.7,
        powerPreference: "high-performance",
      }}
      camera={{ fov: 65, near: 0.1, far: 400, position: [0, 6, -12] }}
      style={{ background: "#030308" }}
    >
      <Suspense fallback={null}>
        {/* Minimal ambient */}
        <ambientLight intensity={0.05} color="#1a1a3a" />

        {/* Moonlight */}
        <directionalLight
          position={[15, 30, 20]}
          intensity={0.12}
          color="#4466aa"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* Camera */}
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
          textureSrc={carPlayerImg}
        />

        {/* Opponent car */}
        <Car3D
          position={[opponentX, 0, opponentZ]}
          color="red"
          isRacing={isRacing}
          textureSrc={carOpponentImg}
        />

        {/* City */}
        <CyberpunkCity />

        {/* Environment reflections */}
        <Environment preset="night" />

        {/* Post-processing */}
        <PostEffects nitroActive={nitroActive} />

        <Preload all />
      </Suspense>
    </Canvas>
  );
};

export default RaceScene;
