"use client";

import { OrbitControls, TransformControls, Html } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useRef, useState } from "react";
import CustomGrid from "./CustomGrid";
import useModelStore from "@/store/useModelStore";
import Model from "@/components/shared/Model";
import ModelPlacer from "../shared/ModelPlacer";
import * as THREE from "three";
import SnappingTransformControls from "../shared/SnappingTransformControls";
import MoveIcon from "../icons/MoveIcon";
import RotateIcon from "../icons/RotateIcon";
import SizeIcon from "../icons/SizeIcon";
import DuplicateIcon from "../icons/DuplicateIcon";

const GridPage = () => {
  const selectedModels = useModelStore((state) => state.selectedModels);
  const isAdjustingHeight = useModelStore((state) => state.isAdjustingHeight);
  const [activeModelId, setActiveModelId] = useState(null);
  const [mode, setMode] = useState("translate");
  const modelRefs = useRef({});

  const handlePointerMissed = () => {
    setActiveModelId(null);
  };

  const duplicateModelHandler = () => {
    const currentModel = selectedModels.find((m) => m.id === activeModelId);
    if (!currentModel) {
      return;
    }

    const newId = Date.now();

    const newModel = {
      ...currentModel,
      id: newId,
      position: [
        currentModel.position[0],
        currentModel.position[1],
        currentModel.position[2] + 2,
      ],
      rotation: [...(currentModel.rotation || [0, 0, 0])],
    };

    useModelStore.setState((state) => ({
      selectedModels: [...state.selectedModels, newModel],
    }));

    setActiveModelId(newId);
  };

  return (
    <div className="w-full h-[600px] relative">
      {activeModelId && (
        <div className="min-w-fit absolute top-2 text-sm left-2 z-10 flex gap-5 bg-white py-3 px-4 rounded-2xl shadow-lg shadow-gray-200">
          <button
            onClick={() => setMode("translate")}
            className={`flex items-center gap-1 ${
              mode === "translate" ? "text-primaryThemeColor" : ""
            } hover:text-primaryThemeColor transition-all duration-300`}
          >
            <MoveIcon />
            <span>حرکت</span>
          </button>
          <button
            onClick={() => setMode("rotate")}
            className={`flex items-center gap-1 ${
              mode === "rotate" ? "text-primaryThemeColor" : ""
            } hover:text-primaryThemeColor transition-all duration-300`}
          >
            <RotateIcon />
            <span>چرخش</span>
          </button>
          <button
            onClick={duplicateModelHandler}
            className="flex items-center gap-1 hover:text-primaryThemeColor transition-all duration-300"
          >
            <DuplicateIcon />
            <span>کپی</span>
          </button>
          <button
            disabled
            onClick={() => setMode("scale")}
            className={`flex items-center gap-1 disabled:opacity-75 ${
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
        {selectedModels.map((model, index) => (
          <group
            key={model.id}
            onClick={(e) => {
              e.stopPropagation();
              setActiveModelId(model.id);
              console.log(`Model clicked: ${model.id}`);
            }}
          >
            <Model
              id={model.id}
              path={model.path}
              position={model.position}
              rotation={model.rotation}
              ref={(ref) => {
                modelRefs.current[model.id] = ref;
                console.log(`Model ref set for ${model.id}:`, ref);
              }}
            />
          </group>
        ))}

        {/* TransformControls */}
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
