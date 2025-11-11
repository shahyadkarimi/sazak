import { useEffect, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useModelScene } from "@/hooks/useModelScene";
import { calculateSnapPoints, calculatePreviewPosition } from "@/helper/snapDetection";
import useModelStore from "@/store/useModelStore";

const ModelDragPreview = ({ snapDistance = 4 }) => {
  const [previewScenes, setPreviewScenes] = useState([]);
  const lastPositionRef = useRef(null);
  
  const draggedModelId = useModelStore((s) => s.draggedModelId);
  const existingModels = useModelStore((s) => s.selectedModels);
  
  // Get dragged model info
  const draggedModel = draggedModelId 
    ? existingModels.find(m => m.id === draggedModelId)
    : null;
  
  const { scene: adjustedScene, isValid } = useModelScene(
    draggedModel?.path || null
  );
  
  const isDragging = !!draggedModelId;

  // Update previews when position changes during drag
  const updatePreviews = () => {
    if (!isDragging || !isValid || !adjustedScene || !draggedModel) {
      setPreviewScenes([]);
      lastPositionRef.current = null;
      return;
    }

    const draggedModelPosition = draggedModel.position;
    const draggedModelRotation = draggedModel.rotation;
    const draggedModelDimensions = draggedModel.dimensions;
    
    // Check if position has changed (with small tolerance to avoid unnecessary updates)
    const positionKey = JSON.stringify(draggedModelPosition.map(p => Math.round(p * 100) / 100));
    if (lastPositionRef.current === positionKey) {
      return; // Position hasn't changed significantly, skip update
    }
    lastPositionRef.current = positionKey;

    // Calculate snap points from all other models
    const otherModels = existingModels.filter(m => m.id !== draggedModelId);
    
    // First, check which models are nearby (based on bounding box distance)
    const nearbyModels = [];
    for (const targetModel of otherModels) {
      const targetDims = targetModel.dimensions || { x: 1, y: 1, z: 1 };
      const draggedDims = draggedModelDimensions || { x: 1, y: 1, z: 1 };
      
      // Calculate distance between model centers
      const centerDistance = Math.sqrt(
        Math.pow(draggedModelPosition[0] - targetModel.position[0], 2) +
        Math.pow(draggedModelPosition[1] - targetModel.position[1], 2) +
        Math.pow(draggedModelPosition[2] - targetModel.position[2], 2)
      );
      
      // Calculate combined size (half of each dimension)
      const maxSize = Math.max(
        draggedDims.x + targetDims.x,
        draggedDims.y + targetDims.y,
        draggedDims.z + targetDims.z
      ) / 2;
      
      // If models are within snap distance (considering their sizes)
      if (centerDistance <= maxSize + snapDistance) {
        nearbyModels.push(targetModel);
      }
    }
    
    // If no nearby models, don't show preview
    if (nearbyModels.length === 0) {
      setPreviewScenes([]);
      return;
    }
    
    // Calculate snap points only from nearby models
    const snapPoints = calculateSnapPoints(
      {
        id: draggedModelId,
        position: draggedModelPosition,
        rotation: draggedModelRotation,
        path: draggedModel.path,
        dimensions: draggedModelDimensions
      },
      nearbyModels,
      snapDistance * 2 // Use larger snap distance for calculation
    );

    // Find snap points and calculate distances from dragged model center
    const pointsWithDistance = snapPoints
      .filter(point => {
        // Only show face and edge snap points
        return point.type.startsWith('face-') || point.type === 'edge';
      })
      .map(point => {
        const distance = Math.sqrt(
          Math.pow(point.position[0] - draggedModelPosition[0], 2) +
          Math.pow(point.position[1] - draggedModelPosition[1], 2) +
          Math.pow(point.position[2] - draggedModelPosition[2], 2)
        );
        return { ...point, distance };
      })
      .filter(point => point.distance <= snapDistance * 1.5) // More lenient filter
      .sort((a, b) => a.distance - b.distance);

    // Show the closest snap points (up to 3 for better visibility)
    // If multiple points are at the same distance, prefer face points over edge points
    let sortedSnapPoints = [];
    if (pointsWithDistance.length > 0) {
      const closestDistance = pointsWithDistance[0].distance;
      const tolerance = 0.2;
      const closestPoints = pointsWithDistance.filter(p => 
        Math.abs(p.distance - closestDistance) < tolerance
      );
      
      const facePoints = closestPoints.filter(p => p.type.startsWith('face-'));
      const edgePoints = closestPoints.filter(p => p.type === 'edge');
      
      sortedSnapPoints = [];
      if (facePoints.length > 0) {
        sortedSnapPoints.push(facePoints[0]);
      }
      if (sortedSnapPoints.length === 0 && edgePoints.length > 0) {
        sortedSnapPoints.push(edgePoints[0]);
      }
      if (sortedSnapPoints.length === 0 && closestPoints.length > 0) {
        sortedSnapPoints.push(closestPoints[0]);
      }
      
      sortedSnapPoints = sortedSnapPoints.slice(0, 1);
    }

    // Create preview scenes for each snap point
    const newPreviewScenes = sortedSnapPoints
      .map((snapPoint) => {
        // Calculate preview position
        const previewResult = calculatePreviewPosition(
          draggedModel.position,
          [snapPoint],
          snapDistance
        );

        const draggedDims = draggedModelDimensions || { x: 1, y: 1, z: 1 };
        const previewPos = previewResult.position;
        
        const tempGroup1 = new THREE.Group();
        const tempClone1 = adjustedScene.clone(true);
        tempClone1.scale.set(100, 100, 100);
        const box1 = new THREE.Box3().setFromObject(tempClone1);
        const center1 = new THREE.Vector3();
        box1.getCenter(center1);
        tempClone1.position.x = -center1.x;
        tempClone1.position.z = -center1.z;
        tempClone1.position.y = -box1.min.y;
        tempGroup1.add(tempClone1);
        tempGroup1.position.set(draggedModelPosition[0], draggedModelPosition[1], draggedModelPosition[2]);
        tempGroup1.rotation.set(draggedModelRotation[0], draggedModelRotation[1], draggedModelRotation[2]);
        tempGroup1.updateMatrixWorld(true);
        const draggedBox = new THREE.Box3().setFromObject(tempGroup1);
        
        const tempGroup2 = new THREE.Group();
        const tempClone2 = adjustedScene.clone(true);
        tempClone2.scale.set(100, 100, 100);
        const box2 = new THREE.Box3().setFromObject(tempClone2);
        const center2 = new THREE.Vector3();
        box2.getCenter(center2);
        tempClone2.position.x = -center2.x;
        tempClone2.position.z = -center2.z;
        tempClone2.position.y = -box2.min.y;
        tempGroup2.add(tempClone2);
        tempGroup2.position.set(previewPos[0], previewPos[1], previewPos[2]);
        tempGroup2.rotation.set(draggedModelRotation[0], draggedModelRotation[1], draggedModelRotation[2]);
        tempGroup2.updateMatrixWorld(true);
        const previewBox = new THREE.Box3().setFromObject(tempGroup2);
        
        const tolerance = 0.1;
        const overlaps = 
          draggedBox.min.x < previewBox.max.x + tolerance &&
          draggedBox.max.x > previewBox.min.x - tolerance &&
          draggedBox.min.y < previewBox.max.y + tolerance &&
          draggedBox.max.y > previewBox.min.y - tolerance &&
          draggedBox.min.z < previewBox.max.z + tolerance &&
          draggedBox.max.z > previewBox.min.z - tolerance;
        
        if (overlaps) {
          return null;
        }
        
        // Also check if distance is too small (less than half model size)
        const distanceToPreview = Math.sqrt(
          Math.pow(previewPos[0] - draggedModelPosition[0], 2) +
          Math.pow(previewPos[1] - draggedModelPosition[1], 2) +
          Math.pow(previewPos[2] - draggedModelPosition[2], 2)
        );
        
        const minDistance = Math.min(draggedDims.x, draggedDims.z) * 0.3;
        if (distanceToPreview < minDistance) {
          return null; // Skip this preview
        }

        // Clone the model scene for preview
        const clonedScene = adjustedScene.clone(true);

      // Apply scale if needed (should already be scaled)
      clonedScene.scale.set(100, 100, 100);

      // Apply centering
      const box = new THREE.Box3().setFromObject(clonedScene);
      const center = new THREE.Vector3();
      box.getCenter(center);
      clonedScene.position.x = -center.x;
      clonedScene.position.z = -center.z;
      clonedScene.position.y = -box.min.y;

      // Make preview semi-transparent with gray color
      clonedScene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.5;
          
          // Gray color for preview (0x808080)
          child.material.color = new THREE.Color(0x808080);
          child.material.emissive = new THREE.Color(0x808080);
          child.material.emissiveIntensity = 0.2;
          
          // Disable depth write to prevent z-fighting
          if ('depthWrite' in child.material) {
            child.material.depthWrite = false;
          }
          
          // Render order to appear on top
          child.renderOrder = 999;
        }
      });

        return {
          scene: clonedScene,
          position: previewResult.position,
          snapPoint: snapPoint,
          rotation: draggedModel.rotation
        };
      })
      .filter(preview => preview !== null); // Remove null previews

    setPreviewScenes(newPreviewScenes);
  };

  // Update on drag start/end or when model changes
  useEffect(() => {
    updatePreviews();
  }, [
    isDragging,
    isValid,
    adjustedScene,
    draggedModelId,
    existingModels,
    snapDistance
  ]);

  // Update every frame during drag to catch position changes
  useFrame(() => {
    if (isDragging && draggedModel) {
      updatePreviews();
    }
  });

  if (!isDragging || previewScenes.length === 0) {
    return null;
  }

  return (
    <>
      {previewScenes.map((preview, index) => (
        <group
          key={`preview-${index}`}
          position={preview.position}
          rotation={preview.rotation}
        >
          <primitive object={preview.scene} />
        </group>
      ))}
    </>
  );
};

export default ModelDragPreview;

