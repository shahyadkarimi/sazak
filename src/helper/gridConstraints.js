import * as THREE from "three";

export const GRID_HALF_SIZE = 20;

const CORNER_SIGNS = [
  [-1, -1, -1],
  [-1, -1, 1],
  [-1, 1, -1],
  [-1, 1, 1],
  [1, -1, -1],
  [1, -1, 1],
  [1, 1, -1],
  [1, 1, 1],
];

const ensureRotationArray = (rotation) => {
  if (!rotation) return [0, 0, 0];
  if (Array.isArray(rotation)) return rotation;
  return [
    rotation.x ?? 0,
    rotation.y ?? 0,
    rotation.z ?? 0,
  ];
};

export const computeModelExtents = (dimensions, rotation = [0, 0, 0]) => {
  if (!dimensions) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      minZ: 0,
      maxZ: 0,
    };
  }

  const halfX = (dimensions.x ?? 0) / 2;
  const halfY = (dimensions.y ?? 0) / 2;
  const halfZ = (dimensions.z ?? 0) / 2;

  const [rotX, rotY, rotZ] = ensureRotationArray(rotation);
  const euler = new THREE.Euler(rotX, rotY, rotZ, "XYZ");
  const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  CORNER_SIGNS.forEach(([sx, sy, sz]) => {
    const corner = new THREE.Vector3(
      sx * halfX,
      sy * halfY,
      sz * halfZ
    );
    corner.applyMatrix4(rotationMatrix);

    if (corner.x < minX) minX = corner.x;
    if (corner.x > maxX) maxX = corner.x;
    if (corner.y < minY) minY = corner.y;
    if (corner.y > maxY) maxY = corner.y;
    if (corner.z < minZ) minZ = corner.z;
    if (corner.z > maxZ) maxZ = corner.z;
  });

  return { minX, maxX, minY, maxY, minZ, maxZ };
};

const getWorldBounds = (position, dimensions, rotation = [0, 0, 0]) => {
  if (!position || !dimensions) return null;
  const [x = 0, y = 0, z = 0] = position;
  const { minX, maxX, minY, maxY, minZ, maxZ } = computeModelExtents(
    dimensions,
    rotation
  );

  return {
    minX: x + minX,
    maxX: x + maxX,
    minY: y + minY,
    maxY: y + maxY,
    minZ: z + minZ,
    maxZ: z + maxZ,
  };
};

const getWorldBoundsFromDimensions = (position, dimensions, rotation) => {
  if (!position || !dimensions) return null;
  if (dimensions.bounds) {
    const { bounds } = dimensions;
    return {
      minX: position[0] + bounds.minX,
      maxX: position[0] + bounds.maxX,
      minY: position[1] + bounds.minY,
      maxY: position[1] + bounds.maxY,
      minZ: position[2] + bounds.minZ,
      maxZ: position[2] + bounds.maxZ,
    };
  }

  return getWorldBounds(position, dimensions, rotation);
};

export const boxesOverlap = (boundsA, boundsB, epsilon = 0.001) => {
  if (!boundsA || !boundsB) return false;
  const noOverlap =
    boundsA.maxX <= boundsB.minX + epsilon ||
    boundsA.minX >= boundsB.maxX - epsilon ||
    boundsA.maxY <= boundsB.minY + epsilon ||
    boundsA.minY >= boundsB.maxY - epsilon ||
    boundsA.maxZ <= boundsB.minZ + epsilon ||
    boundsA.minZ >= boundsB.maxZ - epsilon;
  return !noOverlap;
};

export const volumesOverlap = (
  positionA,
  dimensionsA,
  rotationA,
  positionB,
  dimensionsB,
  rotationB,
  epsilon = 0.001
) => {
  if (!dimensionsA || !dimensionsB || !positionA || !positionB) {
    return false;
  }

  const boundsA = getWorldBoundsFromDimensions(positionA, dimensionsA, rotationA);
  const boundsB = getWorldBoundsFromDimensions(positionB, dimensionsB, rotationB);

  if (!boundsA || !boundsB) return false;

  return boxesOverlap(boundsA, boundsB, epsilon);
};

export const clampPositionToGrid = (
  position,
  dimensions,
  rotation,
  gridHalfSize = GRID_HALF_SIZE
) => {
  if (!position) return position;

  const [x = 0, y = 0, z = 0] = position;
  const { minX, maxX, minZ, maxZ } = computeModelExtents(
    dimensions,
    rotation
  );

  const leftExtent = Math.max(0, -minX);
  const rightExtent = Math.max(0, maxX);
  const forwardExtent = Math.max(0, -minZ);
  const backExtent = Math.max(0, maxZ);

  let minAllowedX = -gridHalfSize + leftExtent;
  let maxAllowedX = gridHalfSize - rightExtent;

  if (minAllowedX > maxAllowedX) {
    const mid = (minAllowedX + maxAllowedX) / 2;
    minAllowedX = mid;
    maxAllowedX = mid;
  }

  let minAllowedZ = -gridHalfSize + forwardExtent;
  let maxAllowedZ = gridHalfSize - backExtent;

  if (minAllowedZ > maxAllowedZ) {
    const mid = (minAllowedZ + maxAllowedZ) / 2;
    minAllowedZ = mid;
    maxAllowedZ = mid;
  }

  return [
    Math.min(Math.max(x, minAllowedX), maxAllowedX),
    y,
    Math.min(Math.max(z, minAllowedZ), maxAllowedZ),
  ];
};

