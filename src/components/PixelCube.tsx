"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const RES = 7;
const SPACING = 0.16;
const PIXEL = 0.12;

function VoxelCube() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const positions = useMemo(() => {
    const arr: [number, number, number, number][] = [];
    const offset = ((RES - 1) * SPACING) / 2;
    for (let x = 0; x < RES; x++) {
      for (let y = 0; y < RES; y++) {
        for (let z = 0; z < RES; z++) {
          const onShell =
            x === 0 || x === RES - 1 ||
            y === 0 || y === RES - 1 ||
            z === 0 || z === RES - 1;
          if (!onShell) continue;
          arr.push([
            x * SPACING - offset,
            y * SPACING - offset,
            z * SPACING - offset,
            Math.random() * Math.PI * 2,
          ]);
        }
      }
    }
    return arr;
  }, []);

  const count = positions.length;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.32;
      groupRef.current.rotation.x += delta * 0.12;
    }
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const [x, y, z, phase] = positions[i];
      const pulse = 0.85 + 0.15 * Math.sin(t * 1.4 + phase);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const brightness = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.1 + phase));
      colorObj.setRGB(
        0.69 * brightness,
        1.0 * brightness,
        0.0 * brightness
      );
      mesh.setColorAt(i, colorObj);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        castShadow={false}
        receiveShadow={false}
      >
        <boxGeometry args={[PIXEL, PIXEL, PIXEL]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

export default function PixelCube() {
  return (
    <div className="relative w-full" style={{ aspectRatio: "1 / 1", maxWidth: "560px" }}>
      <Canvas
        camera={{ position: [1.4, 1.1, 2.0], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <VoxelCube />
      </Canvas>
    </div>
  );
}
