"use client";

import { OrbitControls, TransformControls, Html } from "@react-three/drei";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import React, { useRef, useState } from "react";
import CustomGrid from "./CustomGrid";
import useModelStore from "@/store/useModelStore";
import Model from "@/components/shared/Model";
import ModelPlacer from "../shared/ModelPlacer";
import * as THREE from "three";
import SnappingTransformControls from "../shared/SnappingTransformControls ";
import MoveIcon from "../icons/MoveIcon";
import RotateIcon from "../icons/RotateIcon";
import SizeIcon from "../icons/SizeIcon";

const GridPage = () => {
  const selectedModels = useModelStore((state) => state.selectedModels);
  const isAdjustingHeight = useModelStore((state) => state.isAdjustingHeight);
  const isBelowGrid = useModelStore((state) => state.isBelowGrid);
  const [activeModelId, setActiveModelId] = useState(null);
  const [mode, setMode] = useState("translate");
  const modelRefs = useRef({});

  const handlePointerMissed = () => {
    setActiveModelId(null);
  };

  return (
    <div className="w-full h-[600px] relative">
      {/* دکمه‌های حالت کنترل */}
      {activeModelId && (
        <div className="min-w-fit absolute top-2 text-sm left-2 z-10 flex gap-5 bg-white py-3 px-4 rounded-2xl shadow-lg shadow-gray-200">
          <button
            onClick={() => setMode("translate")}
            className={`flex items-center gap-1 ${
              mode === "translate" ? "text-primaryThemeColor" : ""
            }`}
          >
            <MoveIcon />
            <span>حرکت</span>
          </button>
          <button
            onClick={() => setMode("rotate")}
            className={`flex items-center gap-1 ${
              mode === "rotate" ? "text-primaryThemeColor" : ""
            }`}
          >
            <RotateIcon />

            <span>چرخش</span>
          </button>
          <button
            onClick={() => setMode("scale")}
            className={`flex items-center gap-1 ${
              mode === "scale" ? "text-primaryThemeColor" : ""
            }`}
          >
            <SizeIcon />

            <span>بزرگ‌نمایی</span>
          </button>
        </div>
      )}

      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        onPointerMissed={handlePointerMissed}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />

        {/* مدل‌ها */}
        {selectedModels.map((model) => (
          <group
            key={model.id}
            onClick={(e) => {
              e.stopPropagation();
              setActiveModelId(model.id);
            }}
          >
            <Model
              id={model.id}
              path={model.path}
              position={model.position}
              rotation={model.rotation}
              ref={(ref) => (modelRefs.current[model.id] = ref)}
            />
            {/* نمایش پیام خطا بالای مدل وقتی زیر گرید است و مدل انتخاب شده */}
            {isBelowGrid && activeModelId === model.id && (
              <Html
                position={[0, 2, 0]} // موقعیت نسبی بالای مدل (2 واحد بالاتر)
                center
                distanceFactor={10}
              >
                <div className="bg-red-500 text-white py-1 px-2 rounded-lg text-sm shadow-lg">
                  خطا: مدل زیر سطح گرید است!
                </div>
              </Html>
            )}
          </group>
        ))}

        {/* TransformControls فقط برای مدل انتخاب‌شده */}
        {activeModelId && modelRefs.current[activeModelId] && (
          <SnappingTransformControls
            object={modelRefs.current[activeModelId]}
            mode={mode}
            snap={1}
            minY={0}
            onStart={() => useModelStore.setState({ isAdjustingHeight: true })}
            onEnd={() => useModelStore.setState({ isAdjustingHeight: false })}
          />
        )}

        <ModelPlacer />
        <CustomGrid />

        <OrbitControls
          enableRotate={!isAdjustingHeight}
          enablePan={!isAdjustingHeight}
          enableZoom={true}
        />
      </Canvas>
    </div>
  );
};

export default GridPage;
