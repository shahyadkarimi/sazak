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
import ModelToolbar from "../shared/ModelToolbar";

const GridPage = () => {
  const selectedModels = useModelStore((state) => state.selectedModels);
  const isAdjustingHeight = useModelStore((state) => state.isAdjustingHeight);
  const [activeModelId, setActiveModelId] = useState(null);
  const [mode, setMode] = useState("translate");
  const [rotateSnap, setRotateSnap] = useState(90);
  const modelRefs = useRef({});

  const handlePointerMissed = () => {
    setActiveModelId(null);
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
        <ModelToolbar
          mode={mode}
          setMode={setMode}
          rotateSnap={rotateSnap}
          setRotateSnap={setRotateSnap}
          activeModelId={activeModelId}
          setActiveModelId={setActiveModelId}
          modelRefs={modelRefs}
        />
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