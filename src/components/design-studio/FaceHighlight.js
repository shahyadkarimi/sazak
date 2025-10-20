import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useModelStore from '@/store/useModelStore';

const FaceHighlight = () => {
  const activeFacePreview = useModelStore((state) => state.activeFacePreview);
  const isSnapping = useModelStore((state) => state.isSnapping);
  const meshRef = useRef();
  const pulseRef = useRef(0);

  useFrame((state, delta) => {
    if (meshRef.current && activeFacePreview) {
      // Pulse animation for active face
      pulseRef.current += delta * 3; // Speed of pulse
      const pulseScale = 1 + Math.sin(pulseRef.current) * 0.1;
      meshRef.current.scale.setScalar(pulseScale);
    }
  });

  if (!activeFacePreview) return null;

  const { position, normal, type, attachmentArea } = activeFacePreview;
  const isActive = isSnapping;

  // Color based on state
  const getColor = () => {
    if (isActive) return 0x00ff00; // Green when snapping
    return 0x0066ff; // Blue when hovering
  };

  const getOpacity = () => {
    if (isActive) return 0.7;
    return 0.4;
  };

  // Create face geometry based on type
  const createFaceGeometry = () => {
    const width = attachmentArea?.width || 1;
    const height = attachmentArea?.height || 1;
    const depth = attachmentArea?.depth || 0.1;

    switch (type) {
      case 'face-top':
      case 'face-bottom':
        return <boxGeometry args={[width, depth, height]} />;
      case 'face-left':
      case 'face-right':
        return <boxGeometry args={[depth, height, width]} />;
      case 'face-front':
      case 'face-back':
        return <boxGeometry args={[width, height, depth]} />;
      case 'face-inner-left':
      case 'face-inner-right':
        return <boxGeometry args={[depth * 0.5, height * 0.8, width * 0.8]} />;
      case 'face-corner':
        return <boxGeometry args={[width * 0.6, height * 0.6, depth * 0.6]} />;
      default:
        return <boxGeometry args={[width, height, depth]} />;
    }
  };

  // Calculate rotation based on face normal
  const getRotation = () => {
    const [nx, ny, nz] = normal;
    
    if (Math.abs(ny) > 0.9) {
      // Top or bottom face
      return [0, 0, 0];
    } else if (Math.abs(nx) > 0.9) {
      // Left or right face
      return [0, 0, Math.PI / 2];
    } else if (Math.abs(nz) > 0.9) {
      // Front or back face
      return [Math.PI / 2, 0, 0];
    }
    
    return [0, 0, 0];
  };

  return (
    <group position={position} rotation={getRotation()}>
      {/* Main face highlight */}
      <mesh ref={meshRef}>
        {createFaceGeometry()}
        <meshBasicMaterial 
          color={getColor()}
          transparent
          opacity={getOpacity()}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Grid pattern overlay for TinkerCAD-style look */}
      <mesh>
        {createFaceGeometry()}
        <meshBasicMaterial 
          color={getColor()}
          transparent
          opacity={0.2}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Border outline */}
      <mesh>
        {createFaceGeometry()}
        <meshBasicMaterial 
          color={getColor()}
          transparent
          opacity={0.8}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Snap indicator arrow */}
      {isActive && (
        <group position={[0, 0, 0.1]}>
          <mesh>
            <coneGeometry args={[0.05, 0.1, 4]} />
            <meshBasicMaterial 
              color={0x00ff00}
              transparent
              opacity={0.9}
            />
          </mesh>
        </group>
      )}
      
      {/* Connection direction indicator */}
      {type.startsWith('face-') && (
        <group position={[0, 0, 0.15]}>
          <mesh>
            <planeGeometry args={[0.2, 0.1]} />
            <meshBasicMaterial 
              color={getColor()}
              transparent
              opacity={0.6}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default FaceHighlight;
