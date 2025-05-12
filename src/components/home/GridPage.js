"use client";

import {
  Center,
  Environment,
  Grid,
  OrbitControls,
  Stats,
  useGLTF,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React from "react";
import CustomGrid from "./CustomGrid";
import useModelStore from "@/store/useModelStore";
import Model from "@/shared/Model";

const GridPage = () => {
  const selectedModels = useModelStore((state) => state.selectedModels);

  return (
    <div className="w-full h-[600px]">
      <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />

        {selectedModels.map((models) => (
          <Model path={models} />
        ))}

        <CustomGrid />

        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default GridPage;
