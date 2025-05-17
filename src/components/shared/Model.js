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

// تابع نرمال‌سازی زاویه بین 0 تا 2π
const normalizeAngle = (angle) => {
  return ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
};

const Model = ({ path, position, id, rotation }) => {
  // چک کردن path قبل از بارگذاری
  const scene = path ? useModelLoader(path) : null;
  const modelRef = useRef();
  const selectedModels = useModelStore((s) => s.selectedModels);
  const setSelectedModels = useModelStore((s) => s.setSelectedModels);
  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const setSelectedModelId = useModelStore((s) => s.setSelectedModelId);
  const updateModelPosition = useModelStore((s) => s.updateModelPosition);
  const updateModelRotation = useModelStore((s) => s.updateModelRotation);
  const setIsAdjustingHeight = useModelStore((s) => s.setIsAdjustingHeight);

  // state برای مدیریت تنظیم ارتفاع، جابجایی و چرخش
  const [isAdjustingHeight, setIsAdjustingHeightLocal] = useState(false);
  const [isMoving, setIsMovingLocal] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: null, y: null, z: null });
  const [mouseAccumulated, setMouseAccumulated] = useState({ y: 0 });
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

  // دیباگ path و scene

  // اگر path یا scene نامعتبر باشه، رندر رو متوقف کن
  if (!path || !adjustedScene) {
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
    setLastMouse({ x: null, y: event.clientY, z: null });
    setMouseAccumulated({ y: 0 });
  };

  // توقف تنظیم ارتفاع
  const stopAdjustHeight = (event) => {
    event.stopPropagation();
    setIsAdjustingHeightLocal(false);
    setIsAdjustingHeight(false);
    setLastMouse({ x: null, y: null, z: null });
    setMouseAccumulated({ y: 0 });
  };

  // شروع جابجایی
  const startMoving = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setIsMovingLocal(true);
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

  // چرخش مدل حول محور Y (با محدودیت)
  const rotateModelY = (event) => {
    event.stopPropagation();

    // چرخش ۹۰ درجه حول محور Y
    let newRotation = [...rotation];
    newRotation[1] = (newRotation[1] + Math.PI / 2) % (Math.PI * 2);

    // اطمینان از اینکه مدل زیر گرید قرار نمی‌گیرد با حفظ چرخش Y
    updateModelRotation(id, newRotation);
  };

  // چرخش مدل حول محور X (با محدودیت)
  const rotateModelX = (event) => {
    event.stopPropagation();

    // نرمال‌سازی زاویه فعلی بین 0 تا 2π
    let currentX = normalizeAngle(rotation[0]);

    // محاسبه زاویه جدید با افزودن 90 درجه
    let newX = normalizeAngle(currentX + Math.PI / 2);

    // محدود کردن زاویه X برای جلوگیری از رفتن مدل زیر گرید
    // زاویه مجاز: 0 تا π/2 (0 تا 90 درجه) و 3π/2 تا 2π (270 تا 360 درجه)
    if (newX > Math.PI / 2 && newX < (3 * Math.PI) / 2) {
      // اگر زاویه جدید به محدوده غیرمجاز می‌رسد، به مرز بعدی برو
      newX = newX < Math.PI ? Math.PI / 2 : (3 * Math.PI) / 2;
    }

    let newRotation = [...rotation];
    newRotation[0] = newX;

    updateModelRotation(id, newRotation);
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

  // مدیریت حرکت ماوس برای جابجایی
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

  // تنظیم وضعیت مدل برای جلوگیری از رفتن زیر گرید
  useEffect(() => {
    // این تابع بعد از هر بار تغییر چرخش اجرا می‌شود تا مطمئن شویم مدل زیر گرید نمی‌رود
    let currentRotation = [...rotation];
    let needsUpdate = false;

    // نرمال‌سازی زاویه X
    let normalizedX = normalizeAngle(currentRotation[0]);

    // محدود کردن زاویه X به محدوده مجاز
    if (normalizedX > Math.PI / 2 && normalizedX < (3 * Math.PI) / 2) {
      normalizedX = normalizedX < Math.PI ? Math.PI / 2 : (3 * Math.PI) / 2;
      currentRotation[0] = normalizedX;
      needsUpdate = true;
    }

    // اگر نیاز به بروزرسانی باشد، چرخش را اصلاح کن
    if (needsUpdate) {
      updateModelRotation(id, currentRotation);
    }
  }, [rotation, id, updateModelRotation]);

  const deleteModelHandler = () => {
    const newData = selectedModels.filter((item) => item.id !== id);
    console.log(newData);
    setSelectedModels(newData);
  };

  return (
    <group ref={modelRef}>
      <primitive
        object={adjustedScene}
        scale={100} // حفظ مقیاس اصلی
        position={position}
        rotation={rotation} // اعمال چرخش
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
            {/* دکمه چرخش حول محور Y */}
            <button
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                fontSize: "16px",
              }}
              onClick={rotateModelY}
              title="چرخش حول محور Y"
            >
              Y↻
            </button>
            {/* دکمه چرخش حول محور X */}
            <button
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                fontSize: "16px",
              }}
              onClick={rotateModelX}
              title="چرخش حول محور X (محدود)"
            >
              X↻
            </button>
            <button
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                fontSize: "16px",
              }}
              onClick={deleteModelHandler}
              title="چرخش حول محور X (محدود)"
            >
              D
            </button>
          </div>
        </Html>
      )}
    </group>
  );
};

export default Model;