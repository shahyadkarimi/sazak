import { useRef, useState, useEffect } from "react";
import { Html } from "@react-three/drei";
import { useModelLoader } from "@/hooks/useModelLoader";
import useModelStore from "@/store/useModelStore";

// تابع snap برای محور Y
const snapToGridY = (y, step = 1) => {
  return Math.round(y / step) * step;
};

const Model = ({ path, position, id }) => {
  const scene = useModelLoader(path);
  const modelRef = useRef();
  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const setSelectedModelId = useModelStore((s) => s.setSelectedModelId);
  const updateModelPosition = useModelStore((s) => s.updateModelPosition);
  const setIsAdjustingHeight = useModelStore((s) => s.setIsAdjustingHeight);

  // state برای مدیریت تغییر ارتفاع
  const [isAdjustingHeight, setIsAdjustingHeightLocal] = useState(false);
  const [lastMouseY, setLastMouseY] = useState(null);
  const [mouseYAccumulated, setMouseYAccumulated] = useState(0); // جمع حرکت ماوس

  // دیباگ scene
  console.log("Scene for model", id, ":", scene);

  const handleClick = (event) => {
    event.stopPropagation();
    console.log("Model clicked, ID:", id);
    setSelectedModelId(id);
  };

  // شروع تنظیم ارتفاع
  const startAdjustHeight = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setIsAdjustingHeightLocal(true);
    setIsAdjustingHeight(true);
    setLastMouseY(event.clientY);
    setMouseYAccumulated(0); // ریست جمع حرکت
    console.log("Start adjusting height, clientY:", event.clientY);
  };

  // توقف تنظیم ارتفاع
  const stopAdjustHeight = (event) => {
    event.stopPropagation();
    setIsAdjustingHeightLocal(false);
    setIsAdjustingHeight(false);
    setLastMouseY(null);
    setMouseYAccumulated(0);
    console.log("Stop adjusting height");
  };

  // مدیریت حرکت ماوس برای تغییر ارتفاع
  useEffect(() => {
    if (!isAdjustingHeight || lastMouseY === null) return;

    const handleMouseMove = (event) => {
      event.stopPropagation();
      const currentMouseY = event.clientY;
      const deltaY = lastMouseY - currentMouseY;

      // اینجا سرعت پایین رفتن رو کمتر می‌کنیم
      const adjustedDeltaY = deltaY < 0 ? deltaY * 1 : deltaY;

      const newAccumulated = mouseYAccumulated + adjustedDeltaY;
      setMouseYAccumulated(newAccumulated);

      const threshold = 50;
      const gridStep = 1;
      const heightChange = Math.trunc(newAccumulated / threshold) * gridStep;

      if (heightChange !== 0) {
        const newHeight = snapToGridY(position[1] + heightChange, gridStep);
        const newPosition = [position[0], Math.max(0, newHeight), position[2]];
        updateModelPosition(id, newPosition);
        setMouseYAccumulated(newAccumulated % threshold);
      }

      setLastMouseY(currentMouseY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [
    isAdjustingHeight,
    lastMouseY,
    mouseYAccumulated,
    position,
    id,
    updateModelPosition,
  ]);

  // توقف تنظیم ارتفاع با رها کردن ماوس در هر جای صفحه
  useEffect(() => {
    const handleGlobalMouseUp = (event) => {
      if (isAdjustingHeight) {
        stopAdjustHeight(event);
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isAdjustingHeight]);

  return (
    <group ref={modelRef}>
      <primitive
        object={scene}
        scale={100}
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
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
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
          </div>
        </Html>
      )}
    </group>
  );
};

export default Model;
