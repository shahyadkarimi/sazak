import { useRef, useState, useEffect, useMemo } from "react";
import { Html } from "@react-three/drei";
import { useModelLoader } from "@/hooks/useModelLoader";
import useModelStore from "@/store/useModelStore";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// تابع snap برای محورهای X, Y, Z
const snapToGrid = (value, step = 1) => {
  return Math.round(value / step) * step;
};

const Model = ({ path, position, id }) => {
  // چک کردن path قبل از بارگذاری
  const scene = path ? useModelLoader(path) : null;
  const modelRef = useRef();
  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const setSelectedModelId = useModelStore((s) => s.setSelectedModelId);
  const updateModelPosition = useModelStore((s) => s.updateModelPosition);
  const setIsAdjustingHeight = useModelStore((s) => s.setIsAdjustingHeight);

  // state برای مدیریت تنظیم ارتفاع و جابجایی
  const [isAdjustingHeight, setIsAdjustingHeightLocal] = useState(false);
  const [isMoving, setIsMovingLocal] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: null, y: null });
  const [mouseAccumulated, setMouseAccumulated] = useState({ y: 0 });
  // اضافه کردن state برای نگهداری موقعیت اولیه در زمان شروع حرکت
  const [dragStartPosition, setDragStartPosition] = useState(null);

  // دسترسی به Three.js
  const { raycaster, camera, gl } = useThree();

  // تنظیم مرکز مدل مشابه ModelPlacer
  const adjustedScene = useMemo(() => {
    if (!scene) return null;
    const clonedScene = scene.clone();
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    clonedScene.position.sub(center); // تنظیم مرکز مدل
    return clonedScene;
  }, [scene]);

  // اگر path یا scene نامعتبر باشه، رندر رو متوقف کن
  if (!path || !adjustedScene) {
    console.warn(`Invalid path for model ID: ${id}, path: ${path}`);
    return null;
  }

  const handleClick = (event) => {
    event.stopPropagation();
    setSelectedModelId(id);
  };

  // شروع تنظیم ارتفاع
  const startAdjustHeight = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setIsAdjustingHeightLocal(true);
    setIsAdjustingHeight(true);
    setLastMouse({ x: null, y: event.clientY });
    setMouseAccumulated({ y: 0 });
  };

  // توقف تنظیم ارتفاع
  const stopAdjustHeight = (event) => {
    event.stopPropagation();
    setIsAdjustingHeightLocal(false);
    setIsAdjustingHeight(false);
    setLastMouse({ x: null, y: null });
    setMouseAccumulated({ y: 0 });
  };

  // شروع جابجایی - با ثبت موقعیت اولیه مدل و ماوس
  const startMoving = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setIsMovingLocal(true);

    // ذخیره موقعیت اولیه مدل در زمان شروع درگ
    setDragStartPosition([...position]);

    // ذخیره موقعیت اولیه ماوس
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

    // راه‌اندازی raycaster برای محاسبه نقطه شروع روی صفحه
    raycaster.setFromCamera(mouse, camera);

    // ایجاد یک صفحه موقت در موقعیت فعلی مدل برای raycasting
    const tempPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]);
    const initialIntersection = new THREE.Vector3();

    raycaster.ray.intersectPlane(tempPlane, initialIntersection);

    // ذخیره نقطه شروع به عنوان آخرین موقعیت ماوس
    setLastMouse({
      x: initialIntersection.x,
      y: null,
      z: initialIntersection.z,
    });

    setIsAdjustingHeight(true);
  };

  // توقف جابجایی
  const stopMoving = (event) => {
    event.stopPropagation();
    setIsMovingLocal(false);
    setLastMouse({ x: null, y: null, z: null });
    setDragStartPosition(null);
    setIsAdjustingHeight(false);
  };

  // مدیریت حرکت ماوس برای تنظیم ارتفاع
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
      const gridStep = 1;
      const heightChange = Math.trunc(newAccumulated / threshold) * gridStep;

      if (heightChange !== 0) {
        const newHeight = snapToGrid(position[1] + heightChange, gridStep);
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
  ]);

  // مدیریت حرکت ماوس برای جابجایی - اصلاح شده
  useEffect(() => {
    if (!isMoving || !lastMouse.x || !dragStartPosition) return;

    const handleMouseMove = (event) => {
      event.stopPropagation();
      event.preventDefault();

      // محاسبه موقعیت ماوس در فضای نرمالایز شده
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

      // ایجاد یک صفحه در ارتفاع فعلی مدل
      const dragPlane = new THREE.Plane(
        new THREE.Vector3(0, 1, 0),
        -position[1]
      );
      const currentIntersection = new THREE.Vector3();

      // تنظیم راستای دید و محاسبه تقاطع با صفحه
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(dragPlane, currentIntersection);

      if (currentIntersection) {
        // محاسبه تفاوت بین موقعیت فعلی و موقعیت اولیه
        const deltaX = currentIntersection.x - lastMouse.x;
        const deltaZ = currentIntersection.z - lastMouse.z;

        // اعمال تغییرات به موقعیت اولیه مدل در زمان شروع درگ
        const newX = snapToGrid(dragStartPosition[0] + deltaX, 1);
        const newZ = snapToGrid(dragStartPosition[2] + deltaZ, 1);

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
  ]);

  // توقف تنظیمات با رها کردن ماوس
  useEffect(() => {
    const handleGlobalMouseUp = (event) => {
      if (isAdjustingHeight) stopAdjustHeight(event);
      if (isMoving) stopMoving(event);
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isAdjustingHeight, isMoving]);

  return (
    <group ref={modelRef}>
      <primitive
        object={adjustedScene}
        scale={100} // حفظ مقیاس 100 مطابق با کد اصلی
        position={position}
        onClick={handleClick}
      />
      {selectedModelId === id && (
        <Html
          position={[position[0], position[1] + 1, position[2]]}
          style={{ pointerEvents: "auto", userSelect: "none" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              background: "rgba(0,0,0,0.5)",
              padding: "10px",
              borderRadius: "5px",
              gap: "10px",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* دکمه تنظیم ارتفاع */}
            <button
              style={{
                padding: "5px 10px",
                cursor: "ns-resize",
                fontSize: "16px",
              }}
              onMouseDown={startAdjustHeight}
              onMouseUp={stopAdjustHeight}
            >
              ↕
            </button>
            {/* دکمه جابجایی */}
            <button
              style={{
                padding: "5px 10px",
                cursor: "move",
                fontSize: "16px",
              }}
              onMouseDown={startMoving}
              onMouseUp={stopMoving}
            >
              ↔
            </button>
          </div>
        </Html>
      )}
    </group>
  );
};

export default Model;