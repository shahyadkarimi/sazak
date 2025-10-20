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
  
  // For 90-degree rotations, swap dimensions appropriately
  const absRotY = Math.abs(rotY) % (Math.PI / 2);
  const absRotX = Math.abs(rotX) % (Math.PI / 2);
  
  let rotatedDims = { ...dims };
  
  // Y-axis rotation (most common for robotic parts)
  if (Math.abs(absRotY - Math.PI / 2) < 0.1) {
    rotatedDims = { x: dims.z, y: dims.y, z: dims.x };
  }
  
  // X-axis rotation (flipping)
  if (Math.abs(absRotX - Math.PI / 2) < 0.1) {
    rotatedDims = { x: dims.x, y: dims.z, z: dims.y };
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
 * Enhanced collision detection with precise stacking
 * @param {Array} newPos - New position [x, y, z]
 * @param {Object} currentModel - Current model being moved
 * @param {Array} allModels - All existing models
 * @param {number} snapSize - Grid snap size
 * @returns {Object} { position, isStacked, stackHeight, collisionModel }
 */
export const checkCollisionAndStack = (newPos, currentModel, allModels, snapSize = 1) => {
  const currentModelType = getModelType(currentModel.path);
  const currentModelDims = getModelDimensions(currentModelType);
  
  // Create bounding box for current model at new position
  const currentModelBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(newPos[0], newPos[1], newPos[2]),
    new THREE.Vector3(currentModelDims.x, currentModelDims.y, currentModelDims.z)
  );
  
  let maxStackHeight = 0;
  let collisionModel = null;
  let isStacked = false;
  let finalPosition = [...newPos];
  
  // Check collision with all other models
  for (const model of allModels) {
    if (model.id === currentModel.id) continue;
    
    const modelType = getModelType(model.path);
    const modelDims = getModelDimensions(modelType);
    
    // Create bounding box for existing model
    const modelBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(model.position[0], model.position[1], model.position[2]),
      new THREE.Vector3(modelDims.x, modelDims.y, modelDims.z)
    );
    
    // Check horizontal collision (X and Z axes) with small tolerance
    const tolerance = 0.01; // Small tolerance for precise positioning
    const horizontalCollision = 
      currentModelBox.min.x < modelBox.max.x + tolerance &&
      currentModelBox.max.x > modelBox.min.x - tolerance &&
      currentModelBox.min.z < modelBox.max.z + tolerance &&
      currentModelBox.max.z > modelBox.min.z - tolerance;
    
    if (horizontalCollision) {
      // Calculate precise stack height - place current model exactly on top
      const stackHeight = modelBox.max.y + (currentModelDims.y / 2);
      maxStackHeight = Math.max(maxStackHeight, stackHeight);
      collisionModel = model;
      isStacked = true;
      
      // Snap to exact grid position for precise alignment
      if (snapSize > 0) {
        finalPosition[0] = Math.round(newPos[0] / snapSize) * snapSize;
        finalPosition[2] = Math.round(newPos[2] / snapSize) * snapSize;
      }
    }
  }
  
  // Set final Y position
  finalPosition[1] = isStacked ? maxStackHeight : newPos[1];
  
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
  const currentModelType = getModelType(currentModel.path);
  const currentModelDims = getModelDimensions(currentModelType);
  
  // Create bounding box for current model
  const currentModelBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(position[0], position[1], position[2]),
    new THREE.Vector3(currentModelDims.x, currentModelDims.y, currentModelDims.z)
  );
  
  let maxGroundLevel = 0;
  let isFloating = true;
  
  // Check if model is floating above any other model
  for (const model of allModels) {
    if (model.id === currentModel.id) continue;
    
    const modelType = getModelType(model.path);
    const modelDims = getModelDimensions(modelType);
    
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
      // Model is above another model, check if it's floating
      const groundLevel = modelBox.max.y + (currentModelDims.y / 2);
      maxGroundLevel = Math.max(maxGroundLevel, groundLevel);
      
      // If current model is higher than it should be, it's floating
      if (currentModelBox.min.y > modelBox.max.y + 0.1) {
        isFloating = true;
      } else {
        isFloating = false;
      }
    }
  }
  
  // If floating, pull it down to the ground level
  if (isFloating && maxGroundLevel > 0) {
    return {
      position: [position[0], maxGroundLevel, position[2]],
      isFloating: true,
      groundLevel: maxGroundLevel
    };
  }
  
  return {
    position: position,
    isFloating: false,
    groundLevel: 0
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
  
  // If not stacked, check for floating
  if (!stackResult.isStacked) {
    const floatingResult = checkFloatingAndGround(newPos, currentModel, allModels, snapSize);
    
    if (floatingResult.isFloating) {
      return {
        position: floatingResult.position,
        isStacked: false,
        isGrounded: true,
        collisionModel: null
      };
    }
  }
  
  return {
    position: stackResult.position,
    isStacked: stackResult.isStacked,
    isGrounded: !stackResult.isStacked,
    collisionModel: stackResult.collisionModel
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
  
  // Step 2: If not stacked, try to snap to nearest model
  if (!collisionResult.isStacked) {
    const snapResult = snapToNearestModel(collisionResult.position, currentModel, allModels, snapSize, 1.5);
    
    if (snapResult.isSnapped) {
      // Re-check collision with snapped position
      const finalCollision = enhancedCollisionDetection(snapResult.position, currentModel, allModels, snapSize);
      
      return {
        position: finalCollision.position,
        isStacked: finalCollision.isStacked,
        isGrounded: finalCollision.isGrounded,
        isSnapped: true,
        collisionModel: finalCollision.collisionModel
      };
    }
  }
  
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
