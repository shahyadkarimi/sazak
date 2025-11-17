import * as THREE from 'three';

const idGenerator = () => Math.random().toString(36).substring(2, 8);

const toFarsiNumber = (num) => {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

  if (num) {
    return num
      .toLocaleString()
      .toString()
      .replace(/\d/g, (x) => farsiDigits[x]);
  } else {
    return (0)
      .toLocaleString()
      .toString()
      .replace(/\d/g, (x) => farsiDigits[x]);
  }
};

const snapToGrid = ([x, y, z], step = 1) => {
  return [Math.round(x / step) * step, y, Math.round(z / step) * step];
};

const greetByTime = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "صبح بخیر 🌅";
  } else if (hour >= 12 && hour < 18) {
    return "ظهر بخیر ☀️";
  } else if (hour >= 18 && hour < 22) {
    return "عصر بخیر 🌇";
  } else {
    return "شب بخیر 🌙";
  }
};

/**
 * Calculate bounding box of a rotated model
 * @param {Object} dimensions - Model dimensions {x, y, z}
 * @param {Array} rotation - Rotation [rx, ry, rz] in radians
 * @param {Array} position - Position [x, y, z]
 * @returns {Object} Bounding box {minX, maxX, minY, maxY, minZ, maxZ}
 */
const calculateRotatedBoundingBox = (dimensions, rotation, position) => {
  // Validate inputs
  if (!dimensions || typeof dimensions.x !== 'number' || typeof dimensions.y !== 'number' || typeof dimensions.z !== 'number') {
    const px = position && position[0] !== undefined ? position[0] : 0;
    const py = position && position[1] !== undefined ? position[1] : 0;
    const pz = position && position[2] !== undefined ? position[2] : 0;
    return {
      minX: px,
      maxX: px,
      minY: py,
      maxY: py,
      minZ: pz,
      maxZ: pz,
    };
  }

  // Ensure rotation is an array with 3 elements
  const rot = Array.isArray(rotation) && rotation.length >= 3 
    ? [rotation[0] || 0, rotation[1] || 0, rotation[2] || 0]
    : [0, 0, 0];
  
  // Ensure position is an array with 3 elements
  const pos = Array.isArray(position) && position.length >= 3
    ? [position[0] || 0, position[1] || 0, position[2] || 0]
    : [0, 0, 0];

  const [rx, ry, rz] = rot;
  const [px, py, pz] = pos;
  const { x: dx, y: dy, z: dz } = dimensions;

  // If no rotation, return simple bounding box
  if (Math.abs(rx) < 0.001 && Math.abs(ry) < 0.001 && Math.abs(rz) < 0.001) {
    const halfX = dx / 2;
    const halfY = dy / 2;
    const halfZ = dz / 2;
    return {
      minX: px - halfX,
      maxX: px + halfX,
      minY: py - halfY,
      maxY: py + halfY,
      minZ: pz - halfZ,
      maxZ: pz + halfZ,
    };
  }

  // Create a temporary box to get the 8 corners
  const halfX = dx / 2;
  const halfY = dy / 2;
  const halfZ = dz / 2;

  // Local corners (relative to center)
  const localCorners = [
    new THREE.Vector3(-halfX, -halfY, -halfZ),
    new THREE.Vector3(halfX, -halfY, -halfZ),
    new THREE.Vector3(-halfX, halfY, -halfZ),
    new THREE.Vector3(halfX, halfY, -halfZ),
    new THREE.Vector3(-halfX, -halfY, halfZ),
    new THREE.Vector3(halfX, -halfY, halfZ),
    new THREE.Vector3(-halfX, halfY, halfZ),
    new THREE.Vector3(halfX, halfY, halfZ),
  ];

  // Create rotation matrix using Euler angles (XYZ order, same as Three.js default)
  const euler = new THREE.Euler(rx, ry, rz, 'XYZ');
  const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);

  // Transform corners by rotation, then translate by position
  const worldCorners = localCorners.map(corner => {
    const rotated = corner.clone().applyMatrix4(rotationMatrix);
    return new THREE.Vector3(
      rotated.x + px,
      rotated.y + py,
      rotated.z + pz
    );
  });

  // Find min/max for each axis
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  worldCorners.forEach(corner => {
    minX = Math.min(minX, corner.x);
    maxX = Math.max(maxX, corner.x);
    minY = Math.min(minY, corner.y);
    maxY = Math.max(maxY, corner.y);
    minZ = Math.min(minZ, corner.z);
    maxZ = Math.max(maxZ, corner.z);
  });

  return { minX, maxX, minY, maxY, minZ, maxZ };
};

export { snapToGrid, toFarsiNumber, idGenerator, greetByTime, calculateRotatedBoundingBox };
