import { useMemo } from "react";
import * as THREE from "three";
import { useModelLoader } from "@/hooks/useModelLoader";

export const useModelScene = (path) => {
  // چک کردن path قبل از بارگذاری
  const scene = path ? useModelLoader(path) : null;

  // تنظیم مرکز مدل و قرار دادن پایین مدل روی زمین
  const adjustedScene = useMemo(() => {
    if (!scene) return null;
    const clonedScene = scene.clone();
    
    // Don't apply scale here - let the Model component handle it
    // Just return the original scene
    return clonedScene;
  }, [scene]);

  return { scene: adjustedScene, isValid: !!adjustedScene };
};
