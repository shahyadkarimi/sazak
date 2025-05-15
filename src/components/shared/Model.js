import React, { forwardRef, useMemo } from "react";
import { useGLTF } from "@react-three/drei";

const Model = forwardRef(({ path, position, rotation }, ref) => {
  const { scene } = useGLTF(path);

  // کلون کردن scene برای ایجاد یک نمونه مستقل
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true); // کپی عمیق
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone(); // کپی مواد برای جلوگیری از اشتراک
      }
    });
    return clone;
  }, [scene]);

  return (
    <primitive
      ref={ref}
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={100}
    />
  );
});

export default Model;