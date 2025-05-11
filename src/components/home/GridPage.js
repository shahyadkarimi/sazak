"use client";

import { Grid, OrbitControls, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React from "react";

const GridPage = () => {
  return (
    <div style={{ width: "600px", height: "400px" }}>
      <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
        {/* نور */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} />

        {/* کنترل چرخش دوربین */}
        <OrbitControls />

        {/* شبکه مشبک شبیه به TinkerCAD */}
        <Grid
          position={[0, 0, 0]} // روی سطح زمین
          args={[20, 20]} // اندازه کل گرید (عرض، طول)
          cellSize={1}
          cellThickness={0.4}
          cellColor="rgba(255, 255, 255, 0.3)" // خطوط شفاف
          sectionSize={5}
          sectionThickness={1}
          sectionColor="rgba(255, 0, 0, 0.4)" // خطوط ضخیم‌تر شفاف
          fadeDistance={50} // محو شدن در فاصله
          fadeStrength={0.3}
          infiniteGrid={false}
        />

        {/* ابزار کمکی */}
        {/* <axesHelper args={[5]} /> */}
        <Stats />
      </Canvas>
    </div>
  );
};

export default GridPage;
