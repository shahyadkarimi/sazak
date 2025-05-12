"use client";
import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

const CustomGrid = () => {
  const { scene } = useThree();

  useEffect(() => {
    const size = 100;
    const divisions = 100;
    const colorCenterLine = new THREE.Color("#ff0000"); // رنگ خط مرکزی
    const colorGrid = new THREE.Color("#00ffff"); // رنگ خطوط معمولی

    const gridHelper = new THREE.GridHelper(
      size,
      divisions,
      colorCenterLine,
      colorGrid
    );

    // تنظیم شفافیت
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.depthWrite = false;
    gridHelper.material.side = THREE.DoubleSide;

    scene.add(gridHelper);

    return () => {
      scene.remove(gridHelper);
    };
  }, [scene]);

  return null;
};

export default CustomGrid;
