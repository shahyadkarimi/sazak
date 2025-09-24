import { useEffect, useRef, useState } from "react";
import useModelStore from "@/store/useModelStore";
import { useModelScene } from "@/hooks/useModelScene";
import { useModelAdjustment } from "@/hooks/useModelAdjustment";
import ModelControls from "./ModelControls";
import * as THREE from "three";

const Model = ({ path, position, id, rotation }) => {
  const modelRef = useRef();

  const { scene: adjustedScene, isValid } = useModelScene(path);

  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const setSelectedModelId = useModelStore((s) => s.setSelectedModelId);
  const updateModelPosition = useModelStore((s) => s.updateModelPosition);
  const updateModelRotation = useModelStore((s) => s.updateModelRotation);
  const setIsAdjustingHeight = useModelStore((s) => s.setIsAdjustingHeight);
  const existingModels = useModelStore((s) => s.selectedModels);
  const modelOptions = useModelStore((s) => s.modelOptions);
  const setModelsRef = useModelStore((s) => s.setModelsRef);

  const modelControls = useModelAdjustment(
    id,
    position,
    rotation,
    updateModelPosition,
    updateModelRotation,
    existingModels,
    {
      positionSnapStep: modelOptions.snapSize,
      heightSnapStep: modelOptions.snapSize,
      rotationSnapDegrees: modelOptions.rotationDeg,
      mouseSensitivityY:
        modelOptions.snapSize === 0.1 || modelOptions.snapSize === 0.5 ? 3 : 3,
    }
  );

  const isSelected = selectedModelId === id;
  const [clonedSceneState, setClonedSceneState] = useState(null);
  useEffect(() => {
    if (adjustedScene) {
      const clone = adjustedScene.clone(true);
      clone.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
        }
      });
      setClonedSceneState(clone);
    }
  }, [adjustedScene]);

  // تغییر رنگ فقط وقتی مدل سلکت شده
  useEffect(() => {
    if (!clonedSceneState) return;
    setModelsRef(modelRef);

    clonedSceneState.traverse((child) => {
      if (child.isMesh && child.material) {
        if (isSelected) {
          if (child.material.emissive) {
            child.material.emissive = new THREE.Color(0xffff00); // رنگ درخشان زرد
            child.material.emissiveIntensity = 0.3; // نوردهی ملایم
          }
        } else {
          if (child.material.emissive) {
            child.material.emissive = new THREE.Color(0xdc2626);
            child.material.emissiveIntensity = 0; // نوردهی ملایم
          }
        }
      }
    });
  }, [isSelected, clonedSceneState]);

  // اطلاع به استور درباره درحال تنظیم بودن مدل
  useEffect(() => {
    setIsAdjustingHeight(
      modelControls.isAdjustingHeight || modelControls.isMoving
    );
  }, [modelControls.isAdjustingHeight, modelControls.isMoving]);

  // هندل انتخاب مدل
  const handleClick = (event) => {
    event.stopPropagation();
    setSelectedModelId(id);
  };

  // حذف مدل
  const deleteModelHandler = () => {
    useModelStore.setState((state) => ({
      selectedModels: state.selectedModels.filter((model) => model.id !== id),
    }));
  };

  const controlsWithDelete = {
    ...modelControls,
    deleteModel: deleteModelHandler,
  };

  if (!isValid || !clonedSceneState) return null;

  return (
    <group ref={modelRef}>
      <primitive
        object={clonedSceneState}
        scale={100}
        position={position}
        rotation={rotation}
        onClick={handleClick}
      />

      <ModelControls
        position={position}
        isSelected={isSelected}
        controls={controlsWithDelete}
      />
    </group>
  );
};

export default Model;
