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
import { toFarsiNumber } from "@/helper/helper";

const GridPage = () => {
  const selectedModels = useModelStore((state) => state.selectedModels);
  const isAdjustingHeight = useModelStore((state) => state.isAdjustingHeight);
  const [activeModelId, setActiveModelId] = useState(null);
  const [mode, setMode] = useState("translate");
  const [rotateSnap, setRotateSnap] = useState(90);
  const modelRefs = useRef({});

  const rotationOptions = [15, 30, 45, 90, 180];

  const handlePointerMissed = () => {
    setActiveModelId(null);
  };

  const duplicateModelHandler = () => {
    const currentModel = selectedModels.find((m) => m.id === activeModelId);
    if (!currentModel) {
      return;
    }

    const object = modelRefs.current[activeModelId]; // گرفتن مدل از scene
    if (!object) {
      return;
    }

    const newId = Date.now();

    const newModel = {
      ...currentModel,
      id: newId,
      position: [
        object.position.x, // استفاده از موقعیت فعلی در صحنه
        object.position.y,
        object.position.z + 2,
      ],
      rotation: [
        object.rotation.x, // استفاده از چرخش فعلی در صحنه
        object.rotation.y,
        object.rotation.z,
      ],
    };

    useModelStore.setState((state) => ({
      selectedModels: [...state.selectedModels, newModel],
    }));

    setActiveModelId(newId);
  };

  // آپدیت position و rotation در selectedModels
  const updateModelTransform = (modelId, newPosition, newRotation) => {
    useModelStore.setState((state) => ({
      selectedModels: state.selectedModels.map((model) =>
        model.id === modelId
          ? {
              ...model,
              position: [newPosition.x, newPosition.y, newPosition.z],
              rotation: [newRotation.x, newRotation.y, newRotation.z],
            }
          : model
      ),
    }));
  };

  return (
    <div className="w-full h-[600px] relative">
      {activeModelId && (
        <div className="min-w-fit absolute flex flex-col gap-3 top-2 text-sm left-2 z-10 ">
          <div className="flex gap-5 bg-white py-3 px-4 rounded-2xl shadow-lg shadow-gray-200">
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

          <div className="relative group">
            {/* منوی دکمه‌ها برای انتخاب زاویه چرخش */}
            {mode === "rotate" && (
              <div className="w-fit flex items-center gap-4 text-xs text-gray-700 h-auto py-2 px-3 rounded-xl shadow-lg shadow-gray-100 bg-white">
                <span>درجه چرخش:</span>
                {rotationOptions.map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setRotateSnap(angle)}
                    className={`hover:text-primaryThemeColor transition-all duration-300 ${
                      rotateSnap === angle ? "text-primaryThemeColor" : ""
                    }`}
                  >
                    {toFarsiNumber(angle)}°
                  </button>
                ))}
              </div>
            )}
          </div>
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
            }}
          >
            <Model
              id={model.id}
              path={model.path}
              position={model.position}
              rotation={model.rotation}
              ref={(ref) => {
                modelRefs.current[model.id] = ref;
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
            rotateSnap={rotateSnap}
            minY={0}
            onStart={() => useModelStore.setState({ isAdjustingHeight: true })}
            onEnd={() => useModelStore.setState({ isAdjustingHeight: false })}
            onObjectChange={() => {
              const object = modelRefs.current[activeModelId];
              if (object) {
                updateModelTransform(
                  activeModelId,
                  object.position,
                  object.rotation
                );
              }
            }}
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