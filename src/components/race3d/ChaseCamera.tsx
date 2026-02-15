import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface ChaseCameraProps {
  playerZ: number;
  playerX: number;
  shaking: boolean;
  nitroActive: boolean;
}

const ChaseCamera = ({ playerZ, playerX, shaking, nitroActive }: ChaseCameraProps) => {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 6, -12));
  const targetLook = useRef(new THREE.Vector3(0, 0.5, 5));
  const shakeOffset = useRef(new THREE.Vector3());

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Camera position: behind and above the player
    const idealX = playerX * 0.4;
    const idealY = nitroActive ? 5 : 6;
    const idealZ = playerZ - 10;

    targetPos.current.lerp(
      new THREE.Vector3(idealX, idealY, idealZ),
      0.05
    );

    // Look ahead
    targetLook.current.lerp(
      new THREE.Vector3(playerX * 0.2, 0.5, playerZ + 8),
      0.08
    );

    // Camera shake
    if (shaking) {
      shakeOffset.current.set(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.15,
        (Math.random() - 0.5) * 0.1
      );
    } else if (nitroActive) {
      shakeOffset.current.set(
        Math.sin(t * 40) * 0.08,
        Math.cos(t * 35) * 0.04,
        0
      );
    } else {
      shakeOffset.current.lerp(new THREE.Vector3(0, 0, 0), 0.2);
    }

    camera.position.copy(targetPos.current).add(shakeOffset.current);
    camera.lookAt(targetLook.current);

    // FOV stretch for nitro
    if ((camera as THREE.PerspectiveCamera).fov !== undefined) {
      const perspCam = camera as THREE.PerspectiveCamera;
      const targetFov = nitroActive ? 85 : 65;
      perspCam.fov = THREE.MathUtils.lerp(perspCam.fov, targetFov, 0.05);
      perspCam.updateProjectionMatrix();
    }
  });

  return null;
};

export default ChaseCamera;
