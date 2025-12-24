import { useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

// توابع کمکی
export const snapToGrid = (value, step = 1) => {
  return Math.round(value / step) * step;
};

export const normalizeAngle = (angle) => {
  return ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
};

export const radToDeg = (rad) => {
  return rad * (180 / Math.PI);
};

export const degToRad = (deg) => {
  return deg * (Math.PI / 180);
};

export const ensureRotationArray = (rotation) => {
  if (!Array.isArray(rotation)) {
    return [0, 0, 0];
  }
  if (rotation.length < 3) {
    return [rotation[0] || 0, rotation[1] || 0, rotation[2] || 0];
  }
  return [...rotation];
};

// تابع محاسبه bounding box برای مدل‌های پیچیده
export const calculateModelBoundingBox = (model, step = 1) => {
  // برای مدل‌های رباتیک، ابعاد را بر اساس نوع مدل تخمین می‌زنیم
  let size = { x: step, y: step, z: step };
  
  // تشخیص نوع مدل بر اساس نام فایل
  const modelPath = model.path || '';
  
  if (modelPath.includes('U_Piece')) {
    // مدل U شکل - عرض بیشتر
    size = { x: step * 1.5, y: step, z: step };
  } else if (modelPath.includes('L_Piece')) {
    // مدل L شکل - ابعاد متفاوت
    size = { x: step * 1.2, y: step, z: step * 1.2 };
  } else if (modelPath.includes('I_Piece')) {
    // مدل I شکل - ممکن است طولانی‌تر باشد
    size = { x: step, y: step, z: step * 1.5 };
  } else if (modelPath.includes('3_ways')) {
    // مدل 3 راهه - ابعاد بزرگتر
    size = { x: step * 1.3, y: step, z: step * 1.3 };
  }
  
  return new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(...model.position),
    new THREE.Vector3(size.x, size.y, size.z)
  );
};

const AXIS_VECTORS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

const AXIS_INDEX = { x: 0, y: 1, z: 2 };
const TWO_PI = Math.PI * 2;

const normalizeDelta = (delta) => {
  if (Number.isNaN(delta)) return 0;
  let result = delta;
  while (result > Math.PI) {
    result -= TWO_PI;
  }
  while (result < -Math.PI) {
    result += TWO_PI;
  }
  return result;
};

const clampAxisAngle = (_, angle) => angle;

export const applyAxisRotationHelper = (
  startAngles,
  axisKey,
  deltaAngle,
  space = "local"
) => {
  const safeAngles = ensureRotationArray(startAngles || [0, 0, 0]);
  const startEuler = new THREE.Euler(
    safeAngles[0],
    safeAngles[1],
    safeAngles[2],
    "XYZ"
  );
  const startQuat = new THREE.Quaternion().setFromEuler(startEuler);
  const axisVector = AXIS_VECTORS[axisKey]?.clone() || AXIS_VECTORS.x.clone();
  if (space === "local") {
    axisVector.applyQuaternion(startQuat);
  }
  const deltaQuat = new THREE.Quaternion().setFromAxisAngle(
    axisVector,
    deltaAngle
  );
  const resultQuat = deltaQuat.multiply(startQuat);
  const resultEuler = new THREE.Euler().setFromQuaternion(resultQuat, "XYZ");
  return [
    normalizeAngle(resultEuler.x),
    normalizeAngle(resultEuler.y),
    normalizeAngle(resultEuler.z),
  ];
};

export const applySnappedAxisRotation = ({
  baseRotation,
  axisKey,
  deltaAngle,
  snapRadians,
  rotationSnapDegrees = 45,
  space = "local",
}) => {
  const safeRotation = ensureRotationArray(baseRotation);
  const axisIdx = AXIS_INDEX[axisKey] ?? 0;
  const startAngle = safeRotation[axisIdx] || 0;
  let desiredAngle = startAngle + deltaAngle;
  if (snapRadians) {
    desiredAngle = snapToGrid(desiredAngle, snapRadians);
  }
  desiredAngle = normalizeAngle(desiredAngle);
  desiredAngle = clampAxisAngle(axisKey, desiredAngle, rotationSnapDegrees);
  const deltaToApply = normalizeDelta(desiredAngle - startAngle);
  if (Math.abs(deltaToApply) < 1e-6) {
    return null;
  }
  return applyAxisRotationHelper(safeRotation, axisKey, deltaToApply, space);
};

// تابع بررسی و اصلاح برخورد بهبود یافته
export const adjustPositionToAvoidOverlap = (
  newPos,
  currentId,
  models,
  step = 1,
  options = {}
) => {
  const { allowOverlap = false, lockedAxes = [] } = options;
  if (allowOverlap) {
    return [newPos[0], newPos[1], newPos[2]];
  }

  let adjustedPos = new THREE.Vector3(...newPos);
  const currentModel = models.find(m => m.id === currentId);
  
  if (!currentModel) return [adjustedPos.x, adjustedPos.y, adjustedPos.z];

  // محاسبه bounding box برای مدل فعلی
  const currentModelBox = calculateModelBoundingBox(currentModel, step);

  for (const model of models) {
    if (model.id === currentId) continue; // مدل خودش را بررسی نکن

    const modelBox = calculateModelBoundingBox(model, step);
    
    // بررسی برخورد با حاشیه امن
    const safetyMargin = step * 0.1; // 10% حاشیه امن
    const expandedModelBox = modelBox.clone().expandByScalar(safetyMargin);
    const expandedCurrentBox = currentModelBox.clone().expandByScalar(safetyMargin);
    
    // جابجایی موقعیت مدل فعلی
    expandedCurrentBox.translate(adjustedPos.clone().sub(new THREE.Vector3(...currentModel.position)));

    if (expandedModelBox.intersectsBox(expandedCurrentBox)) {
      // محاسبه فاصله‌های مختلف برای انتخاب بهترین موقعیت
      const distances = {
        left: Math.abs(adjustedPos.x - modelBox.max.x),
        right: Math.abs(adjustedPos.x - modelBox.min.x),
        front: Math.abs(adjustedPos.z - modelBox.max.z),
        back: Math.abs(adjustedPos.z - modelBox.min.z),
        top: Math.abs(adjustedPos.y - modelBox.max.y),
        bottom: Math.abs(adjustedPos.y - modelBox.min.y)
      };

      const axisMap = {
        left: "x",
        right: "x",
        front: "z",
        back: "z",
        top: "y",
        bottom: "y",
      };

      const lockedAxisSet = new Set(
        Array.isArray(lockedAxes) ? lockedAxes.map((axis) => axis.toLowerCase()) : []
      );

      const halfWidthX = (currentModelBox.max.x - currentModelBox.min.x) / 2;
      const halfWidthZ = (currentModelBox.max.z - currentModelBox.min.z) / 2;
      const halfHeightY = (currentModelBox.max.y - currentModelBox.min.y) / 2;

      const eligibleEntries = Object.entries(distances).filter(
        ([dir]) => !lockedAxisSet.has(axisMap[dir])
      );

      if (eligibleEntries.length === 0) {
        continue;
      }

      // انتخاب کوتاه‌ترین فاصله
      const minDistance = Math.min(...eligibleEntries.map(([, dist]) => dist));
      
      if (!lockedAxisSet.has("x") && minDistance === distances.left) {
        adjustedPos.x = modelBox.max.x + halfWidthX + safetyMargin;
      } else if (!lockedAxisSet.has("x") && minDistance === distances.right) {
        adjustedPos.x = modelBox.min.x - halfWidthX - safetyMargin;
      } else if (!lockedAxisSet.has("z") && minDistance === distances.front) {
        adjustedPos.z = modelBox.max.z + halfWidthZ + safetyMargin;
      } else if (!lockedAxisSet.has("z") && minDistance === distances.back) {
        adjustedPos.z = modelBox.min.z - halfWidthZ - safetyMargin;
      } else if (!lockedAxisSet.has("y") && minDistance === distances.top) {
        adjustedPos.y = modelBox.max.y + halfHeightY + safetyMargin;
      } else if (!lockedAxisSet.has("y") && minDistance === distances.bottom) {
        adjustedPos.y = modelBox.min.y - halfHeightY - safetyMargin;
      }

      // اگر ارتفاع تغییر نکرده یا محور قفل بوده، ارتفاع اصلی را حفظ می‌کنیم
      if (
        lockedAxisSet.has("y") ||
        (minDistance !== distances.top && minDistance !== distances.bottom)
      ) {
        adjustedPos.y = newPos[1];
      }
    }
  }

  return [adjustedPos.x, adjustedPos.y, adjustedPos.z];
};

export const useModelAdjustment = (
  id,
  position,
  rotation,
  updateModelPosition,
  updateModelRotation,
  existingModels = [], // آرایه مدل‌های موجود
  {
    positionSnapStep = 1,
    heightSnapStep = 1,
    rotationSnapDegrees = 45,
    mouseSensitivity = 1,
    allowOverlap = false,
    checkOverlap = null,
  } = {}
) => {
  const [isAdjustingHeight, setIsAdjustingHeight] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isRotatingY, setIsRotatingY] = useState(false);
  const [isRotatingX, setIsRotatingX] = useState(false);
  const [isRotatingZ, setIsRotatingZ] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: null, y: null, z: null });
  const [mouseAccumulated, setMouseAccumulated] = useState({ y: 0 });
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [rotationStartAngles, setRotationStartAngles] = useState(null);
  const [rotationStartMouse, setRotationStartMouse] = useState(null);
  const [lastRotation, setLastRotation] = useState({ x: null, y: null, z: null });

  const rotationSnapRadians = degToRad(rotationSnapDegrees);
  const { raycaster, camera, gl } = useThree();

  const clampHeightAgainstCollisions = useCallback(
    (targetY) => {
      if (allowOverlap || !Array.isArray(existingModels) || existingModels.length === 0) {
        return targetY;
      }

      const currentModel = existingModels.find((m) => m.id === id);
      if (!currentModel) return targetY;

      let resolvedY = targetY;
      const basePosition = Array.isArray(position) ? [...position] : [0, 0, 0];
      const safetyMargin = Math.max(heightSnapStep * 0.1, 0.01);

      for (const other of existingModels) {
        if (!other || other.id === id) continue;

        const otherBox = calculateModelBoundingBox(other, heightSnapStep);
        if (!otherBox) continue;

        let candidateModel = {
          ...currentModel,
          position: [basePosition[0], resolvedY, basePosition[2]],
        };
        let candidateBox = calculateModelBoundingBox(
          candidateModel,
          heightSnapStep
        );
        if (!candidateBox) continue;

        if (!candidateBox.intersectsBox(otherBox)) {
          continue;
        }

        if (resolvedY <= basePosition[1]) {
          const delta = otherBox.max.y + safetyMargin - candidateBox.min.y;
          if (delta > 0) {
            resolvedY += delta;
            candidateModel = {
              ...candidateModel,
              position: [basePosition[0], resolvedY, basePosition[2]],
            };
            candidateBox = calculateModelBoundingBox(
              candidateModel,
              heightSnapStep
            );
          }
        } else {
          const delta = candidateBox.max.y - (otherBox.min.y - safetyMargin);
          if (delta > 0) {
            resolvedY -= delta;
            candidateModel = {
              ...candidateModel,
              position: [basePosition[0], resolvedY, basePosition[2]],
            };
            candidateBox = calculateModelBoundingBox(
              candidateModel,
              heightSnapStep
            );
          }
        }
      }

      return resolvedY;
    },
    [allowOverlap, existingModels, heightSnapStep, id, position]
  );

  // مدیریت تنظیم ارتفاع
  const startAdjustHeight = (event) => {
    const clientY = event
      ? event.clientY || event.intersections?.[0]?.point.y
      : 0;
    setIsAdjustingHeight(true);
    setLastMouse({ x: null, y: clientY, z: null });
    setMouseAccumulated({ y: 0 });
  };

  const stopAdjustHeight = () => {
    setIsAdjustingHeight(false);
    setLastMouse({ x: null, y: null, z: null });
    setMouseAccumulated({ y: 0 });
  };

  // مدیریت جابجایی
  const startMoving = (event) => {
    const clientX = event
      ? event.clientX || event.intersections?.[0]?.point.x
      : 0;
    const clientY = event
      ? event.clientY || event.intersections?.[0]?.point.y
      : 0;
    setIsMoving(true);
    setDragStartPosition([...position]);

    const mouse = new THREE.Vector2();
    mouse.x = (clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(clientY / gl.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const tempPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]);
    const initialIntersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(tempPlane, initialIntersection);

    setLastMouse({
      x: initialIntersection.x,
      y: null,
      z: initialIntersection.z,
    });
  };

  const stopMoving = () => {
    setIsMoving(false);
    setLastMouse({ x: null, y: null, z: null });
    setDragStartPosition(null);
  };

  // مدیریت چرخش Y
  const startRotatingY = (event) => {
    const clientX = event
      ? event.clientX || event.intersections?.[0]?.point.x
      : 0;
    const clientY = event
      ? event.clientY || event.intersections?.[0]?.point.y
      : 0;
    setIsRotatingY(true);
    setRotationStartAngles([...rotation]);
    setRotationStartMouse({ x: clientX, y: clientY });
    setLastRotation((prev) => ({ ...prev, y: rotation[1] }));

    setIsAdjustingHeight(true);
  };

  const stopRotatingY = () => {
    setIsRotatingY(false);
    setRotationStartAngles(null);
    setRotationStartMouse(null);

    setIsAdjustingHeight(false);
  };

  // مدیریت چرخش X
  const startRotatingX = (event) => {
    const clientX = event
      ? event.clientX || event.intersections?.[0]?.point.x
      : 0;
    const clientY = event
      ? event.clientY || event.intersections?.[0]?.point.y
      : 0;
    setIsRotatingX(true);
    setRotationStartAngles([...rotation]);
    setRotationStartMouse({ x: clientX, y: clientY });
    setLastRotation((prev) => ({ ...prev, x: rotation[0] }));

    setIsAdjustingHeight(true);
  };

  const stopRotatingX = () => {
    setIsRotatingX(false);
    setRotationStartAngles(null);
    setRotationStartMouse(null);

    setIsAdjustingHeight(false);
  };

  const startRotatingZ = (event) => {
    const clientX = event
      ? event.clientX || event.intersections?.[0]?.point.x
      : 0;
    const clientY = event
      ? event.clientY || event.intersections?.[0]?.point.y
      : 0;
    const normalizedRotation = ensureRotationArray(rotation);
    setIsRotatingZ(true);
    setRotationStartAngles(normalizedRotation);
    setRotationStartMouse({ x: clientX, y: clientY });
    setLastRotation((prev) => ({ ...prev, z: normalizedRotation[2] }));

    setIsAdjustingHeight(true);
  };

  const stopRotatingZ = () => {
    setIsRotatingZ(false);
    setRotationStartAngles(null);
    setRotationStartMouse(null);

    setIsAdjustingHeight(false);
  };

  const rotateModelZ = useCallback(() => {
    const newRotation = applySnappedAxisRotation({
      baseRotation: rotation,
      axisKey: "z",
      deltaAngle: rotationSnapRadians,
      snapRadians: rotationSnapRadians,
      rotationSnapDegrees,
      space: "local",
    });
    if (newRotation) {
      updateModelRotation(id, newRotation);
    }
  }, [
    rotation,
    rotationSnapRadians,
    rotationSnapDegrees,
    id,
    updateModelRotation,
  ]);

  const rotateModelY = useCallback(() => {
    const newRotation = applySnappedAxisRotation({
      baseRotation: rotation,
      axisKey: "y",
      deltaAngle: rotationSnapRadians,
      snapRadians: rotationSnapRadians,
      rotationSnapDegrees,
      space: "world",
    });
    if (newRotation) {
      updateModelRotation(id, newRotation);
    }
  }, [
    rotation,
    rotationSnapRadians,
    rotationSnapDegrees,
    id,
    updateModelRotation,
  ]);

  const rotateModelX = useCallback(() => {
    const snapDelta =
      rotationSnapDegrees === 90 ? Math.PI / 2 : rotationSnapRadians;
    const newRotation = applySnappedAxisRotation({
      baseRotation: rotation,
      axisKey: "x",
      deltaAngle: snapDelta,
      snapRadians: snapDelta,
      rotationSnapDegrees,
      space: "local",
    });
    if (newRotation) {
      updateModelRotation(id, newRotation);
    }
  }, [
    rotation,
    rotationSnapRadians,
    rotationSnapDegrees,
    id,
    updateModelRotation,
    applySnappedAxisRotation,
  ]);

  // Effect برای تنظیم ارتفاع
  useEffect(() => {
    if (!isAdjustingHeight || lastMouse.y === null) return;

    const handleMouseMove = (event) => {
      const currentMouseY = event.clientY;
      const deltaY = lastMouse.y - currentMouseY;
      const adjustedDeltaY = deltaY < 0 ? deltaY * 1 : deltaY;
      const newAccumulated = mouseAccumulated.y + adjustedDeltaY;
      setMouseAccumulated((prev) => ({ ...prev, y: newAccumulated }));

      const threshold = 50;
      const heightChange =
        Math.trunc(newAccumulated / threshold) * heightSnapStep;

      if (heightChange !== 0) {
        let newHeight = snapToGrid(
          position[1] + heightChange,
          heightSnapStep
        );
        if (!allowOverlap) {
          newHeight = clampHeightAgainstCollisions(newHeight);
        }
        // برای تنظیم ارتفاع، فقط ارتفاع را تغییر می‌دهیم و موقعیت افقی را حفظ می‌کنیم
        // ارتفاع را محدود نمی‌کنیم (می‌تواند هر مقداری داشته باشد)
        let proposedPosition = [
          position[0],
          newHeight, // بدون محدودیت Math.max(0, ...) - کاربر می‌تواند ارتفاع را آزادانه تغییر دهد
          position[2],
        ];

        if (
          !allowOverlap &&
          typeof checkOverlap === "function" &&
          checkOverlap(proposedPosition)
        ) {
          setMouseAccumulated((prev) => ({
            ...prev,
            y: newAccumulated % threshold,
          }));
          setLastMouse((prev) => ({ ...prev, y: currentMouseY }));
          return;
        }

        if (!allowOverlap) {
          proposedPosition = adjustPositionToAvoidOverlap(
            proposedPosition,
            id,
            existingModels,
            heightSnapStep,
            { allowOverlap, lockedAxes: ["x", "z"] }
          );
          proposedPosition[0] = position[0];
          proposedPosition[2] = position[2];
        }

        updateModelPosition(id, proposedPosition);
        setMouseAccumulated((prev) => ({
          ...prev,
          y: newAccumulated % threshold,
        }));
      }

      setLastMouse((prev) => ({ ...prev, y: currentMouseY }));
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [
    isAdjustingHeight,
    lastMouse,
    mouseAccumulated,
    position,
    id,
    updateModelPosition,
    heightSnapStep,
    existingModels,
  ]);

  // Effect برای جابجایی
  useEffect(() => {
    if (!isMoving || !lastMouse.x || !dragStartPosition) return;

    const handleMouseMove = (event) => {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

      const dragPlane = new THREE.Plane(
        new THREE.Vector3(0, 1, 0),
        -position[1]
      );
      const currentIntersection = new THREE.Vector3();
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(dragPlane, currentIntersection);

      if (currentIntersection) {
        const deltaX = currentIntersection.x - lastMouse.x;
        const deltaZ = currentIntersection.z - lastMouse.z;

        const newX = snapToGrid(
          dragStartPosition[0] + deltaX,
          positionSnapStep
        );
        const newZ = snapToGrid(
          dragStartPosition[2] + deltaZ,
          positionSnapStep
        );
        const proposedPosition = [newX, position[1], newZ];

        // بررسی برخورد و اصلاح موقعیت
        const adjustedPosition = adjustPositionToAvoidOverlap(
          proposedPosition,
          id,
          existingModels,
          positionSnapStep
        );

        updateModelPosition(id, adjustedPosition);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [
    isMoving,
    lastMouse,
    dragStartPosition,
    position,
    id,
    updateModelPosition,
    raycaster,
    camera,
    gl,
    positionSnapStep,
    existingModels,
  ]);

  // Effect برای چرخش Y
  useEffect(() => {
    if (!isRotatingY || !rotationStartMouse || !rotationStartAngles) return;

    const handleMouseMove = (event) => {
      const deltaX = event.clientX - rotationStartMouse.x;
      const rotationDelta = (deltaX / 200) * (Math.PI / 2) * mouseSensitivity;
      const snappedDelta = snapToGrid(rotationDelta, rotationSnapRadians);
      if (snappedDelta === 0) return;
      const newRotation = applySnappedAxisRotation({
        baseRotation: rotationStartAngles,
        axisKey: "y",
        deltaAngle: snappedDelta,
        snapRadians: rotationSnapRadians,
        rotationSnapDegrees,
        space: "world",
      });
      if (newRotation) {
        updateModelRotation(id, newRotation);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [
    isRotatingY,
    rotationStartMouse,
    rotationStartAngles,
    id,
    updateModelRotation,
    rotationSnapRadians,
    rotationSnapDegrees,
    mouseSensitivity,
  ]);

  useEffect(() => {
    if (!isRotatingX || !rotationStartMouse || !rotationStartAngles) return;

    const handleMouseMove = (event) => {
      const deltaY = event.clientY - rotationStartMouse.y;
      const rotationDelta = (-deltaY / 200) * (Math.PI / 2) * mouseSensitivity;
      const snappedDelta = snapToGrid(rotationDelta, rotationSnapRadians);
      if (snappedDelta === 0) return;
      const newRotation = applySnappedAxisRotation({
        baseRotation: rotationStartAngles,
        axisKey: "x",
        deltaAngle: snappedDelta,
        snapRadians: rotationSnapRadians,
        rotationSnapDegrees,
        space: "local",
      });
      if (newRotation) {
        updateModelRotation(id, newRotation);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [
    isRotatingX,
    rotationStartMouse,
    rotationStartAngles,
    id,
    updateModelRotation,
    rotationSnapRadians,
    rotationSnapDegrees,
    mouseSensitivity,
  ]);

  useEffect(() => {
    if (!isRotatingZ || !rotationStartMouse || !rotationStartAngles) return;

    const handleMouseMove = (event) => {
      const deltaY = event.clientY - rotationStartMouse.y;
      const rotationDelta = (-deltaY / 200) * (Math.PI / 2) * mouseSensitivity;
      const snappedDelta = snapToGrid(rotationDelta, rotationSnapRadians);
      if (snappedDelta === 0) return;
      const newRotation = applySnappedAxisRotation({
        baseRotation: rotationStartAngles,
        axisKey: "z",
        deltaAngle: snappedDelta,
        snapRadians: rotationSnapRadians,
        rotationSnapDegrees,
        space: "local",
      });
      if (newRotation) {
        updateModelRotation(id, newRotation);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [
    isRotatingZ,
    rotationStartMouse,
    rotationStartAngles,
    id,
    updateModelRotation,
    rotationSnapRadians,
    rotationSnapDegrees,
    mouseSensitivity,
  ]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isAdjustingHeight) stopAdjustHeight();
      if (isMoving) stopMoving();
      if (isRotatingY) stopRotatingY();
      if (isRotatingX) stopRotatingX();
      if (isRotatingZ) stopRotatingZ();
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isAdjustingHeight, isMoving, isRotatingY, isRotatingX, isRotatingZ]);

  return {
    isAdjustingHeight,
    isMoving,
    isRotatingY,
    isRotatingX,
    isRotatingZ,
    startAdjustHeight,
    stopAdjustHeight,
    startMoving,
    stopMoving,
    startRotatingY,
    stopRotatingY,
    startRotatingX,
    stopRotatingX,
    startRotatingZ,
    stopRotatingZ,
    rotateModelX,
    rotateModelY,
    rotateModelZ,
  };
};
