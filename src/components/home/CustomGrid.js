"use client";
import { useRef, useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import useModelStore from "@/store/useModelStore";

const CustomGrid = () => {
  const { scene } = useThree();
  const gridCellSize = useModelStore((state) => state.modelOptions?.gridCellSize || 1);
  const gridSize = useModelStore((state) => state.modelOptions?.gridSize || 40);
  const [isDark, setIsDark] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    
    checkDarkMode();
    
    // Watch for changes in dark mode
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const size = gridSize;
    const divisions = Math.round(gridSize / gridCellSize); // تعداد خانه‌ها بر اساس سایز خانه

    // رنگ‌ها بر اساس حالت دارک یا لایت
    const colorCenterLine = new THREE.Color(isDark ? "#4b5563" : "#9ca3af");
    const colorGrid = new THREE.Color(isDark ? "#4b5563" : "#9ca3af");
    const colorMillimeter = new THREE.Color(isDark ? "#374151" : "#d1d5db");

    const gridHelper = new THREE.GridHelper(
      size,
      divisions,
      colorCenterLine,
      colorGrid
    );

    gridHelper.material.transparent = true;
    gridHelper.material.opacity = isDark ? 0.4 : 0.3;
    gridHelper.material.depthWrite = false;
    gridHelper.material.side = THREE.DoubleSide;

    const millimeterGridHelper = new THREE.GridHelper(
      size,
      divisions * 10,
      colorMillimeter,
      colorMillimeter
    );

    millimeterGridHelper.material.transparent = true;
    millimeterGridHelper.material.opacity = isDark ? 0.25 : 0.15;
    millimeterGridHelper.material.depthWrite = false;
    millimeterGridHelper.material.side = THREE.DoubleSide;

    // نمایش محورهای x, y, z
    const axesHelper = new THREE.AxesHelper(20); // طول محورها: 20 واحد

    scene.add(gridHelper);
    scene.add(millimeterGridHelper);

    return () => {
      scene.remove(gridHelper);
      scene.remove(millimeterGridHelper);
    };
  }, [scene, gridCellSize, gridSize, isDark]);

  return (
    <>
      {/* Academy Sazak Text on Grid */}
      <Text
        position={[-(gridSize * 0.35), 0.121, gridSize * 0.475]}
        fontSize={1.5}
        color={isDark ? "#6b7280" : "#9ca3af"}
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0.01]}
        fontWeight={700}
      >
        Sazak Academy
      </Text>
      
      {/* Labels for X, Y, Z axes */}
      <Text
        position={[gridSize * 0.525, 0.1, 0]}
        fontSize={1.2}
        color={isDark ? "#6b7280" : "#9ca3af"}
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
        fontWeight={700}
      >
        X
      </Text>
      <Text
        position={[-gridSize * 0.525, 0.1, 0]}
        fontSize={1.2}
        color={isDark ? "#6b7280" : "#9ca3af"}
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
        fontWeight={700}
      >
        Y
      </Text>
      <Text
        position={[0, 0.1, gridSize * 0.525]}
        fontSize={1.2}
        color={isDark ? "#6b7280" : "#9ca3af"}
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
        fontWeight={700}
      >
        Z
      </Text>
    </>
  );
};

export default CustomGrid;
