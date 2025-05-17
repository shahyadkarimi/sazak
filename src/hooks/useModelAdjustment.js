import { useState, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

// توابع کمکی
export const snapToGrid = (value, step = 1) => {
  return Math.round(value / step) * step;
};

export const normalizeAngle = (angle) => {
  return ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
};

// تابع کمکی برای تبدیل رادیان به درجه
export const radToDeg = (rad) => {
  return rad * (180 / Math.PI);
};

// تابع کمکی برای تبدیل درجه به رادیان
export const degToRad = (deg) => {
  return deg * (Math.PI / 180);
};

export const useModelAdjustment = (
  id,
  position,
  rotation,
  updateModelPosition,
  updateModelRotation,
  // پارامترهای جدید برای کنترل مقدار اسنپ
  {
    positionSnapStep = 1, // مقدار پله برای جابجایی (واحد متر)
    heightSnapStep = 1, // مقدار پله برای ارتفاع (واحد متر)
    rotationSnapDegrees = 45, // مقدار پله برای چرخش (واحد درجه)
    mouseSensitivity = 1, // حساسیت موس برای چرخش (مقدار پایین = حساسیت کمتر)
  } = {}
) => {
  const [isAdjustingHeight, setIsAdjustingHeight] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isRotatingY, setIsRotatingY] = useState(false); // حالت چرخش Y
  const [isRotatingX, setIsRotatingX] = useState(false); // حالت چرخش X
  const [lastMouse, setLastMouse] = useState({ x: null, y: null, z: null });
  const [mouseAccumulated, setMouseAccumulated] = useState({ y: 0 });
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [rotationStartAngles, setRotationStartAngles] = useState(null);
  const [rotationStartMouse, setRotationStartMouse] = useState(null);
  const [lastRotation, setLastRotation] = useState({ x: null, y: null });

  // تبدیل درجه به رادیان برای استفاده در اسنپ چرخش
  const rotationSnapRadians = degToRad(rotationSnapDegrees);

  const { raycaster, camera, gl } = useThree();

  // مدیریت تنظیم ارتفاع
  const startAdjustHeight = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setIsAdjustingHeight(true);
    setLastMouse({ x: null, y: event.clientY, z: null });
    setMouseAccumulated({ y: 0 });
  };

  const stopAdjustHeight = (event) => {
    event.stopPropagation();
    setIsAdjustingHeight(false);
    setLastMouse({ x: null, y: null, z: null });
    setMouseAccumulated({ y: 0 });
  };

  // مدیریت جابجایی
  const startMoving = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setIsMoving(true);
    setDragStartPosition([...position]);

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

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

  const stopMoving = (event) => {
    event.stopPropagation();
    setIsMoving(false);
    setLastMouse({ x: null, y: null, z: null });
    setDragStartPosition(null);
  };

  // مدیریت چرخش با کشیدن موس - محور Y
  const startRotatingY = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setIsRotatingY(true);
    setRotationStartAngles([...rotation]);
    setRotationStartMouse({
      x: event.clientX,
      y: event.clientY,
    });
    // ذخیره آخرین چرخش Y برای داشتن نقطه مرجع
    setLastRotation((prev) => ({ ...prev, y: rotation[1] }));

    setIsAdjustingHeight(true);
  };

  const stopRotatingY = (event) => {
    event.stopPropagation();
    setIsRotatingY(false);
    setRotationStartAngles(null);
    setRotationStartMouse(null);

    setIsAdjustingHeight(false);
  };

  // مدیریت چرخش با کشیدن موس - محور X
  const startRotatingX = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setIsRotatingX(true);
    setRotationStartAngles([...rotation]);
    setRotationStartMouse({
      x: event.clientX,
      y: event.clientY,
    });
    // ذخیره آخرین چرخش X برای داشتن نقطه مرجع
    setLastRotation((prev) => ({ ...prev, x: rotation[0] }));

    setIsAdjustingHeight(true);
  };

  const stopRotatingX = (event) => {
    event.stopPropagation();
    setIsRotatingX(false);
    setRotationStartAngles(null);
    setRotationStartMouse(null);

    setIsAdjustingHeight(false);
  };

  // دکمه‌های چرخش سریع (با اسنپ جدید)
  const rotateModelY = (event) => {
    event.stopPropagation();
    let currentY = normalizeAngle(rotation[1]);
    // چرخش به اندازه 90 درجه و سپس اسنپ به نزدیکترین مقدار اسنپ
    let newY = snapToGrid(currentY + Math.PI / 2, rotationSnapRadians);
    let newRotation = [...rotation];
    newRotation[1] = normalizeAngle(newY);
    updateModelRotation(id, newRotation);
  };

  const rotateModelX = (event) => {
    event.stopPropagation();
    let currentX = normalizeAngle(rotation[0]);
    // چرخش به اندازه 90 درجه و سپس اسنپ به نزدیکترین مقدار اسنپ
    let newX = snapToGrid(currentX + Math.PI / 2, rotationSnapRadians);
    newX = normalizeAngle(newX);

    // محدود کردن زاویه X
    if (newX > Math.PI / 2 && newX < (3 * Math.PI) / 2) {
      newX = newX < Math.PI ? Math.PI / 2 : (3 * Math.PI) / 2;
    }

    let newRotation = [...rotation];
    newRotation[0] = newX;
    updateModelRotation(id, newRotation);
  };

  // Effect برای تنظیم ارتفاع با اسنپ
  useEffect(() => {
    if (!isAdjustingHeight || lastMouse.y === null) return;

    const handleMouseMove = (event) => {
      event.stopPropagation();
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

  // Effect برای جابجایی با اسنپ
  useEffect(() => {
    if (!isMoving || !lastMouse.x || !dragStartPosition) return;

    const handleMouseMove = (event) => {
      event.stopPropagation();
      event.preventDefault();

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

        // استفاده از مقدار اسنپ برای جابجایی
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

  // Effect برای چرخش حول محور Y با موس - با اسنپ
  useEffect(() => {
    if (!isRotatingY || !rotationStartMouse || !rotationStartAngles) return;

    const handleMouseMove = (event) => {
      event.stopPropagation();
      event.preventDefault();

      // محاسبه میزان جابجایی موس در محور X نسبت به نقطه شروع
      const deltaX = event.clientX - rotationStartMouse.x;

      // تبدیل پیکسل به رادیان (با کاهش حساسیت)
      // هر 200 پیکسل جابجایی = 90 درجه (π/2) چرخش
      // ضریب mouseSensitivity برای کنترل دقیق‌تر حساسیت موس
      const rotationDelta = (deltaX / 200) * (Math.PI / 2) * mouseSensitivity;

      // محاسبه مقدار کل چرخش بدون اسنپ
      const totalRotation = rotationStartAngles[1] + rotationDelta;

      // اسنپ به نزدیکترین مقدار با استفاده از rotationSnapRadians
      const snappedRotation = snapToGrid(totalRotation, rotationSnapRadians);

      // اعمال چرخش اسنپ شده
      let newRotation = [...rotationStartAngles];
      newRotation[1] = normalizeAngle(snappedRotation);

      // بروزرسانی چرخش
      updateModelRotation(id, newRotation);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [
    isRotatingY,
    rotationStartMouse,
    rotationStartAngles,
    mouseAccumulated,
    id,
    updateModelRotation,
    rotationSnapRadians,
  ]);

  // Effect برای چرخش حول محور X با موس - با اسنپ
  useEffect(() => {
    if (!isRotatingX || !rotationStartMouse || !rotationStartAngles) return;

    const handleMouseMove = (event) => {
      event.stopPropagation();
      event.preventDefault();

      // محاسبه میزان جابجایی موس در محور Y نسبت به نقطه شروع
      const deltaY = event.clientY - rotationStartMouse.y;

      // تبدیل پیکسل به رادیان (با کاهش حساسیت)
      // جابجایی منفی در Y باعث چرخش مثبت در X می‌شود
      // ضریب mouseSensitivity برای کنترل دقیق‌تر حساسیت موس
      const rotationDelta = (-deltaY / 200) * (Math.PI / 2) * mouseSensitivity;

      // محاسبه مقدار کل چرخش بدون اسنپ
      const totalRotation = rotationStartAngles[0] + rotationDelta;

      // اسنپ به نزدیکترین مقدار با استفاده از rotationSnapRadians
      let snappedRotation = snapToGrid(totalRotation, rotationSnapRadians);
      snappedRotation = normalizeAngle(snappedRotation);

      // محدود کردن زاویه X
      if (
        snappedRotation > Math.PI / 2 &&
        snappedRotation < (3 * Math.PI) / 2
      ) {
        snappedRotation =
          snappedRotation < Math.PI ? Math.PI / 2 : (3 * Math.PI) / 2;
      }

      let newRotation = [...rotationStartAngles];
      newRotation[0] = snappedRotation;

      // بروزرسانی چرخش
      updateModelRotation(id, newRotation);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [
    isRotatingX,
    rotationStartMouse,
    rotationStartAngles,
    mouseAccumulated,
    id,
    updateModelRotation,
    rotationSnapRadians,
  ]);

  // Effect برای توقف تنظیمات با رها کردن ماوس
  useEffect(() => {
    const handleGlobalMouseUp = (event) => {
      if (isAdjustingHeight) stopAdjustHeight(event);
      if (isMoving) stopMoving(event);
      if (isRotatingY) stopRotatingY(event);
      if (isRotatingX) stopRotatingX(event);
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
