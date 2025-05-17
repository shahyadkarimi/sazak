import { useState, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

// توابع کمکی (بدون تغییر)
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

export const useModelAdjustment = (
  id,
  position,
  rotation,
  updateModelPosition,
  updateModelRotation,
  {
    positionSnapStep = 1,
    heightSnapStep = 1,
    rotationSnapDegrees = 45,
    mouseSensitivity = 1,
  } = {}
) => {
  const [isAdjustingHeight, setIsAdjustingHeight] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isRotatingY, setIsRotatingY] = useState(false);
  const [isRotatingX, setIsRotatingX] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: null, y: null, z: null });
  const [mouseAccumulated, setMouseAccumulated] = useState({ y: 0 });
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [rotationStartAngles, setRotationStartAngles] = useState(null);
  const [rotationStartMouse, setRotationStartMouse] = useState(null);
  const [lastRotation, setLastRotation] = useState({ x: null, y: null });

  const rotationSnapRadians = degToRad(rotationSnapDegrees);
  const { raycaster, camera, gl } = useThree();

  // مدیریت تنظیم ارتفاع
  const startAdjustHeight = (event) => {
    // برای رویدادهای سه‌بعدی، event ممکنه clientX/Y نداشته باشه
    const clientY = event
      ? event.clientY || event.intersections[0]?.point.y
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
      ? event.clientX || event.intersections[0]?.point.x
      : 0;
    const clientY = event
      ? event.clientY || event.intersections[0]?.point.y
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
      ? event.clientX || event.intersections[0]?.point.x
      : 0;
    const clientY = event
      ? event.clientY || event.intersections[0]?.point.y
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
      ? event.clientX || event.intersections[0]?.point.x
      : 0;
    const clientY = event
      ? event.clientY || event.intersections[0]?.point.y
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

  // دکمه‌های چرخش سریع
  const rotateModelY = () => {
    let currentY = normalizeAngle(rotation[1]);
    let newY = snapToGrid(currentY + Math.PI / 2, rotationSnapRadians);
    let newRotation = [...rotation];
    newRotation[1] = normalizeAngle(newY);
    updateModelRotation(id, newRotation);
  };

  const rotateModelX = () => {
    let currentX = normalizeAngle(rotation[0]);
    let newX = snapToGrid(currentX + Math.PI / 2, rotationSnapRadians);
    newX = normalizeAngle(newX);

    if (newX > Math.PI / 2 && newX < (3 * Math.PI) / 2) {
      newX = newX < Math.PI ? Math.PI / 2 : (3 * Math.PI) / 2;
    }

    let newRotation = [...rotation];
    newRotation[0] = newX;
    updateModelRotation(id, newRotation);
  };

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
        const newHeight = snapToGrid(
          position[1] + heightChange,
          heightSnapStep
        );
        const newPosition = [position[0], Math.max(0, newHeight), position[2]];
        updateModelPosition(id, newPosition);
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
        updateModelPosition(id, [newX, position[1], newZ]);
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
  ]);

  // Effect برای چرخش Y
  useEffect(() => {
    if (!isRotatingY || !rotationStartMouse || !rotationStartAngles) return;

    const handleMouseMove = (event) => {
      const deltaX = event.clientX - rotationStartMouse.x;
      const rotationDelta = (deltaX / 200) * (Math.PI / 2) * mouseSensitivity;
      const totalRotation = rotationStartAngles[1] + rotationDelta;
      const snappedRotation = snapToGrid(totalRotation, rotationSnapRadians);
      let newRotation = [...rotationStartAngles];
      newRotation[1] = normalizeAngle(snappedRotation);
      updateModelRotation(id, newRotation);
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
    mouseSensitivity,
  ]);

  // Effect برای چرخش X
  useEffect(() => {
    if (!isRotatingX || !rotationStartMouse || !rotationStartAngles) return;

    const handleMouseMove = (event) => {
      const deltaY = event.clientY - rotationStartMouse.y;
      const rotationDelta = (-deltaY / 200) * (Math.PI / 2) * mouseSensitivity;
      const totalRotation = rotationStartAngles[0] + rotationDelta;
      let snappedRotation = snapToGrid(totalRotation, rotationSnapRadians);
      snappedRotation = normalizeAngle(snappedRotation);

      if (
        snappedRotation > Math.PI / 2 &&
        snappedRotation < (3 * Math.PI) / 2
      ) {
        snappedRotation =
          snappedRotation < Math.PI ? Math.PI / 2 : (3 * Math.PI) / 2;
      }

      let newRotation = [...rotationStartAngles];
      newRotation[0] = snappedRotation;
      updateModelRotation(id, newRotation);
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
    mouseSensitivity,
  ]);

  // Effect برای توقف با رها کردن موس
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isAdjustingHeight) stopAdjustHeight();
      if (isMoving) stopMoving();
      if (isRotatingY) stopRotatingY();
      if (isRotatingX) stopRotatingX();
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isAdjustingHeight, isMoving, isRotatingY, isRotatingX]);

  return {
    isAdjustingHeight,
    isMoving,
    isRotatingY,
    isRotatingX,
    startAdjustHeight,
    stopAdjustHeight,
    startMoving,
    stopMoving,
    startRotatingY,
    stopRotatingY,
    startRotatingX,
    stopRotatingX,
    rotateModelX,
    rotateModelY,
  };
};
