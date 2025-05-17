"use client";

import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import useModelStore from "@/store/useModelStore";

const snapToGrid = ([x, y, z], step = 1) => {
  return [Math.round(x / step) * step, y, Math.round(z / step) * step];
};

const ModelPlacer = () => {
  // هوک‌های Three.js
  const { raycaster, camera, gl, scene } = useThree();

  // مقادیر state
  const [hoverPos, setHoverPos] = useState(null);
  const planeRef = useRef();

  // دسترسی به store مدل‌ها
  const selectedModels = useModelStore((s) => s.selectedModels);
  const currentPlacingModel = useModelStore((s) => s.currentPlacingModel);
  const setCurrentPlacingModel = useModelStore((s) => s.setCurrentPlacingModel);
  const setSelectedModels = useModelStore((s) => s.setSelectedModels);
  const setSelectedModelId = useModelStore((s) => s.setSelectedModelId);

  // بارگذاری مدل با بررسی وجود مسیر
  const { scene: originalScene } = currentPlacingModel
    ? useGLTF(currentPlacingModel, true)
    : { scene: null };

  // کلون کردن مدل برای پیش‌نمایش
  const previewModel = useMemo(() => {
    if (!originalScene) return null;

    const clonedScene = originalScene.clone();

    // محاسبه باندینگ باکس برای تنظیم موقعیت
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // موقعیت را بر اساس مرکز باندینگ باکس تنظیم می‌کنیم
    clonedScene.position.sub(center);

    return clonedScene;
  }, [originalScene]);

  // به‌روزرسانی موقعیت هاور در هر فریم
  useFrame(() => {
    if (!currentPlacingModel || !planeRef.current) return;

    // ایجاد نقطه موس در فضای نرمالایز شده
    const mouse = new THREE.Vector2();
    if (gl && gl.domElement) {
      mouse.x = (gl.domElement.mouseX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(gl.domElement.mouseY / gl.domElement.clientHeight) * 2 + 1;
    }

    // محاسبه تقاطع اشعه با صفحه
    raycaster.setFromCamera(mouse, camera);
    raycaster.layers.set(0);
    const intersects = raycaster.intersectObject(planeRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const snapped = snapToGrid([point.x, 0, point.z], 1);
      setHoverPos(snapped);
    }
  });

  // مدیریت کلیک برای قرار دادن مدل یا لغو انتخاب
  const handleClick = () => {
    if (hoverPos && currentPlacingModel) {
      // قرار دادن مدل جدید
      setSelectedModels({
        id: Date.now(),
        path: currentPlacingModel,
        position: hoverPos,
        rotation: [0, 0, 0],
      });
      setCurrentPlacingModel(null);
    } else {
      // لغو انتخاب مدل
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

  // افزودن event listener‌ها
  useEffect(() => {
    if (!gl || !gl.domElement) return;

    // ذخیره موقعیت موس در سطح DOM
    const updateMousePosition = (event) => {
      gl.domElement.mouseX = event.clientX;
      gl.domElement.mouseY = event.clientY;
    };

    // اضافه کردن event listener‌ها
    gl.domElement.addEventListener("mousemove", updateMousePosition);
    gl.domElement.addEventListener("click", handleClick);

    // پاکسازی event listener‌ها هنگام unmount
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
  ]);

  return (
    <>
      {/* صفحه نامرئی برای raycast */}
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        visible={false}
        layers={0}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* پیش‌نمایش مدل زیر موس */}
      {hoverPos && previewModel && (
        <group position={new THREE.Vector3(...hoverPos)}>
          <primitive object={previewModel} scale={100} />
        </group>
      )}
    </>
  );
};

export default ModelPlacer;
