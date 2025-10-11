"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const FACE_CONFIG = [
  { name: "جلو", normal: [0, 0, 1], position: [0, 0, 0.51], rotation: [0, 0, 0] },
  { name: "پشت", normal: [0, 0, -1], position: [0, 0, -0.51], rotation: [0, Math.PI, 0] },
  { name: "چپ", normal: [-1, 0, 0], position: [-0.51, 0, 0], rotation: [0, -Math.PI/2, 0] },
  { name: "راست", normal: [1, 0, 0], position: [0.51, 0, 0], rotation: [0, Math.PI/2, 0] },
  { name: "بالا", normal: [0, 1, 0], position: [0, 0.51, 0], rotation: [-Math.PI/2, 0, 0] },
  { name: "پایین", normal: [0, -1, 0], position: [0, -0.51, 0], rotation: [Math.PI/2, 0, 0] },
];

const CubeFace = ({ face, isSelected, onFaceClick }) => {
  const faceColor = isSelected ? "#3b82f6" : "#ffffff";
  const textColor = isSelected ? "#ffffff" : "#1f2937";
  
  const handleClick = (e) => {
    e.stopPropagation();
    onFaceClick(face.name);
  };
  
  return (
    <group position={face.position} rotation={face.rotation}>
      <mesh 
        onClick={handleClick}
        onPointerOver={(e) => {
          e.object.material.color.set("#f3f4f6");
        }}
        onPointerOut={(e) => {
          e.object.material.color.set(faceColor);
        }}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial 
          color={faceColor} 
          transparent 
          opacity={isSelected ? 1 : 0.95}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        position={[0, 0, 0.01]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
        }}
      >
        <planeGeometry args={[0.8, 0.2]} />
        <meshBasicMaterial 
          color="transparent" 
          transparent 
          opacity={0}
        />
      </mesh>
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.18}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {face.name}
      </Text>
    </group>
  );
};

const ViewCubeScene = ({ onSelect, onDragStateChange }) => {
  const ref = useRef();
  const { camera } = useThree();
  const [selectedFace, setSelectedFace] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  
  const rotationRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });

  useFrame(() => {
    if (!ref.current) return;
    
    const lerpFactor = 0.1;
    rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * lerpFactor;
    rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * lerpFactor;
    
    ref.current.rotation.set(rotationRef.current.x, rotationRef.current.y, 0);
  });

  const handleFaceClick = (faceName) => {
    console.log('Face clicked:', faceName);
    setSelectedFace(faceName);
    
    const faceMap = {
      "جلو": { position: [0, 15, 25], rotation: [0, 0] },
      "پشت": { position: [0, 15, -25], rotation: [0, Math.PI] },
      "چپ": { position: [-25, 15, 0], rotation: [0, -Math.PI/2] },
      "راست": { position: [25, 15, 0], rotation: [0, Math.PI/2] },
      "بالا": { position: [0, 25, 0], rotation: [-Math.PI/2, 0] },
      "پایین": { position: [0, -25, 0], rotation: [Math.PI/2, 0] }
    };
    
    const face = faceMap[faceName];
    if (face) {
      console.log('Changing camera to:', face.position, 'with rotation:', face.rotation);
      targetRotationRef.current = { x: face.rotation[0], y: face.rotation[1] };
      onSelect && onSelect({ camera: face.position, fov: 40, immediate: true });
    }
  };

  // Handle mouse down on the ViewCube
  const handleMouseDown = (e) => {
    e.stopPropagation();
    if (e.button === 0) {
      // Only start dragging if clicking on the main group or background
      if (e.object === e.scene || e.object === ref.current) {
        setIsDragging(true);
        onDragStateChange && onDragStateChange(true);
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    }
  };

  // Global mouse move handler for continuous dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      targetRotationRef.current.y -= dx * 0.01;
      targetRotationRef.current.x += dy * 0.01;
      
      const limit = Math.PI / 2 - 0.1;
      targetRotationRef.current.x = Math.max(-limit, Math.min(limit, targetRotationRef.current.x));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragStateChange && onDragStateChange(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <group 
      ref={ref} 
      scale={1.2}
      onPointerDown={handleMouseDown}
    >
      {FACE_CONFIG.map((face) => (
        <CubeFace 
          key={face.name} 
          face={face}
          isSelected={selectedFace === face.name}
          onFaceClick={handleFaceClick}
        />
      ))}
      
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.6}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
      
      {/* Edge lines for better visibility */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.01, 1.01, 1.01)]} />
        <lineBasicMaterial color="#6b7280" linewidth={2} />
      </lineSegments>
    </group>
  );
};

const ViewCube = ({ activeView, onViewChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleSelect = (view) => {
    if (!view) return;
    onViewChange && onViewChange({ camera: view.camera, fov: view.fov ?? 40 });
  };

  return (
    <div className="absolute top-4 left-4 w-32 h-32 z-50">
      <Canvas 
        camera={{ position: [3, 3, 3], fov: 50 }}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight position={[-5, -5, -5]} intensity={0.4} />
        <ViewCubeScene onSelect={handleSelect} onDragStateChange={setIsDragging} />
      </Canvas>
    </div>
  );
};

export default ViewCube;