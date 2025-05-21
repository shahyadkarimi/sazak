"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import React, { useEffect, useRef, useState } from "react";
import CustomGrid from "./CustomGrid";
import useModelStore from "@/store/useModelStore";
import Model from "@/components/Model/Model";
import ModelPlacer from "../Model/ModelPlacer";
import Settings from "./Settings";
import ViewCube from "./ViewCube";

const CameraUpdater = ({ position, fov = 50 }) => {
  const { camera } = useThree();
  const cameraRef = useRef();

  camera.position.set(...position);
  camera.fov = fov;
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);
  // useEffect(() => {
  // }, [position, fov, camera]);

  return null;
};

// ✅ ۳. صفحه اصلی
const GridPage = () => {
  const selectedModels = useModelStore((state) => state.selectedModels);
  const isAdjustingHeight = useModelStore((state) => state.isAdjustingHeight);

  const [cameraPosition, setCameraPosition] = useState({
    camera: [10, 10, 10],
    fov: 50,
  });

  return (
    <div className="w-full h-[600px] relative">
      <Settings />
      {/* <ViewControlPanel onViewChange={setCameraPosition} /> */}

      <Canvas camera={{ position: cameraPosition.camera, fov: 50 }}>
        {/* نورپردازی */}
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />

        {/* موقعیت دوربین */}
        <CameraUpdater
          position={cameraPosition.camera}
          fov={cameraPosition.fov}
        />

        {/* مدل‌ها */}
        {selectedModels.map((model) => (
          <Model
            key={model.id}
            id={model.id}
            path={model.path}
            position={model.position}
            rotation={model.rotation}
          />
        ))}

        {/* قابلیت انتخاب مکان مدل */}
        <ModelPlacer />

        {/* گرید سفارشی */}
        <CustomGrid />

        {/* کنترل چرخش و جابه‌جایی */}
        <OrbitControls
          enableRotate={!isAdjustingHeight}
          enablePan={!isAdjustingHeight}
        />
      </Canvas>

      <ViewCube onViewChange={setCameraPosition} />
    </div>
  );
};

export default GridPage;
