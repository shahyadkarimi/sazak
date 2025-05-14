import React, { forwardRef } from "react";
import { useGLTF } from "@react-three/drei";

const Model = forwardRef(({ path, position, rotation }, ref) => {
  const { scene } = useGLTF(path);

  return (
    <primitive
      ref={ref}
      object={scene}
      position={position}
      rotation={rotation}
      scale={100}
    />
  );
});

export default Model;
