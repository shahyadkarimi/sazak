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

// تابع بررسی برخورد مدل جدید با مدل‌های قبلی و اصلاح موقعیت برای نچسبیدن به هم
const adjustPositionToAvoidOverlap = (pos, models, snapSize = 1) => {
  const step = snapSize;
  let adjustedPos = new THREE.Vector3(...pos);

  for (const model of models) {
    const modelPos = new THREE.Vector3(...model.position);

    // Use proper collision detection with 1x1x1 grid cells
    const modelBox = new THREE.Box3().setFromCenterAndSize(
      modelPos,
      new THREE.Vector3(step, step, step)
    );

    // جعبه مدل جدید روی موقعیت پیشنهادی
    let newBox = new THREE.Box3().setFromCenterAndSize(
      adjustedPos,
      new THREE.Vector3(step, step, step)
    );

    if (modelBox.intersectsBox(newBox)) {
      // وقتی برخورد داریم، مدل جدید را دقیقاً کنار مدل قبلی می‌چسبانیم
      // Find the nearest available position on the grid

      // Check horizontal direction first
      if (adjustedPos.x < modelPos.x) {
        adjustedPos.x = modelBox.min.x - step;
      } else {
        adjustedPos.x = modelBox.max.x + step;
      }

      // If still colliding on Z axis, adjust Z position
      newBox = new THREE.Box3().setFromCenterAndSize(
        adjustedPos,
        new THREE.Vector3(step, step, step)
      );
      
      if (modelBox.intersectsBox(newBox)) {
        if (adjustedPos.z < modelPos.z) {
          adjustedPos.z = modelBox.min.z - step;
        } else {
          adjustedPos.z = modelBox.max.z + step;
        }
      }

      // Keep the same Y position (ground level)
      adjustedPos.y = 0;
    }
  }

  return [adjustedPos.x, adjustedPos.y, adjustedPos.z];
};

const ModelPlacer = () => {
  const { raycaster, camera, gl, scene } = useThree();

  const [hoverPos, setHoverPos] = useState(null);
  const planeRef = useRef();

  const selectedModels = useModelStore((s) => s.selectedModels);
  const constrainToGrid = useModelStore((s) => s.constrainToGrid);
  const currentPlacingModel = useModelStore((s) => s.currentPlacingModel);
  const currentPlacingModelColor = useModelStore((s) => s.currentPlacingModelColor);
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
      mouse.x = (gl.domElement.mouseX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(gl.domElement.mouseY / gl.domElement.clientHeight) * 2 + 1;
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

      // اصلاح موقعیت با چک برخورد با مدل‌های قبلی
      const adjusted = adjustPositionToAvoidOverlap(
        baseSnapped,
        selectedModels,
        snapSize
      );

      if (constrainToGrid) {
        const limit = 20; // match CustomGrid size/2 (size=40)
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
              const limit = 20;
              p[0] = Math.max(-limit, Math.min(limit, p[0]));
              p[2] = Math.max(-limit, Math.min(limit, p[2]));
            }
            return p;
          })(),
          rotation: [0, 0, 0],
          color: currentPlacingModelColor,
        },
      ]);
      setCurrentPlacingModel(null);
    } else {
      raycaster.layers.set(0);
      raycaster.setFromCamera(
        {
          x: (gl.domElement.mouseX / gl.domElement.clientWidth) * 2 - 1,
          y: -(gl.domElement.mouseY / gl.domElement.clientHeight) * 2 + 1,
        },
        camera
      );

      const intersects = raycaster.intersectObjects(
        scene.children.filter(
          (child) =>
            child !== previewModel &&
            (child.isMesh || child === planeRef.current)
        ),
        true
      );

      if (intersects.length === 0) {
        setSelectedModelId(null);
      } else if (intersects[0].object === planeRef.current) {
        setSelectedModelId(null);
      }
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
