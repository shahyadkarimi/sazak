"use client";

import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import useModelStore from "@/store/useModelStore";

const snapToGrid = ([x, y, z], step = 1) => {
  // Ensure models snap to grid lines properly
  const snappedX = Math.round(x / step) * step;
  const snappedZ = Math.round(z / step) * step;
  return [snappedX, y, snappedZ];
};

const ModelPlacer = () => {
  const { raycaster, camera, gl, scene } = useThree();

  const [hoverPos, setHoverPos] = useState(null);
  const planeRef = useRef();

  const selectedModels = useModelStore((s) => s.selectedModels);
  const constrainToGrid = useModelStore((s) => s.constrainToGrid);
  const currentPlacingModel = useModelStore((s) => s.currentPlacingModel);
  const currentPlacingModelColor = useModelStore((s) => s.currentPlacingModelColor);
  const currentPlacingModelNoColor = useModelStore((s) => s.currentPlacingModelNoColor);
  const setCurrentPlacingModel = useModelStore((s) => s.setCurrentPlacingModel);
  const { setSelectedModels } = useModelStore();
  const setSelectedModelId = useModelStore((s) => s.setSelectedModelId);
  const modelOptions = useModelStore((s) => s.modelOptions);
  const pushHistory = useModelStore((s) => s.pushHistory);

  const { scene: originalScene } = currentPlacingModel
    ? useGLTF(currentPlacingModel, true)
    : { scene: null };

  const previewModel = useMemo(() => {
    if (!originalScene) return null;

    const clonedScene = originalScene.clone();

    // Apply scale
    clonedScene.scale.set(100, 100, 100);
    
    // Apply centering logic
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    // Center the model horizontally and place bottom at y=0
    clonedScene.position.x = -center.x;
    clonedScene.position.z = -center.z;
    clonedScene.position.y = -box.min.y;
    
    // Make the preview model semi-transparent
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0.7;
      }
    });

    return clonedScene;
  }, [originalScene]);

  useFrame(() => {
    if (!currentPlacingModel || !planeRef.current) return;

    const mouse = new THREE.Vector2();
    if (gl && gl.domElement) {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((gl.domElement.mouseX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((gl.domElement.mouseY - rect.top) / rect.height) * 2 + 1;
    }

    raycaster.setFromCamera(mouse, camera);
    raycaster.layers.set(0);
    const intersects = raycaster.intersectObject(planeRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      // Use the snap size from model options, default to 1 if free mode
      const snapSize = modelOptions.snapSize === 'free' ? 0.1 : modelOptions.snapSize;
      // Ensure Y position is exactly 0 (ground level) and snap to grid
      const baseSnapped = snapToGrid([point.x, 0, point.z], snapSize);

      // Physics will handle collision detection automatically
      let adjusted = baseSnapped;

      if (constrainToGrid) {
        const gridSize = modelOptions.gridSize || 40;
        const limit = gridSize / 2; // نصف سایز کلی صفحه
        adjusted[0] = Math.max(-limit, Math.min(limit, adjusted[0]));
        adjusted[2] = Math.max(-limit, Math.min(limit, adjusted[2]));
      }
      setHoverPos(adjusted);
    }
  });

  const handleClick = () => {
    if (hoverPos && currentPlacingModel) {
      pushHistory();
      setSelectedModels([
        ...selectedModels,
        {
          id: Date.now(),
          path: currentPlacingModel,
          position: (function(){
            const p = [...hoverPos];
            if (constrainToGrid) {
              const gridSize = modelOptions.gridSize || 40;
              const limit = gridSize / 2;
              p[0] = Math.max(-limit, Math.min(limit, p[0]));
              p[2] = Math.max(-limit, Math.min(limit, p[2]));
            }
            return p;
          })(),
          rotation: [0, 0, 0],
          color: currentPlacingModelColor,
          noColor: currentPlacingModelNoColor,
        },
      ]);
      setCurrentPlacingModel(null);
    } else {
      raycaster.layers.set(0);
      const rect = gl.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        {
          x: ((gl.domElement.mouseX - rect.left) / rect.width) * 2 - 1,
          y: -((gl.domElement.mouseY - rect.top) / rect.height) * 2 + 1,
        },
        camera
      );

      // انتخاب مدل clear نمی‌شود - فقط برای قرار دادن مدل جدید استفاده می‌شود
    }
  };

  useEffect(() => {
    if (!gl || !gl.domElement) return;

    const updateMousePosition = (event) => {
      gl.domElement.mouseX = event.clientX;
      gl.domElement.mouseY = event.clientY;
    };

    gl.domElement.addEventListener("mousemove", updateMousePosition);
    gl.domElement.addEventListener("click", handleClick);

    return () => {
      gl.domElement.removeEventListener("mousemove", updateMousePosition);
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [
    hoverPos,
    currentPlacingModel,
    currentPlacingModelColor,
    selectedModels,
    gl,
    setSelectedModels,
    setCurrentPlacingModel,
    setSelectedModelId,
    previewModel,
    pushHistory,
  ]);

  return (
    <>
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]} // Slightly above ground to prevent z-fighting
        visible={false}
        layers={0}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {hoverPos && previewModel && (
        <group position={new THREE.Vector3(...hoverPos)}>
          <primitive object={previewModel} />
        </group>
      )}
    </>
  );
};

export default ModelPlacer;
