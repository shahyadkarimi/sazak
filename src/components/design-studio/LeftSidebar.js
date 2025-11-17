"use client";
import React, { useRef, useState, useEffect } from "react";
import useModelStore from "@/store/useModelStore";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Icon } from "@iconify/react";

const FACE_CONFIG = [
  { name: "جلو", normal: [0, 0, 1], up: [0, 1, 0], color: "#ffffff" },
  { name: "پشت", normal: [0, 0, -1], up: [0, 1, 0], color: "#ffffff" },
  { name: "چپ", normal: [-1, 0, 0], up: [0, 1, 0], color: "#ffffff" },
  { name: "راست", normal: [1, 0, 0], up: [0, 1, 0], color: "#ffffff" },
  { name: "بالا", normal: [0, 1, 0], up: [0, 0, -1], color: "#ffffff" },
  { name: "پایین", normal: [0, -1, 0], up: [0, 0, 1], color: "#ffffff" },
];

const FACE_NAMES = FACE_CONFIG.map((f) => f.name);

const CubeFace = ({ name, normal, color, isSelected }) => {
  const pos = new THREE.Vector3(...normal).clone().multiplyScalar(0.51);
  const look = new THREE.Vector3(...normal).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    look
  );
  const selectedColor = "#7c3aed"; // site purple
  return (
    <group
      name={name}
      position={[pos.x, pos.y, pos.z]}
      quaternion={quat}
      userData={{ faceName: name }}
    >
      <mesh name={name} userData={{ faceName: name }}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial
          color={isSelected ? selectedColor : color}
          side={THREE.DoubleSide}
          transparent
          opacity={isSelected ? 1 : 0.95}
        />
      </mesh>
      <mesh name={name} userData={{ faceName: name }} position={[0, 0, 0.01]}>
        <planeGeometry args={[0.7, 0.3]} />
        <meshBasicMaterial color="transparent" transparent opacity={0} />
      </mesh>
      <Text
        name={name}
        userData={{ faceName: name }}
        position={[0, 0, 0.01]}
        fontSize={0.22}
        color={isSelected ? "#ffffff" : "#111827"}
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
    </group>
  );
};

const ViewCubeScene = ({ onSelect, mainCamera }) => {
  const ref = useRef();
  const { camera, gl } = useThree();
  const [hoverId, setHoverId] = useState(null);
  const [selectedFaceName, setSelectedFaceName] = useState(null);
  const draggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const yawTargetRef = useRef(yawRef.current);
  const pitchTargetRef = useRef(pitchRef.current);
  const isUserInteractingRef = useRef(false);
  const interactionTimeoutRef = useRef(null);

  // بچرخون مکعب برای هماهنگی با دوربین اصلی
  useFrame(() => {
    if (!ref.current) return;

    // اگر دوربین اصلی موجود است و کاربر در حال تعامل نیست، مکعب را با آن هماهنگ کن
    if (mainCamera && !isUserInteractingRef.current) {
      const mainPos = new THREE.Vector3().copy(mainCamera.position);
      mainPos.normalize();

      // محاسبه زاویه‌های yaw و pitch از موقعیت دوربین اصلی
      // استفاده از atan2 برای yaw (چرخش افقی)
      const yaw = -Math.atan2(mainPos.x, mainPos.z);

      // محاسبه pitch (چرخش عمودی) با در نظر گیری ارتفاع
      const horizontalDistance = Math.sqrt(
        mainPos.x * mainPos.x + mainPos.z * mainPos.z
      );
      const pitch = -Math.atan2(mainPos.y, horizontalDistance);

      // محدود کردن pitch برای جلوگیری از چرخش بیش از حد
      const maxPitch = Math.PI / 2 - 0.1;
      const clampedPitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

      yawTargetRef.current = yaw;
      pitchTargetRef.current = clampedPitch;

      // Determine selected face by max dot with face normals
      let bestFace = null;
      let bestDot = -Infinity;
      for (const f of FACE_CONFIG) {
        const n = new THREE.Vector3(...f.normal).normalize();
        const d = n.dot(mainPos);
        if (d > bestDot) {
          bestDot = d;
          bestFace = f.name;
        }
      }
      setSelectedFaceName(bestFace);
    }

    // استفاده از lerp factor متفاوت برای هماهنگی بهتر - تنظیمات برای تمام براوزرها
    const yawLerpFactor = 0.12;
    const pitchLerpFactor = 0.18;

    yawRef.current += (yawTargetRef.current - yawRef.current) * yawLerpFactor;
    pitchRef.current +=
      (pitchTargetRef.current - pitchRef.current) * pitchLerpFactor;
    
    // Apply rotation using Euler angles - compatible with all browsers
    ref.current.rotation.order = 'YXZ';
    ref.current.rotation.set(
      0,
      yawRef.current,
      0,
      'YXZ'
    );
  });

  // هندل کلیک/هاور/درگ برای تعیین زاویه دوربین
  useEffect(() => {
    const handlePointer = (event, isClick) => {
      const mouse = new THREE.Vector2();
      const rect = gl.domElement.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      mouse.x = x * 2 - 1;
      mouse.y = -y * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(ref.current.children, true);
      if (intersects.length > 0) {
        const processHit = (hitObj) => {
          let obj = hitObj;
          let face = obj.userData?.faceName || null;
          while (!face && obj && obj !== ref.current) {
            if (obj.userData?.faceName) {
              face = obj.userData.faceName;
              break;
            }
            if (FACE_NAMES.includes(obj.name)) {
              face = obj.name;
              break;
            }
            obj = obj.parent;
          }
          return face;
        };

        const hit = intersects[0].object;
        const id = hit.userData?.id || hit.name;
        if (!isClick) {
          setHoverId(id);
        } else {
          // Set user interaction state
          isUserInteractingRef.current = true;

          // Clear any existing timeout
          if (interactionTimeoutRef.current) {
            clearTimeout(interactionTimeoutRef.current);
          }

          // Reset interaction state after 2 seconds
          interactionTimeoutRef.current = setTimeout(() => {
            isUserInteractingRef.current = false;
          }, 2000);

          let faceName = null;
          for (let i = 0; i < intersects.length; i++) {
            faceName = processHit(intersects[i].object);
            if (faceName) break;
          }
          console.log("ViewCube click detected, faceName:", faceName);
          const map = {
            جلو: [0, 0, 1],
            پشت: [0, 0, -1],
            چپ: [-1, 0, 0],
            راست: [1, 0, 0],
            بالا: [0, 1, 0],
            پایین: [0, -1, 0],
          };
          const v = faceName ? map[faceName] : null;
          console.log("Calculated vector v:", v);
          if (v) {
            const isTopOrBottom = Math.abs(v[1]) > 0.5;
            const radius = isTopOrBottom ? 45 : 35; // افزایش radius برای زوت اوت بیشتر
            const base = new THREE.Vector3(v[0], v[1], v[2]).multiplyScalar(
              radius
            );
            if (!isTopOrBottom) {
              base.y = 22; // افزایش ارتفاع برای نمای بهتر
            }
            const dir = new THREE.Vector3(v[0], v[1], v[2]).normalize();
            const yaw = -Math.atan2(dir.x, dir.z);
            const pitch = -Math.asin(Math.max(-1, Math.min(1, dir.y)));
            yawTargetRef.current = yaw;
            pitchTargetRef.current = pitch;
            const fov = isTopOrBottom ? 50 : 45; // افزایش FOV برای نمای وسیع‌تر
            onSelect &&
              onSelect({
                camera: [base.x, base.y, base.z],
                fov,
                immediate: false,
              });
          }
        }
      } else if (!isClick) {
        setHoverId(null);
      }
    };

    const down = (e) => handlePointer(e, true);
    const move = (e) => handlePointer(e, false);
    const onDragStart = (e) => {
      draggingRef.current = true;
      isUserInteractingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onDragMove = (e) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      const rotSpeed = 0.018;
      yawTargetRef.current += dx * rotSpeed;
      pitchTargetRef.current += dy * rotSpeed;
      const limit = Math.PI / 2 - 0.05;
      pitchTargetRef.current = Math.max(
        -limit,
        Math.min(limit, pitchTargetRef.current)
      );

      const radius = 35; // افزایش radius برای drag هم
      const dir = new THREE.Vector3(0, 0, 1);
      const euler = new THREE.Euler(
        pitchTargetRef.current,
        yawTargetRef.current,
        0,
        "YXZ"
      );
      dir.applyEuler(euler).normalize();
      const next = dir.multiplyScalar(radius);
      const minY = 20; // افزایش حداقل ارتفاع
      if (next.y < minY) next.y = minY;
      onSelect &&
        onSelect({
          camera: [next.x, next.y, next.z],
          fov: 45,
          immediate: true,
        });
    };
    const onDragEnd = () => {
      draggingRef.current = false;
      // Reset interaction state after drag ends
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
      interactionTimeoutRef.current = setTimeout(() => {
        isUserInteractingRef.current = false;
      }, 1000);
    };

    gl.domElement.addEventListener("pointerdown", down);
    gl.domElement.addEventListener("pointermove", move);
    gl.domElement.addEventListener("mousedown", onDragStart);
    gl.domElement.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    return () => {
      gl.domElement.removeEventListener("pointerdown", down);
      gl.domElement.removeEventListener("pointermove", move);
      gl.domElement.removeEventListener("mousedown", onDragStart);
      gl.domElement.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragEnd);

      // Clear timeout on cleanup
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, [camera, gl, onSelect]);

  return (
    <group ref={ref} scale={1.4}>
      {FACE_CONFIG.map((face) => (
        <CubeFace
          key={face.name}
          name={face.name}
          normal={face.normal}
          color={face.color}
          isSelected={selectedFaceName === face.name}
        />
      ))}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={1}
          metalness={0}
          flatShading
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.001, 1.001, 1.001)]} />
        <lineBasicMaterial color="#111827" linewidth={1} />
      </lineSegments>
    </group>
  );
};

const ViewCube = ({ activeView, onViewChange, mainCamera }) => {
  const handleSelect = (view) => {
    if (!view) return;
    onViewChange && onViewChange({ camera: view.camera, fov: view.fov ?? 40 });
  };

  return (
    <div className="w-full h-24 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200 select-none mb-4" style={{ contain: 'paint' }}>
        <div className="w-24 h-24" style={{ contain: 'layout style paint', willChange: 'contents' }}>
        <Canvas 
          camera={{ position: [3, 3, 3], fov: 40 }}
          gl={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
          }}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 4]} intensity={0.8} />
          <ViewCubeScene onSelect={handleSelect} mainCamera={mainCamera} />
        </Canvas>
      </div>
    </div>
  );
};

const LeftSidebar = ({ mainCamera, cameraView, onViewChange, onToggle }) => {
  const { zoomIn, zoomOut } = useModelStore();

  const resetView = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("designStudio:resetView"));
    }
  };

  const selectedModels = useModelStore((s) => s.selectedModels);
  const disableViewCube = Array.isArray(selectedModels) && selectedModels.length > 50;

  return (
    <div className="relative h-full md:h-[calc(100vh-144px)] flex flex-col justify-center items-center gap-4 bg-white p-4">
      {typeof onToggle === "function" && (
        <button
          onClick={onToggle}
          className="absolute top-1/2 -translate-y-1/2 -right-5 w-5 h-10 rounded-r-xl z-10 bg-white border border-l-0 flex items-center justify-center text-gray-600 hover:text-primaryThemeColor"
          title="بستن"
        >
          <Icon
            icon="solar:alt-arrow-left-line-duotone"
            width="24"
            height="24"
          />
        </button>
      )}
      {/* View Cube (disabled when many models to avoid multiple GL contexts) */}
      {disableViewCube ? (
        <div className="w-full h-24 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200 select-none mb-4">
          <div className="text-xs text-gray-500 text-center p-2">
            نمای کوچک (ViewCube) موقتاً غیرفعال شد تا فشار گرافیکی کاهش یابد
          </div>
        </div>
      ) : (
        <ViewCube
          activeView={cameraView}
          onViewChange={onViewChange}
          mainCamera={mainCamera}
        />
      )}

      <button
        onClick={resetView}
        className="bg-gray-200/90 flex justify-center items-center size-11 rounded-2xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
        title="بازگشت به نمای پیش‌فرض"
      >
        <i className="fi fi-rr-house-chimney size-5 text-xl block"></i>
      </button>

      <button
        onClick={zoomIn}
        className="bg-gray-200/90 flex justify-center items-center size-11 rounded-2xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
      >
        <i className="fi fi-rr-add size-5 text-xl block"></i>
      </button>

      <button
        onClick={zoomOut}
        className="bg-gray-200/90 flex justify-center items-center size-11 rounded-2xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
      >
        <i className="fi fi-rr-minus-circle size-5 text-xl block"></i>
      </button>

      <button className="bg-gray-200/90 flex justify-center items-center size-11 rounded-2xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
        <i className="fi fi-rr-arrows-alt-h size-5 text-xl block"></i>
      </button>

      <button className="bg-gray-200/90 flex justify-center items-center size-11 rounded-2xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
        <i className="fi fi-rr-arrows-alt-v size-5 text-xl block"></i>
      </button>
    </div>
  );
};

export default LeftSidebar;
