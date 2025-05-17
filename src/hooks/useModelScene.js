import { useMemo } from "react";
import * as THREE from "three";
import { useModelLoader } from "@/hooks/useModelLoader";

export const useModelScene = (path) => {
  // چک کردن path قبل از بارگذاری
  const scene = path ? useModelLoader(path) : null;

  // تنظیم مرکز مدل
  const adjustedScene = useMemo(() => {
    if (!scene) return null;
    const clonedScene = scene.clone();
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    clonedScene.position.sub(center); // تنظیم مرکز مدل
    return clonedScene;
  }, [scene]);

  return { scene: adjustedScene, isValid: !!adjustedScene };
};
