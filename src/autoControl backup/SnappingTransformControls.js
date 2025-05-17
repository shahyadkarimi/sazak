import { TransformControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import useModelStore from "@/store/useModelStore";

const SnappingTransformControls = ({
  object,
  mode = "translate",
  snap = 1,
  rotateSnap = 45,
  minY = 0,
  color = "#a600ff",
  onStart = () => {},
  onEnd = () => {},
  onObjectChange = () => {}, 
}) => {
  const controlsRef = useRef();

  useFrame(() => {
    if (controlsRef.current?.dragging && object) {
      if (mode === "translate") {
        const pos = object.position;
        pos.x = Math.round(pos.x / snap) * snap;
        pos.y = Math.max(Math.round(pos.y / snap) * snap, minY);
        pos.z = Math.round(pos.z / snap) * snap;
      }

      if (mode === "rotate") {
        const rot = object.rotation;
        rot.x =
          Math.round(rot.x / (rotateSnap * (Math.PI / 180))) *
          (rotateSnap * (Math.PI / 180));
        rot.y =
          Math.round(rot.y / (rotateSnap * (Math.PI / 180))) *
          (rotateSnap * (Math.PI / 180));
        rot.z =
          Math.round(rot.z / (rotateSnap * (Math.PI / 180))) *
          (rotateSnap * (Math.PI / 180));
      }
    }
  });

  useEffect(() => {
    if (controlsRef.current) {
      const gizmo = controlsRef.current;
      gizmo.traverse((child) => {
        if (child.material) {
          // تغییر رنگ همه متریال‌ها
          child.material.color.set(color);
          child.material.needsUpdate = true;
        }
      });
    }
  }, [color, object]);

  return (
    <TransformControls
      ref={controlsRef}
      object={object}
      mode={mode}
      onMouseDown={onStart}
      onMouseUp={onEnd}
      onObjectChange={onObjectChange}
    />
  );
};

export default SnappingTransformControls;