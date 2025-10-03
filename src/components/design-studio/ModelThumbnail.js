"use client";

import React, { Suspense, useEffect, useMemo, useState, memo } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@heroui/react";

const CenteredModel = ({ path }) => {
  const { scene } = useGLTF(path);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  const [centerOffset, setCenterOffset] = useState([0, 0, 0]);
  const [autoScale, setAutoScale] = useState(1);

  useEffect(() => {
    if (!cloned) return;
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Move model so its center is at origin
    setCenterOffset([-center.x, -center.y, -center.z]);

    // Scale to a target normalized size to fit small canvas
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const target = 2.2; // base fit size
    const padding = 0.88; // add safe padding to avoid right-edge clipping
    setAutoScale((target / maxDim) * padding);
  }, [cloned]);

  return (
    <group position={centerOffset} scale={autoScale}>
      <primitive object={cloned} />
    </group>
  );
};

const ModelThumbnail = ({ path, className = "", bg = "#fff" }) => {
  return (
    <div className={cn(className, "bg-gray-100")}
      style={{ backgroundColor: bg }}
    >
      <Canvas
        camera={{ position: [3.2, 3.2, 3.2], fov: 40 }}
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        frameloop="demand"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[4, 6, 8]} intensity={1.2} />
        <Suspense fallback={null}>
          <CenteredModel path={path} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default memo(ModelThumbnail, (prev, next) => prev.path === next.path && prev.className === next.className && prev.bg === next.bg);


