import { useMemo } from "react";
import * as THREE from "three";
import { useModelLoader } from "@/hooks/useModelLoader";

export const useModelScene = (path) => {
  // Always call useModelLoader to maintain hook order
  const scene = useModelLoader(path);
  
  // تنظیم مرکز مدل و قرار دادن پایین مدل روی زمین
  const adjustedScene = useMemo(() => {
    if (!scene) return null;
    
    try {
      const clonedScene = scene.clone();
      return clonedScene;
    } catch (error) {
      console.warn('Error cloning scene:', error);
      return null;
    }
  }, [scene]);

  return { scene: adjustedScene, isValid: !!adjustedScene };
};
