import * as THREE from 'three';

// تابع تشخیص نوع مدل بر اساس نام فایل
export const getModelType = (modelPath) => {
  if (!modelPath) return 'default';
  
  if (modelPath.includes('U_Piece')) return 'U';
  if (modelPath.includes('L_Piece')) return 'L';
  if (modelPath.includes('I_Piece')) return 'I';
  if (modelPath.includes('3_ways')) return '3way';
  
  return 'default';
};

// تابع محاسبه ابعاد مدل بر اساس نوع
export const getModelDimensions = (modelType, baseSize = 1) => {
  const dimensions = {
    U: { x: baseSize * 1.5, y: baseSize, z: baseSize },
    L: { x: baseSize * 1.2, y: baseSize, z: baseSize * 1.2 },
    I: { x: baseSize, y: baseSize, z: baseSize * 1.5 },
    '3way': { x: baseSize * 1.3, y: baseSize, z: baseSize * 1.3 },
    default: { x: baseSize, y: baseSize, z: baseSize }
  };
  
  return dimensions[modelType] || dimensions.default;
};

/**
 * Apply rotation to model dimensions for accurate face detection
 * @param {Object} dims - Original dimensions {x, y, z}
 * @param {Array} rotation - Rotation [x, y, z] in radians
 * @returns {Object} Rotated dimensions
 */
export const applyRotationToDimensions = (dims, rotation) => {
  const [rotX, rotY, rotZ] = rotation;
  
  const absRotY = Math.abs(rotY) % (Math.PI / 2);
  const absRotX = Math.abs(rotX) % (Math.PI / 2);
  const absRotZ = Math.abs(rotZ) % (Math.PI / 2);
  
  let rotatedDims = { ...dims };
  
  const isRotZ90 = Math.abs(absRotZ - Math.PI / 2) < 0.1;
  const isRotY90 = Math.abs(absRotY - Math.PI / 2) < 0.1;
  const isRotX90 = Math.abs(absRotX - Math.PI / 2) < 0.1;
  
  if (isRotZ90 && !isRotY90 && !isRotX90) {
    rotatedDims = { x: dims.y, y: dims.x, z: dims.z };
  } else if (isRotY90 && !isRotZ90 && !isRotX90) {
    rotatedDims = { x: dims.z, y: dims.y, z: dims.x };
  } else if (isRotX90 && !isRotZ90 && !isRotY90) {
    rotatedDims = { x: dims.x, y: dims.z, z: dims.y };
  } else if (absRotZ > 0.1 || absRotY > 0.1 || absRotX > 0.1) {
    const maxDim = Math.max(dims.x, dims.y, dims.z);
    rotatedDims = { x: maxDim, y: maxDim, z: maxDim };
  }
  
  return rotatedDims;
};

/**
 * Calculate snap points for a model based on its geometry and position
 * @param {Object} model - The model object with position, rotation, and geometry info
 * @param {Array} existingModels - Array of existing models to snap to
 * @param {number} snapDistance - Maximum distance for snapping
 * @returns {Array} Array of snap points
 */
export const calculateSnapPoints = (model, existingModels, snapDistance = 2) => {
  const snapPoints = [];
  
  if (!model || !existingModels || existingModels.length === 0) {
    return snapPoints;
  }

  // For each existing model, calculate potential snap points
  existingModels.forEach(targetModel => {
    if (targetModel.id === model.id) return; // Skip self

    const targetPos = targetModel.position;
    const targetType = getModelType(targetModel.path);
    const targetDims = getModelDimensions(targetType);
    
    // Apply rotation to dimensions for more accurate face detection
    const rotation = targetModel.rotation || [0, 0, 0];
    const rotatedDims = applyRotationToDimensions(targetDims, rotation);
    
    // Calculate potential attachment points around the target model
    // These represent common connection points like edges, corners, and faces
    
    // Use rotated dimensions for accurate face detection
    const effectiveDims = rotatedDims;
    
    // Corner points based on rotated model dimensions
    const cornerOffsets = [
      [-effectiveDims.x/2, 0, -effectiveDims.z/2], 
      [effectiveDims.x/2, 0, -effectiveDims.z/2], 
      [-effectiveDims.x/2, 0, effectiveDims.z/2], 
      [effectiveDims.x/2, 0, effectiveDims.z/2],
      [-effectiveDims.x/2, effectiveDims.y, -effectiveDims.z/2], 
      [effectiveDims.x/2, effectiveDims.y, -effectiveDims.z/2], 
      [-effectiveDims.x/2, effectiveDims.y, effectiveDims.z/2], 
      [effectiveDims.x/2, effectiveDims.y, effectiveDims.z/2]
    ];
    
    cornerOffsets.forEach(offset => {
      snapPoints.push({
        position: [
          targetPos[0] + offset[0],
          targetPos[1] + offset[1],
          targetPos[2] + offset[2]
        ],
        type: 'corner',
        targetModelId: targetModel.id,
        normal: [offset[0], offset[1], offset[2]],
        modelType: targetType
      });
    });

    // Edge midpoints based on rotated model dimensions
    const edgeOffsets = [
      [-effectiveDims.x/2, 0, 0], [effectiveDims.x/2, 0, 0], 
      [0, 0, -effectiveDims.z/2], [0, 0, effectiveDims.z/2],
      [-effectiveDims.x/2, effectiveDims.y, 0], [effectiveDims.x/2, effectiveDims.y, 0], 
      [0, effectiveDims.y, -effectiveDims.z/2], [0, effectiveDims.y, effectiveDims.z/2],
      [-effectiveDims.x/2, effectiveDims.y/2, -effectiveDims.z/2], 
      [effectiveDims.x/2, effectiveDims.y/2, -effectiveDims.z/2], 
      [-effectiveDims.x/2, effectiveDims.y/2, effectiveDims.z/2], 
      [effectiveDims.x/2, effectiveDims.y/2, effectiveDims.z/2]
    ];
    
    edgeOffsets.forEach(offset => {
      snapPoints.push({
        position: [
          targetPos[0] + offset[0],
          targetPos[1] + offset[1],
          targetPos[2] + offset[2]
        ],
        type: 'edge',
        targetModelId: targetModel.id,
        normal: [offset[0], offset[1], offset[2]],
        modelType: targetType
      });
    });

    // Face centers with more detailed attachment points for robotic structures
    const faceOffsets = [
      // Top and bottom faces
      { offset: [0, effectiveDims.y, 0], normal: [0, 1, 0], type: 'face-top' },
      { offset: [0, 0, 0], normal: [0, -1, 0], type: 'face-bottom' },
      // Side faces
      { offset: [-effectiveDims.x/2, effectiveDims.y/2, 0], normal: [-1, 0, 0], type: 'face-left' },
      { offset: [effectiveDims.x/2, effectiveDims.y/2, 0], normal: [1, 0, 0], type: 'face-right' },
      { offset: [0, effectiveDims.y/2, -effectiveDims.z/2], normal: [0, 0, -1], type: 'face-front' },
      { offset: [0, effectiveDims.y/2, effectiveDims.z/2], normal: [0, 0, 1], type: 'face-back' }
    ];
    
    // Add special connection points for U-shaped models
    if (targetType === 'U') {
      // Inner connection points for U shape
      faceOffsets.push(
        { offset: [-effectiveDims.x/4, effectiveDims.y/2, 0], normal: [-1, 0, 0], type: 'face-inner-left' },
        { offset: [effectiveDims.x/4, effectiveDims.y/2, 0], normal: [1, 0, 0], type: 'face-inner-right' }
      );
    }
    
    // Add special connection points for L-shaped models
    if (targetType === 'L') {
      // Corner connection points for L shape
      faceOffsets.push(
        { offset: [0, effectiveDims.y/2, 0], normal: [0, 0, 1], type: 'face-corner' }
      );
    }
    
    faceOffsets.forEach(face => {
      snapPoints.push({
        position: [
          targetPos[0] + face.offset[0],
          targetPos[1] + face.offset[1],
          targetPos[2] + face.offset[2]
        ],
        type: face.type,
        targetModelId: targetModel.id,
        normal: face.normal,
        modelType: targetType,
        // Add attachment area for better preview
        attachmentArea: {
          width: effectiveDims.x,
          height: effectiveDims.y,
          depth: 0.1
        }
      });
    });
  });

  return snapPoints;
};

/**
 * Find the nearest snap point to a given position
 * @param {Array} position - [x, y, z] position to check
 * @param {Array} snapPoints - Array of snap points
 * @param {number} snapDistance - Maximum snap distance
 * @returns {Object|null} Nearest snap point or null
 */
export const findNearestSnapPoint = (position, snapPoints, snapDistance = 2) => {
  if (!position || !snapPoints || snapPoints.length === 0) return null;

  let nearestPoint = null;
  let minDistance = Infinity;

  snapPoints.forEach(point => {
    const distance = Math.sqrt(
      Math.pow(point.position[0] - position[0], 2) +
      Math.pow(point.position[1] - position[1], 2) +
      Math.pow(point.position[2] - position[2], 2)
    );

    if (distance < snapDistance && distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
    }
  });

  return nearestPoint;
};

/**
 * Enhanced collision detection with precise stacking and overlap prevention
 * @param {Array} newPos - New position [x, y, z]
 * @param {Object} currentModel - Current model being moved
 * @param {Array} allModels - All existing models
 * @param {number} snapSize - Grid snap size
 * @returns {Object} { position, isStacked, stackHeight, collisionModel }
 */
export const checkCollisionAndStack = (newPos, currentModel, allModels, snapSize = 1) => {
  const originalModel = allModels.find(m => m.id === currentModel.id);
  const baseDims = (currentModel.dimensions || (originalModel && originalModel.dimensions))
    ? (currentModel.dimensions || originalModel.dimensions)
    : getModelDimensions(getModelType(currentModel.path));
  
  const rotation = currentModel.rotation || [0, 0, 0];
  const currentModelDims = applyRotationToDimensions(baseDims, rotation);
  
  let maxStackHeight = 0;
  let collisionModel = null;
  let isStacked = false;
  let finalPosition = [...newPos];
  
  const absRotZ = Math.abs(rotation[2]) % (Math.PI / 2);
  const isRotZ90 = Math.abs(absRotZ - Math.PI / 2) < 0.1;
  const isRotZNon90 = absRotZ > 0.1 && !isRotZ90;
  const hasAnyRotation = Math.abs(rotation[0]) > 0.1 || Math.abs(rotation[1]) > 0.1 || Math.abs(rotation[2]) > 0.1;
  
  const tolerance = (isRotZNon90 || hasAnyRotation) ? 0.1 : 0.02;
  const snapThreshold = 0.4;
  const minGap = 0.02;
  
  let maxTopY = 0;
  let hasHorizontalOverlap = false;
  const groundLevelY = currentModelDims.y / 2;
  
  for (const model of allModels) {
    if (model.id === currentModel.id) continue;
    
    const modelBaseDims = model.dimensions || getModelDimensions(getModelType(model.path));
    const modelRotation = model.rotation || [0, 0, 0];
    const modelDims = applyRotationToDimensions(modelBaseDims, modelRotation);
    
    const modelBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(model.position[0], model.position[1], model.position[2]),
      new THREE.Vector3(modelDims.x, modelDims.y, modelDims.z)
    );
    
    const currentBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(newPos[0], groundLevelY, newPos[2]),
      new THREE.Vector3(currentModelDims.x, currentModelDims.y, currentModelDims.z)
    );
    
    const hOverlap = 
      currentBox.min.x < modelBox.max.x - tolerance &&
      currentBox.max.x > modelBox.min.x + tolerance &&
      currentBox.min.z < modelBox.max.z - tolerance &&
      currentBox.max.z > modelBox.min.z + tolerance;
    
    if (hOverlap) {
      hasHorizontalOverlap = true;
      // Find the top of this model (including if it's stacked on others)
      const topY = modelBox.max.y;
      maxTopY = Math.max(maxTopY, topY);
      collisionModel = model;
    }
  }
  
  // If there's horizontal overlap, stack on top
  if (hasHorizontalOverlap) {
    isStacked = true;
    // Calculate stack height: top of highest model + half current model height + gap
    maxStackHeight = maxTopY + (currentModelDims.y / 2) + minGap;
    
    // Keep X and Z position
    finalPosition[0] = newPos[0];
    finalPosition[2] = newPos[2];
    
    if (snapSize > 0) {
      finalPosition[0] = Math.round(finalPosition[0] / snapSize) * snapSize;
      finalPosition[2] = Math.round(finalPosition[2] / snapSize) * snapSize;
    }
  } else {
    // No horizontal overlap - ensure we're not stacked and return to ground
    isStacked = false;
    maxStackHeight = 0;
    finalPosition[1] = groundLevelY; // Set to ground level immediately
    
    // Keep X and Z position
    finalPosition[0] = newPos[0];
    finalPosition[2] = newPos[2];
    
    if (snapSize > 0) {
      finalPosition[0] = Math.round(finalPosition[0] / snapSize) * snapSize;
      finalPosition[2] = Math.round(finalPosition[2] / snapSize) * snapSize;
    }
    
    // Return early - no need to check for snap or other collisions
    return {
      position: finalPosition,
      isStacked: false,
      stackHeight: 0,
      collisionModel: null
    };
  }
  
  for (const model of allModels) {
    if (model.id === currentModel.id) continue;
    
    const modelBaseDims = model.dimensions || getModelDimensions(getModelType(model.path));
    const modelRotation = model.rotation || [0, 0, 0];
    const modelDims = applyRotationToDimensions(modelBaseDims, modelRotation);
    
    const currentBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(newPos[0], groundLevelY, newPos[2]),
      new THREE.Vector3(currentModelDims.x, currentModelDims.y, currentModelDims.z)
    );
    
    const modelBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(model.position[0], model.position[1], model.position[2]),
      new THREE.Vector3(modelDims.x, modelDims.y, modelDims.z)
    );
    
    // Check overlaps - horizontal overlap at ground level
    const horizontalOverlap = 
      currentBox.min.x < modelBox.max.x - tolerance &&
      currentBox.max.x > modelBox.min.x + tolerance &&
      currentBox.min.z < modelBox.max.z - tolerance &&
      currentBox.max.z > modelBox.min.z + tolerance;
    
    // Check vertical overlap - use proposed stack height for current model
    const proposedY = maxStackHeight > 0 ? maxStackHeight : groundLevelY;
    const proposedBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(newPos[0], proposedY, newPos[2]),
      new THREE.Vector3(currentModelDims.x, currentModelDims.y, currentModelDims.z)
    );
    
    const verticalOverlap = 
      proposedBox.min.y < modelBox.max.y - tolerance &&
      proposedBox.max.y > modelBox.min.y + tolerance;
    
    // Calculate distances
    const dx = newPos[0] - model.position[0];
    const dz = newPos[2] - model.position[2];
    const distX = Math.abs(dx);
    const distZ = Math.abs(dz);
    
    const minSepX = (currentModelDims.x / 2) + (modelDims.x / 2);
    const minSepZ = (currentModelDims.z / 2) + (modelDims.z / 2);
    
    // If overlapping horizontally, always stack on top (prevent penetration)
    if (horizontalOverlap) {
      // Always stack on top of the model - ensure no penetration
      const stackHeight = modelBox.max.y + (currentModelDims.y / 2) + minGap;
      maxStackHeight = Math.max(maxStackHeight, stackHeight);
      if (!collisionModel) collisionModel = model;
      isStacked = true;
      
      // Keep X and Z position (align horizontally)
      finalPosition[0] = newPos[0];
      finalPosition[2] = newPos[2];
      
      if (snapSize > 0) {
        finalPosition[0] = Math.round(finalPosition[0] / snapSize) * snapSize;
        finalPosition[2] = Math.round(finalPosition[2] / snapSize) * snapSize;
      }
    }
    // If close enough, snap and potentially stack (only if no horizontal overlap)
    else if (!horizontalOverlap) {
      const snapX = distX >= minSepX - snapThreshold && distX <= minSepX + snapThreshold;
      const snapZ = distZ >= minSepZ - snapThreshold && distZ <= minSepZ + snapThreshold;
      
      if (snapX || snapZ) {
        // Snap to face
        if (snapX) {
          finalPosition[0] = model.position[0] + (dx > 0 ? minSepX : -minSepX);
        }
        if (snapZ) {
          finalPosition[2] = model.position[2] + (dz > 0 ? minSepZ : -minSepZ);
        }
        
        if (snapSize > 0) {
          finalPosition[0] = Math.round(finalPosition[0] / snapSize) * snapSize;
          finalPosition[2] = Math.round(finalPosition[2] / snapSize) * snapSize;
        }
        
        // Check if now tightly attached (both axes snapped)
        const newDx = finalPosition[0] - model.position[0];
        const newDz = finalPosition[2] - model.position[2];
        const newDistX = Math.abs(newDx);
        const newDistZ = Math.abs(newDz);
        
        const isTightlyAttached = 
          Math.abs(newDistX - minSepX) < 0.1 && Math.abs(newDistZ - minSepZ) < 0.1;
        
        if (isTightlyAttached) {
          // Check if this creates horizontal overlap after snapping
          const snappedBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(finalPosition[0], groundLevelY, finalPosition[2]),
            new THREE.Vector3(currentModelDims.x, currentModelDims.y, currentModelDims.z)
          );
          
          const snappedHOverlap = 
            snappedBox.min.x < modelBox.max.x - tolerance &&
            snappedBox.max.x > modelBox.min.x + tolerance &&
            snappedBox.min.z < modelBox.max.z - tolerance &&
            snappedBox.max.z > modelBox.min.z + tolerance;
          
          if (snappedHOverlap) {
            // Stack on top - ensure no penetration
            const stackHeight = modelBox.max.y + (currentModelDims.y / 2) + minGap;
            maxStackHeight = Math.max(maxStackHeight, stackHeight);
            if (!collisionModel) collisionModel = model;
            isStacked = true;
          }
        }
      }
    }
  }
  
  // Set Y position - ensure it's always above any overlapping models
  if (isStacked) {
    // Double-check: make sure we're above all horizontally overlapping models
    let finalStackHeight = maxStackHeight;
    
    for (const model of allModels) {
      if (model.id === currentModel.id) continue;
      
      const modelDims = model.dimensions || getModelDimensions(getModelType(model.path));
      const modelBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(model.position[0], model.position[1], model.position[2]),
        new THREE.Vector3(modelDims.x, modelDims.y, modelDims.z)
      );
      
      const testBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(finalPosition[0], finalStackHeight, finalPosition[2]),
        new THREE.Vector3(currentModelDims.x, currentModelDims.y, currentModelDims.z)
      );
      
      const hOverlap = 
        testBox.min.x < modelBox.max.x - tolerance &&
        testBox.max.x > modelBox.min.x + tolerance &&
        testBox.min.z < modelBox.max.z - tolerance &&
        testBox.max.z > modelBox.min.z + tolerance;
      
      if (hOverlap) {
        // Make sure we're above this model - prevent any penetration
        const requiredHeight = modelBox.max.y + (currentModelDims.y / 2) + minGap;
        finalStackHeight = Math.max(finalStackHeight, requiredHeight);
        
        // Also check if current model's bottom would penetrate this model's top
        const currentModelBottom = finalStackHeight - (currentModelDims.y / 2);
        if (currentModelBottom < modelBox.max.y + minGap) {
          finalStackHeight = modelBox.max.y + (currentModelDims.y / 2) + minGap;
        }
      }
    }
    
    finalPosition[1] = finalStackHeight;
    
    // Verify no overlap after stacking
    for (const model of allModels) {
      if (model.id === currentModel.id) continue;
      
      const modelDims = model.dimensions || getModelDimensions(getModelType(model.path));
      const stackedBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(finalPosition[0], finalPosition[1], finalPosition[2]),
        new THREE.Vector3(currentModelDims.x, currentModelDims.y, currentModelDims.z)
      );
      const otherBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(model.position[0], model.position[1], model.position[2]),
        new THREE.Vector3(modelDims.x, modelDims.y, modelDims.z)
      );
      
      const hOverlap = 
        stackedBox.min.x < otherBox.max.x - tolerance &&
        stackedBox.max.x > otherBox.min.x + tolerance &&
        stackedBox.min.z < otherBox.max.z - tolerance &&
        stackedBox.max.z > otherBox.min.z + tolerance;
      
      const vOverlap = 
        stackedBox.min.y < otherBox.max.y - tolerance &&
        stackedBox.max.y > otherBox.min.y + tolerance;
      
      if (hOverlap && vOverlap) {
        // There's still penetration - increase height to prevent it
        const requiredHeight = otherBox.max.y + (currentModelDims.y / 2) + minGap;
        finalStackHeight = Math.max(finalStackHeight, requiredHeight);
        finalPosition[1] = finalStackHeight;
        
        // Re-check with new height
        const newStackedBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(finalPosition[0], finalPosition[1], finalPosition[2]),
          new THREE.Vector3(currentModelDims.x, currentModelDims.y, currentModelDims.z)
        );
        
        const stillOverlapping = 
          newStackedBox.min.y < otherBox.max.y - tolerance &&
          newStackedBox.max.y > otherBox.min.y + tolerance;
        
        if (stillOverlapping) {
          // If still overlapping after height adjustment, push away horizontally
          const dx = finalPosition[0] - model.position[0];
          const dz = finalPosition[2] - model.position[2];
          const minSepX = (currentModelDims.x / 2) + (modelDims.x / 2);
          const minSepZ = (currentModelDims.z / 2) + (modelDims.z / 2);
          
          const overlapX = Math.min(
            newStackedBox.max.x - otherBox.min.x,
            otherBox.max.x - newStackedBox.min.x
          );
          const overlapZ = Math.min(
            newStackedBox.max.z - otherBox.min.z,
            otherBox.max.z - newStackedBox.min.z
          );
          
          if (overlapX > overlapZ) {
            // Push in Z direction
            finalPosition[2] = model.position[2] + (dz > 0 ? minSepZ + 0.02 : -(minSepZ + 0.02));
          } else {
            // Push in X direction
            finalPosition[0] = model.position[0] + (dx > 0 ? minSepX + 0.02 : -(minSepX + 0.02));
          }
          
          if (snapSize > 0) {
            finalPosition[0] = Math.round(finalPosition[0] / snapSize) * snapSize;
            finalPosition[2] = Math.round(finalPosition[2] / snapSize) * snapSize;
          }
          
          // Re-check horizontal overlap after pushing
          const pushedBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(finalPosition[0], groundLevelY, finalPosition[2]),
            new THREE.Vector3(currentModelDims.x, currentModelDims.y, currentModelDims.z)
          );
          
          const stillHOverlap = 
            pushedBox.min.x < otherBox.max.x - tolerance &&
            pushedBox.max.x > otherBox.min.x + tolerance &&
            pushedBox.min.z < otherBox.max.z - tolerance &&
            pushedBox.max.z > otherBox.min.z + tolerance;
          
          if (!stillHOverlap) {
            // No longer overlapping horizontally - return to ground
            finalPosition[1] = currentModelDims.y / 2;
            isStacked = false;
            maxStackHeight = 0;
          }
        }
      }
    }
  } else {
    // No stack - check if there's any horizontal overlap
    // If no overlap, return to ground level
    let hasAnyHorizontalOverlap = false;
    
    for (const model of allModels) {
      if (model.id === currentModel.id) continue;
      
      const modelDims = model.dimensions || getModelDimensions(getModelType(model.path));
      const modelBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(model.position[0], model.position[1], model.position[2]),
        new THREE.Vector3(modelDims.x, modelDims.y, modelDims.z)
      );
      
      // Use ground level Y for overlap check to see if models overlap horizontally
      const groundLevelY = currentModelDims.y / 2;
      const currentBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(finalPosition[0], groundLevelY, finalPosition[2]),
        new THREE.Vector3(currentModelDims.x, currentModelDims.y, currentModelDims.z)
      );
      
      const hOverlap = 
        currentBox.min.x < modelBox.max.x - tolerance &&
        currentBox.max.x > modelBox.min.x + tolerance &&
        currentBox.min.z < modelBox.max.z - tolerance &&
        currentBox.max.z > modelBox.min.z + tolerance;
      
      if (hOverlap) {
        hasAnyHorizontalOverlap = true;
        // If there's horizontal overlap, stack on top
        const stackHeight = modelBox.max.y + (currentModelDims.y / 2) + minGap;
        maxStackHeight = Math.max(maxStackHeight, stackHeight);
        isStacked = true;
      }
    }
    
    if (isStacked) {
      finalPosition[1] = maxStackHeight;
    } else {
      // No horizontal overlap - return to ground level
      // Ground level is half the model height (so bottom of model is at y=0)
      finalPosition[1] = currentModelDims.y / 2;
    }
  }
  
  return {
    position: finalPosition,
    isStacked,
    stackHeight: maxStackHeight,
    collisionModel
  };
};

/**
 * Check if model is floating above others and needs to be pulled down
 * @param {Array} position - Current position [x, y, z]
 * @param {Object} currentModel - Current model
 * @param {Array} allModels - All existing models
 * @param {number} snapSize - Grid snap size
 * @returns {Object} { position, isFloating, groundLevel }
 */
export const checkFloatingAndGround = (position, currentModel, allModels, snapSize = 1) => {
  // Use real dimensions from store if available, otherwise use default
  const currentModelDims = currentModel.dimensions || getModelDimensions(getModelType(currentModel.path));
  
  // Create bounding box for current model
  const currentModelBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(position[0], position[1], position[2]),
    new THREE.Vector3(currentModelDims.x, currentModelDims.y, currentModelDims.z)
  );
  
  let maxGroundLevel = 0;
  let isFloating = false;
  
  // Check if model is floating above any other model
  for (const model of allModels) {
    if (model.id === currentModel.id) continue;
    
    // Use real dimensions from store if available, otherwise use default
    const modelDims = model.dimensions || getModelDimensions(getModelType(model.path));
    
    // Create bounding box for existing model
    const modelBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(model.position[0], model.position[1], model.position[2]),
      new THREE.Vector3(modelDims.x, modelDims.y, modelDims.z)
    );
    
    // Check if current model is above this model horizontally
    const horizontalOverlap = 
      currentModelBox.min.x < modelBox.max.x &&
      currentModelBox.max.x > modelBox.min.x &&
      currentModelBox.min.z < modelBox.max.z &&
      currentModelBox.max.z > modelBox.min.z;
    
    if (horizontalOverlap) {
      // Model is above another model, calculate ground level
      const groundLevel = modelBox.max.y + (currentModelDims.y / 2);
      maxGroundLevel = Math.max(maxGroundLevel, groundLevel);
      isFloating = true;
    }
  }
  
  // If has overlap, place model on top
  if (isFloating && maxGroundLevel > 0) {
    return {
      position: [position[0], maxGroundLevel, position[2]],
      isFloating: true,
      groundLevel: maxGroundLevel
    };
  }
  
  // No overlap - model should be at ground level (y = dimensions.y / 2)
  const groundLevel = (currentModelDims.y / 2);
  return {
    position: [position[0], groundLevel, position[2]],
    isFloating: false,
    groundLevel: groundLevel
  };
};

/**
 * Enhanced collision detection that prevents models from going through each other
 * and ensures they stick together without gaps
 * @param {Array} newPos - New position [x, y, z]
 * @param {Object} currentModel - Current model being moved
 * @param {Array} allModels - All existing models
 * @param {number} snapSize - Grid snap size
 * @returns {Object} { position, isStacked, isGrounded, collisionModel }
 */
export const enhancedCollisionDetection = (newPos, currentModel, allModels, snapSize = 1) => {
  // First check for stacking collision
  const stackResult = checkCollisionAndStack(newPos, currentModel, allModels, snapSize);
  
  // Always check for floating to ensure proper ground placement
  const floatingResult = checkFloatingAndGround(newPos, currentModel, allModels, snapSize);
  
  // If stacked, use stack position
  if (stackResult.isStacked) {
    return {
      position: stackResult.position,
      isStacked: true,
      isGrounded: true,
      collisionModel: stackResult.collisionModel
    };
  }
  
  // Otherwise use floating/ground result
  return {
    position: floatingResult.position,
    isStacked: false,
    isGrounded: !floatingResult.isFloating,
    collisionModel: null
  };
};

/**
 * Snap model to nearest valid position when close to other models
 * @param {Array} position - Current position [x, y, z]
 * @param {Object} currentModel - Current model
 * @param {Array} allModels - All existing models
 * @param {number} snapSize - Grid snap size
 * @param {number} snapDistance - Distance threshold for snapping
 * @returns {Object} { position, isSnapped, snapTarget }
 */
export const snapToNearestModel = (position, currentModel, allModels, snapSize = 1, snapDistance = 2) => {
  const currentModelType = getModelType(currentModel.path);
  const currentModelDims = getModelDimensions(currentModelType);
  
  let nearestDistance = Infinity;
  let nearestModel = null;
  let snapPosition = position;
  
  // Find the nearest model within snap distance
  for (const model of allModels) {
    if (model.id === currentModel.id) continue;
    
    const modelType = getModelType(model.path);
    const modelDims = getModelDimensions(modelType);
    
    // Calculate distance between model centers
    const distance = Math.sqrt(
      Math.pow(position[0] - model.position[0], 2) +
      Math.pow(position[2] - model.position[2], 2)
    );
    
    if (distance < snapDistance && distance < nearestDistance) {
      nearestDistance = distance;
      nearestModel = model;
      
      // Calculate snap position - align to the nearest grid point
      const snapX = Math.round(position[0] / snapSize) * snapSize;
      const snapZ = Math.round(position[2] / snapSize) * snapSize;
      
      snapPosition = [snapX, position[1], snapZ];
    }
  }
  
  return {
    position: snapPosition,
    isSnapped: nearestModel !== null,
    snapTarget: nearestModel
  };
};

/**
 * Ultimate collision detection that combines all features:
 * - Prevents models from going through each other
 * - Ensures precise stacking without gaps
 * - Pulls floating models down to ground
 * - Snaps to nearest valid position
 * @param {Array} newPos - New position [x, y, z]
 * @param {Object} currentModel - Current model being moved
 * @param {Array} allModels - All existing models
 * @param {number} snapSize - Grid snap size
 * @returns {Object} { position, isStacked, isGrounded, isSnapped, collisionModel }
 */
export const ultimateCollisionDetection = (newPos, currentModel, allModels, snapSize = 1) => {
  // Step 1: Enhanced collision detection (stacking + grounding)
  const collisionResult = enhancedCollisionDetection(newPos, currentModel, allModels, snapSize);
  
  // Return simple result without snapping to nearest model (removed for better movement)
  return {
    position: collisionResult.position,
    isStacked: collisionResult.isStacked,
    isGrounded: collisionResult.isGrounded,
    isSnapped: false,
    collisionModel: collisionResult.collisionModel
  };
};

/**
 * Calculate preview position with snap adjustment
 * @param {Array} originalPosition - Original position [x, y, z]
 * @param {Array} snapPoints - Available snap points
 * @param {number} snapDistance - Snap distance threshold
 * @returns {Object} { position, isSnapped, snapPoint }
 */
export const calculatePreviewPosition = (originalPosition, snapPoints, snapDistance = 2) => {
  const nearestSnapPoint = findNearestSnapPoint(originalPosition, snapPoints, snapDistance);
  
  if (nearestSnapPoint) {
    // Calculate better attachment position based on face type
    let adjustedPosition = [...nearestSnapPoint.position];
    
    if (nearestSnapPoint.type.startsWith('face-')) {
      // For face attachments, position the model exactly on the face
      const normal = nearestSnapPoint.normal;
      
      // Get the attachment area dimensions
      const attachmentArea = nearestSnapPoint.attachmentArea || { width: 1, height: 1, depth: 0.1 };
      
      // Calculate offset based on the normal direction and attachment area
      let offsetX = 0, offsetY = 0, offsetZ = 0;
      
      if (Math.abs(normal[0]) > 0.5) { // Left/Right face
        offsetX = normal[0] * (attachmentArea.width / 2 + 0.05); // Small gap to prevent overlap
        offsetY = normal[1] * attachmentArea.height / 2;
        offsetZ = normal[2] * attachmentArea.depth / 2;
      } else if (Math.abs(normal[1]) > 0.5) { // Top/Bottom face
        offsetX = normal[0] * attachmentArea.width / 2;
        offsetY = normal[1] * (attachmentArea.height / 2 + 0.05);
        offsetZ = normal[2] * attachmentArea.depth / 2;
      } else if (Math.abs(normal[2]) > 0.5) { // Front/Back face
        offsetX = normal[0] * attachmentArea.width / 2;
        offsetY = normal[1] * attachmentArea.height / 2;
        offsetZ = normal[2] * (attachmentArea.depth / 2 + 0.05);
      }
      
      adjustedPosition[0] += offsetX;
      adjustedPosition[1] += offsetY;
      adjustedPosition[2] += offsetZ;
    } else if (nearestSnapPoint.type === 'corner') {
      // For corner attachments, position slightly offset
      const normal = nearestSnapPoint.normal;
      const offset = 0.1; // Small offset to prevent overlap
      
      adjustedPosition[0] += normal[0] * offset;
      adjustedPosition[1] += normal[1] * offset;
      adjustedPosition[2] += normal[2] * offset;
    } else if (nearestSnapPoint.type === 'edge') {
      // For edge attachments, position along the edge
      const normal = nearestSnapPoint.normal;
      const offset = 0.05; // Very small offset
      
      adjustedPosition[0] += normal[0] * offset;
      adjustedPosition[1] += normal[1] * offset;
      adjustedPosition[2] += normal[2] * offset;
    }
    
    return {
      position: adjustedPosition,
      isSnapped: true,
      snapPoint: nearestSnapPoint
    };
  }

  return {
    position: originalPosition,
    isSnapped: false,
    snapPoint: null
  };
};
