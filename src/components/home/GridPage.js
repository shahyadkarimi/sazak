"use client";

import { Environment, Grid, OrbitControls, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React from "react";
import CustomGrid from "./CustomGrid";

const GridPage = () => {
  return (
    <div className="w-full h-[600px]">
      <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 7]} intensity={1} />

        <CustomGrid /> {/* گرید سفارشی اینجاست */}
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default GridPage;
