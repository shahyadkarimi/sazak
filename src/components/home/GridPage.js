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
import Model from "@/components/Model/Model";
import ModelPlacer from "../Model/ModelPlacer";
import Settings from "./Settings";

const GridPage = () => {
  const selectedModels = useModelStore((state) => state.selectedModels);
  const isAdjustingHeight = useModelStore((state) => state.isAdjustingHeight);

  return (
    <div className="w-full h-[600px]">
      <Settings />

      <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />

        {selectedModels.map((model, i) => (
          <Model
            key={model.id}
            id={model.id}
            path={model.path}
            position={model.position}
            rotation={model.rotation}
          />
        ))}

        <ModelPlacer />

        {/*         
        <Grid
          position={[0, 0, 0]} // روی سطح زمین
          args={[20, 20]} // اندازه کل گرید (عرض، طول)
          cellSize={1}
          cellThickness={0.4}
          cellColor="#6b7280" // خطوط شفاف
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#6b7280" // خطوط ضخیم‌تر شفاف
          fadeDistance={50} // محو شدن در فاصله
          fadeStrength={0.3}
          infiniteGrid={false}
        /> */}

        <CustomGrid />

        <OrbitControls
          enableRotate={!isAdjustingHeight} // غیرفعال کردن چرخش هنگام تنظیم ارتفاع
          enablePan={!isAdjustingHeight}
        />
      </Canvas>
    </div>
  );
};

export default GridPage;
