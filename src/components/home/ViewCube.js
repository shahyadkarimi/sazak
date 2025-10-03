"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const FACE_CONFIG = [
  { name: "FRONT", normal: [0, 0, 1], up: [0, 1, 0], color: "#ffffff" },
  { name: "BACK", normal: [0, 0, -1], up: [0, 1, 0], color: "#ffffff" },
  { name: "LEFT", normal: [-1, 0, 0], up: [0, 1, 0], color: "#ffffff" },
  { name: "RIGHT", normal: [1, 0, 0], up: [0, 1, 0], color: "#ffffff" },
  { name: "TOP", normal: [0, 1, 0], up: [0, 0, -1], color: "#ffffff" },
  { name: "BOTTOM", normal: [0, -1, 0], up: [0, 0, 1], color: "#ffffff" },
];

const FACE_NAMES = FACE_CONFIG.map((f) => f.name);

const EDGE_VECTORS = [
  [1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0],
  [1, 0, 1], [1, 0, -1], [-1, 0, 1], [-1, 0, -1],
  [0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1],
];

const CORNER_VECTORS = [
  [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
  [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
];

const CubeFace = ({ name, normal, color }) => {
  const pos = new THREE.Vector3(...normal).clone().multiplyScalar(0.51);
  const look = new THREE.Vector3(...normal).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), look);
  return (
    <group name={name} position={[pos.x, pos.y, pos.z]} quaternion={quat} userData={{ faceName: name }}>
      <mesh name={name} userData={{ faceName: name }}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.95} />
      </mesh>
      <Text
        name={name}
        userData={{ faceName: name }}
        position={[0, 0, 0.01]}
        fontSize={0.22}
        color="#111827"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
    </group>
  );
};

const ViewCubeScene = ({ onSelect }) => {
  const ref = useRef();
  const { camera, gl } = useThree();
  const [hoverId, setHoverId] = useState(null);
  const draggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  // Start facing FRONT slightly from above
  const yawRef = useRef(0);
  const pitchRef = useRef(0.25);
  const yawTargetRef = useRef(yawRef.current);
  const pitchTargetRef = useRef(pitchRef.current);
  const [activeFace] = useState("FRONT");

  // بچرخون مکعب برای هماهنگی با دوربین اصلی
  useFrame(() => {
    if (!ref.current) return;
    const lerpFactor = 0.35;
    yawRef.current += (yawTargetRef.current - yawRef.current) * lerpFactor;
    pitchRef.current += (pitchTargetRef.current - pitchRef.current) * lerpFactor;
    ref.current.rotation.set(pitchRef.current, yawRef.current, 0);
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
          // Walk through all hits to find a face click if the nearest isn't a face
          let faceName = null;
          for (let i = 0; i < intersects.length; i++) {
            faceName = processHit(intersects[i].object);
            if (faceName) break;
          }
          const map = {
            FRONT: [0, 0, 1], BACK: [0, 0, -1], LEFT: [-1, 0, 0], RIGHT: [1, 0, 0], TOP: [0, 1, 0], BOTTOM: [0, -1, 0]
          };
          const v = faceName ? map[faceName] : null;
          if (v) {
            // Keep camera slightly above the grid for side views so grid/models are visible
            const isTopOrBottom = Math.abs(v[1]) > 0.5;
            const radius = isTopOrBottom ? 35 : 25; // farther for TOP/BOTTOM to avoid feeling over-zoomed
            const base = new THREE.Vector3(v[0], v[1], v[2]).multiplyScalar(radius);
            if (!isTopOrBottom) {
              base.y = 17; // elevate FRONT/BACK/LEFT/RIGHT
            }
            // Rotate cube toward the selected face using pure face normal (not elevated)
            const dir = new THREE.Vector3(v[0], v[1], v[2]).normalize();
            const yaw = Math.atan2(dir.x, dir.z);
            const pitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));
            yawTargetRef.current = yaw;
            pitchTargetRef.current = pitch;
            const fov = isTopOrBottom ? 45 : 35; // wider view for TOP/BOTTOM
            onSelect && onSelect({ camera: [base.x, base.y, base.z], fov, immediate: false });
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
      // محدود کردن پیچ برای جلوگیری از برعکس شدن
      const limit = Math.PI / 2 - 0.05;
      pitchTargetRef.current = Math.max(-limit, Math.min(limit, pitchTargetRef.current));

      // دوربین اصلی را هم‌زمان با درگ به‌روزرسانی کن (real-time)
      const radius = 25;
      const dir = new THREE.Vector3(0, 0, 1);
      const euler = new THREE.Euler(pitchTargetRef.current, yawTargetRef.current, 0, 'YXZ');
      dir.applyEuler(euler).normalize();
      const next = dir.multiplyScalar(radius);
      // ensure minimum elevation for better grid visibility
      const minY = 15;
      if (next.y < minY) next.y = minY;
      onSelect && onSelect({ camera: [next.x, next.y, next.z], fov: 40, immediate: true });
    };
    const onDragEnd = () => {
      draggingRef.current = false;
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
    };
  }, [camera, gl, onSelect]);

  return (
    <group ref={ref} scale={1.25}>
      {FACE_CONFIG.map((face) => (
        <CubeFace key={face.name} name={face.name} normal={face.normal} color={face.color} />
      ))}
      {/* Solid cube core for true 3D look */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={1} metalness={0} flatShading />
      </mesh>
      {/* Edge lines to emphasize cube borders */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.001, 1.001, 1.001)]} />
        <lineBasicMaterial color="#111827" linewidth={1} />
      </lineSegments>
    </group>
  );
};

const ViewCube = ({ activeView, onViewChange }) => {
  const handleSelect = (view) => {
    if (!view) return;
    onViewChange && onViewChange({ camera: view.camera, fov: view.fov ?? 40 });
  };

  return (
    <div className="absolute top-2 left-2 w-32 h-32 z-50 select-none">
      <Canvas camera={{ position: [3, 3, 3], fov: 40 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={0.8} />
        <ViewCubeScene onSelect={handleSelect} />
      </Canvas>
    </div>
  );
};

export default ViewCube;
