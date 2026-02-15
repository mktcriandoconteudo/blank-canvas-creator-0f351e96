import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

interface PostEffectsProps {
  nitroActive: boolean;
}

const PostEffects = ({ nitroActive }: PostEffectsProps) => {
  return (
    <EffectComposer>
      <Bloom
        intensity={nitroActive ? 2.5 : 1.2}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={nitroActive ? new THREE.Vector2(0.004, 0.004) : new THREE.Vector2(0.001, 0.001)}
        radialModulation={true}
        modulationOffset={0.5}
      />
      <Vignette
        offset={0.3}
        darkness={nitroActive ? 0.8 : 0.5}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};

export default PostEffects;
