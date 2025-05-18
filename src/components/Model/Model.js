import { useEffect, useRef } from "react";
import useModelStore from "@/store/useModelStore";
import { useModelScene } from "@/hooks/useModelScene";
import { useModelAdjustment } from "@/hooks/useModelAdjustment";
import ModelControls from "./ModelControls";
import * as THREE from "three"; // اضافه کردن THREE برای متریال

const Model = ({ path, position, id, rotation }) => {
  const modelRef = useRef();
  const { scene: adjustedScene, isValid } = useModelScene(path);
  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const setSelectedModelId = useModelStore((s) => s.setSelectedModelId);
  const updateModelPosition = useModelStore((s) => s.updateModelPosition);
  const updateModelRotation = useModelStore((s) => s.updateModelRotation);
  const setIsAdjustingHeight = useModelStore((s) => s.setIsAdjustingHeight);
  const existingModels = useModelStore((s) => s.selectedModels);
  const modelControls = useModelAdjustment(
    id,
    position,
    rotation,
    updateModelPosition,
    updateModelRotation,
    existingModels
  );

  if (!isValid) {
    return null;
  }

  const handleClick = (event) => {
    event.stopPropagation();
    setSelectedModelId(id);
  };

  const deleteModelHandler = () => {
    useModelStore.setState((state) => ({
      selectedModels: state.selectedModels.filter((model) => model.id !== id),
    }));
  };

  const controlsWithDelete = {
    ...modelControls,
    deleteModel: deleteModelHandler,
  };

  const isSelected = selectedModelId === id;

  useEffect(() => {
    setIsAdjustingHeight(
      modelControls.isAdjustingHeight || modelControls.isMoving
    );
  }, [modelControls.isAdjustingHeight, modelControls.isMoving]);

  // تغییر متریال مدل انتخاب‌شده یا افزودن حاشیه
  useEffect(() => {
    if (adjustedScene) {
      adjustedScene.traverse((child) => {
        if (child.isMesh) {
          if (isSelected) {
            // تغییر متریال برای مدل انتخاب‌شده
            child.material.emissive = new THREE.Color(0xffff00); // رنگ درخشان زرد
            child.material.emissiveIntensity = 0.3;
          } else {
            // بازگرداندن متریال به حالت اولیه
            child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0;
          }
        }
      });
    }
  }, [isSelected, adjustedScene]);

  return (
    <group ref={modelRef}>
      <primitive
        object={adjustedScene}
        scale={100}
        position={position}
        rotation={rotation}
        onClick={handleClick}
      />
      {/* افزودن حاشیه زرد برای مدل انتخاب‌شده */}
      {isSelected && (
        <mesh>
          <primitive object={adjustedScene.clone()} />
          <meshBasicMaterial
            color={0xffff00} // رنگ زرد
            wireframe
            side={THREE.BackSide} // حاشیه دور مدل
          />
        </mesh>
      )}
      <ModelControls
        position={position}
        isSelected={isSelected}
        controls={controlsWithDelete}
      />
    </group>
  );
};

export default Model;
