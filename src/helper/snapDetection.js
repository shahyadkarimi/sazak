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
    
    // Calculate potential attachment points around the target model
    // These represent common connection points like edges, corners, and faces
    
    // Corner points based on actual model dimensions
    const cornerOffsets = [
      [-targetDims.x/2, 0, -targetDims.z/2], 
      [targetDims.x/2, 0, -targetDims.z/2], 
      [-targetDims.x/2, 0, targetDims.z/2], 
      [targetDims.x/2, 0, targetDims.z/2],
      [-targetDims.x/2, targetDims.y, -targetDims.z/2], 
      [targetDims.x/2, targetDims.y, -targetDims.z/2], 
      [-targetDims.x/2, targetDims.y, targetDims.z/2], 
      [targetDims.x/2, targetDims.y, targetDims.z/2]
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

    // Edge midpoints based on actual model dimensions
    const edgeOffsets = [
      [-targetDims.x/2, 0, 0], [targetDims.x/2, 0, 0], 
      [0, 0, -targetDims.z/2], [0, 0, targetDims.z/2],
      [-targetDims.x/2, targetDims.y, 0], [targetDims.x/2, targetDims.y, 0], 
      [0, targetDims.y, -targetDims.z/2], [0, targetDims.y, targetDims.z/2],
      [-targetDims.x/2, targetDims.y/2, -targetDims.z/2], 
      [targetDims.x/2, targetDims.y/2, -targetDims.z/2], 
      [-targetDims.x/2, targetDims.y/2, targetDims.z/2], 
      [targetDims.x/2, targetDims.y/2, targetDims.z/2]
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
      { offset: [0, targetDims.y, 0], normal: [0, 1, 0], type: 'face-top' },
      { offset: [0, 0, 0], normal: [0, -1, 0], type: 'face-bottom' },
      // Side faces
      { offset: [-targetDims.x/2, targetDims.y/2, 0], normal: [-1, 0, 0], type: 'face-left' },
      { offset: [targetDims.x/2, targetDims.y/2, 0], normal: [1, 0, 0], type: 'face-right' },
      { offset: [0, targetDims.y/2, -targetDims.z/2], normal: [0, 0, -1], type: 'face-front' },
      { offset: [0, targetDims.y/2, targetDims.z/2], normal: [0, 0, 1], type: 'face-back' }
    ];
    
    // Add special connection points for U-shaped models
    if (targetType === 'U') {
      // Inner connection points for U shape
      faceOffsets.push(
        { offset: [-targetDims.x/4, targetDims.y/2, 0], normal: [-1, 0, 0], type: 'face-inner-left' },
        { offset: [targetDims.x/4, targetDims.y/2, 0], normal: [1, 0, 0], type: 'face-inner-right' }
      );
    }
    
    // Add special connection points for L-shaped models
    if (targetType === 'L') {
      // Corner connection points for L shape
      faceOffsets.push(
        { offset: [0, targetDims.y/2, 0], normal: [0, 0, 1], type: 'face-corner' }
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
          width: targetDims.x,
          height: targetDims.y,
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
