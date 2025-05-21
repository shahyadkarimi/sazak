"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const FACE_CONFIG = [
  { name: "FRONT", position: [0, 0, 1], color: "#f87171" },
  { name: "BACK", position: [0, 0, -1], color: "#60a5fa" },
  { name: "LEFT", position: [-1, 0, 0], color: "#34d399" },
  { name: "RIGHT", position: [1, 0, 0], color: "#fbbf24" },
  { name: "TOP", position: [0, 1, 0], color: "#a78bfa" },
  { name: "BOTTOM", position: [0, -1, 0], color: "#fb923c" },
];

const CubeFace = ({ name, position, color }) => {
  return (
    <mesh name={name} position={position}>
      <planeGeometry args={[0.8, 0.8]} />
      <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.8} />
    </mesh>
  );
};

const ViewCubeScene = ({ onFaceClick }) => {
  const ref = useRef();
  const { camera, gl } = useThree();

  // بچرخون مکعب برای هماهنگی با دوربین اصلی
  useFrame(() => {
    if (ref.current) {
      ref.current.quaternion.copy(camera.quaternion);
    }
  });

  // هندل کلیک برای تعیین زاویه دوربین
  useEffect(() => {
    const handleClick = (event) => {
      const mouse = new THREE.Vector2();
      mouse.x = (event.offsetX / 100) * 2 - 1;
      mouse.y = -(event.offsetY / 100) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(ref.current.children);
      if (intersects.length > 0) {
        const face = intersects[0].object.name;
        if (onFaceClick) onFaceClick(face);
      }
    };

    gl.domElement.addEventListener("pointerdown", handleClick);
    return () => gl.domElement.removeEventListener("pointerdown", handleClick);
  }, [camera, gl, onFaceClick]);

  return (
    <group ref={ref}>
      {FACE_CONFIG.map((face) => (
        <CubeFace key={face.name} {...face} />
      ))}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="white" wireframe />
      </mesh>
    </group>
  );
};

const ViewCube = ({ onViewChange }) => {
  const handleFaceClick = (face) => {
    const viewMap = {
      FRONT: [0, 5, 15],
      BACK: [0, 5, -15],
      LEFT: [15, 5, 0],
      RIGHT: [-15, 5, 0],
      TOP: [0, 15, 0],
      BOTTOM: [0, -15, 0],
    };
    const newPos = viewMap[face];
    if (newPos) {
      onViewChange(() => ({ camera: newPos, fov: 80 }));
    }
  };

  return (
    <div className="absolute top-2 left-2 w-24 h-24 z-50">
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <ambientLight />
        <ViewCubeScene onFaceClick={handleFaceClick} />
      </Canvas>
    </div>
  );
};

export default ViewCube;
