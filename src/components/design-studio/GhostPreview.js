import React, { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useModelStore from '@/store/useModelStore';
import { useModelScene } from '@/hooks/useModelScene';
import { getModelDimensions, getModelType } from '@/helper/snapDetection';

const GhostPreview = () => {
  const draggedModelPreviewPosition = useModelStore((state) => state.draggedModelPreviewPosition);
  const isSnapping = useModelStore((state) => state.isSnapping);
  const selectedModelId = useModelStore((state) => state.selectedModelId);
  const selectedModels = useModelStore((state) => state.selectedModels);
  const [ghostScene, setGhostScene] = useState(null);

  // Get the currently dragged model
  const draggedModel = selectedModels.find(model => model.id === selectedModelId);

  // Load the model scene for ghost preview
  const { scene: adjustedScene, isValid } = useModelScene(draggedModel?.path || null);

  useEffect(() => {
    if (draggedModel && draggedModel.path && adjustedScene && isValid) {
      const clone = adjustedScene.clone(true);
        
      // Apply scale
      clone.scale.set(100, 100, 100);
      
      // Apply centering logic
      const box = new THREE.Box3().setFromObject(clone);
      const center = new THREE.Vector3();
      box.getCenter(center);
      
      // Center the model horizontally and place bottom at y=0
      clone.position.x = -center.x;
      clone.position.z = -center.z;
      clone.position.y = -box.min.y;
      
      // Apply ghost styling
      clone.traverse((child) => {
        if (child.isMesh && child.material && child.geometry) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = isSnapping ? 0.6 : 0.4;
          
          // Green color for snapping, blue for hovering
          child.material.color = new THREE.Color(isSnapping ? 0x00ff00 : 0x0066ff);
          
          // Add emissive glow for snapping
          if (isSnapping) {
            child.material.emissive = new THREE.Color(0x00ff00);
            child.material.emissiveIntensity = 0.2;
          } else {
            child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0;
          }
        }
      });
      
      setGhostScene(clone);
    } else {
      setGhostScene(null);
    }
  }, [draggedModel, isSnapping, adjustedScene, isValid]);

  if (!draggedModelPreviewPosition || !ghostScene) return null;

  // Get model dimensions for outline
  const modelType = getModelType(draggedModel.path);
  const modelDims = getModelDimensions(modelType);

  return (
    <group position={draggedModelPreviewPosition}>
      <primitive object={ghostScene} />
      
      {/* Ghost outline based on actual model dimensions */}
      <mesh>
        <boxGeometry args={[modelDims.x, modelDims.y, modelDims.z]} />
        <meshBasicMaterial 
          color={isSnapping ? 0x00ff00 : 0x0066ff}
          transparent
          opacity={0.2}
          wireframe
        />
      </mesh>
      
      {/* Snap indicator */}
      {isSnapping && (
        <group position={[0, modelDims.y/2 + 0.1, 0]}>
          <mesh>
            <coneGeometry args={[0.1, 0.2, 4]} />
            <meshBasicMaterial 
              color={0x00ff00}
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default GhostPreview;