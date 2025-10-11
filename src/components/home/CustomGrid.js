"use client";
import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

const CustomGrid = () => {
  const { scene } = useThree();

  useEffect(() => {
    const size = 40;
    const divisions = 40;

    const colorCenterLine = new THREE.Color("#9ca3af");
    const colorGrid = new THREE.Color("#9ca3af");
    const colorMillimeter = new THREE.Color("#d1d5db");

    const gridHelper = new THREE.GridHelper(
      size,
      divisions,
      colorCenterLine,
      colorGrid
    );

    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.depthWrite = false;
    gridHelper.material.side = THREE.DoubleSide;

    const millimeterGridHelper = new THREE.GridHelper(
      size,
      divisions * 10,
      colorMillimeter,
      colorMillimeter
    );

    millimeterGridHelper.material.transparent = true;
    millimeterGridHelper.material.opacity = 0.15;
    millimeterGridHelper.material.depthWrite = false;
    millimeterGridHelper.material.side = THREE.DoubleSide;

    scene.add(gridHelper);
    scene.add(millimeterGridHelper);

    return () => {
      scene.remove(gridHelper);
      scene.remove(millimeterGridHelper);
    };
  }, [scene]);

  return (
    <>
      {/* Academy Sazak Text on Grid */}
      <Text
        position={[-19, 0.121, 13.9]}
        fontSize={1.5}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 1.57]}
        fontWeight={700}
      >
        Sazak Academy
      </Text>
    </>
  );
};

export default CustomGrid;
