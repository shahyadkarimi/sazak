import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useModelStore from '@/store/useModelStore';
import { useModelScene } from '@/hooks/useModelScene';
import { getModelDimensions, getModelType } from '@/helper/snapDetection';

const ModelPreview = () => {
  const currentPlacingModel = useModelStore((state) => state.currentPlacingModel);
  const { scene: adjustedScene, isValid } = useModelScene(currentPlacingModel || null);
  const previewPosition = useModelStore((state) => state.previewPosition);
  const isSnapping = useModelStore((state) => state.isSnapping);
  const isPreviewMode = useModelStore((state) => state.isPreviewMode);
  const currentPlacingModelColor = useModelStore((state) => state.currentPlacingModelColor);
  const [previewScene, setPreviewScene] = useState(null);
  const pulseRef = useRef(0);

  useEffect(() => {
    if (adjustedScene && isValid) {
      const clone = adjustedScene.clone(true);
      
      // Apply scale
      clone.scale.set(100, 100, 100);
      
      // Apply centering logic like ModelPlacer
      const box = new THREE.Box3().setFromObject(clone);
      const center = new THREE.Vector3();
      box.getCenter(center);
      
      // Center the model horizontally and place bottom at y=0
      clone.position.x = -center.x;
      clone.position.z = -center.z;
      clone.position.y = -box.min.y;
      
      // Apply preview styling
      clone.traverse((child) => {
        if (child.isMesh && child.material && child.geometry) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = isSnapping ? 0.8 : 0.5;
          
          if (currentPlacingModelColor) {
            child.material.color = new THREE.Color(currentPlacingModelColor);
          } else {
            child.material.color = new THREE.Color(0x00ff00); // Green for preview
          }
          
          // Add emissive glow for snapping
          if (isSnapping) {
            child.material.emissive = new THREE.Color(0x00ff00);
            child.material.emissiveIntensity = 0.3;
          } else {
            child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0;
          }
        }
      });
      
      setPreviewScene(clone);
    }
  }, [adjustedScene, isValid, isSnapping, currentPlacingModelColor]);

  // Pulse animation for snapping
  useFrame((state, delta) => {
    if (isSnapping) {
      pulseRef.current += delta * 3; // Speed of pulse
    }
  });

  if (!isPreviewMode || !previewPosition || !previewScene) return null;

  // Get model dimensions for better preview outline
  const modelType = getModelType(currentPlacingModel);
  const modelDims = getModelDimensions(modelType);

  // Calculate pulse scale for snapping animation
  const pulseScale = isSnapping ? 1 + Math.sin(pulseRef.current) * 0.1 : 1;

  return (
    <group position={previewPosition} scale={[pulseScale, pulseScale, pulseScale]}>
      <primitive object={previewScene} />
      
      {/* Preview outline based on actual model dimensions */}
      <mesh>
        <boxGeometry args={[modelDims.x, modelDims.y, modelDims.z]} />
        <meshBasicMaterial 
          color={isSnapping ? 0x00ff00 : 0xff6600}
          transparent
          opacity={isSnapping ? 0.4 : 0.2}
          wireframe
        />
      </mesh>
      
      {/* Connection indicators showing attachment points */}
      <group>
        {/* Top face indicator */}
        <mesh position={[0, modelDims.y/2 + 0.01, 0]}>
          <boxGeometry args={[modelDims.x * 0.8, 0.02, modelDims.z * 0.8]} />
          <meshBasicMaterial 
            color={isSnapping ? 0x00ff00 : 0xff6600}
            transparent
            opacity={0.5}
          />
        </mesh>
        
        {/* Bottom face indicator */}
        <mesh position={[0, -modelDims.y/2 - 0.01, 0]}>
          <boxGeometry args={[modelDims.x * 0.8, 0.02, modelDims.z * 0.8]} />
          <meshBasicMaterial 
            color={isSnapping ? 0x00ff00 : 0xff6600}
            transparent
            opacity={0.5}
          />
        </mesh>
        
        {/* Side face indicators */}
        <mesh position={[-modelDims.x/2 - 0.01, 0, 0]}>
          <boxGeometry args={[0.02, modelDims.y * 0.8, modelDims.z * 0.8]} />
          <meshBasicMaterial 
            color={isSnapping ? 0x00ff00 : 0xff6600}
            transparent
            opacity={0.5}
          />
        </mesh>
        
        <mesh position={[modelDims.x/2 + 0.01, 0, 0]}>
          <boxGeometry args={[0.02, modelDims.y * 0.8, modelDims.z * 0.8]} />
          <meshBasicMaterial 
            color={isSnapping ? 0x00ff00 : 0xff6600}
            transparent
            opacity={0.5}
          />
        </mesh>
        
        <mesh position={[0, 0, -modelDims.z/2 - 0.01]}>
          <boxGeometry args={[modelDims.x * 0.8, modelDims.y * 0.8, 0.02]} />
          <meshBasicMaterial 
            color={isSnapping ? 0x00ff00 : 0xff6600}
            transparent
            opacity={0.5}
          />
        </mesh>
        
        <mesh position={[0, 0, modelDims.z/2 + 0.01]}>
          <boxGeometry args={[modelDims.x * 0.8, modelDims.y * 0.8, 0.02]} />
          <meshBasicMaterial 
            color={isSnapping ? 0x00ff00 : 0xff6600}
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>
    </group>
  );
};

export default ModelPreview;
