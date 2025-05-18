"use client";

import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import useModelStore from "@/store/useModelStore";

const snapToGrid = ([x, y, z], step = 1) => {
  return [Math.round(x / step) * step, y, Math.round(z / step) * step];
};

// تابع بررسی برخورد مدل جدید با مدل‌های قبلی و اصلاح موقعیت برای نچسبیدن به هم
const adjustPositionToAvoidOverlap = (pos, models) => {
  const step = 1;
  let adjustedPos = new THREE.Vector3(...pos);

  for (const model of models) {
    const modelPos = new THREE.Vector3(...model.position);

    // فرض می‌گیریم سایز واقعی مدل را با Box3 از مدل بارگذاری شده بگیریم:
    // برای این منظور باید مدل هر آبجکت رو لود کنیم یا ابعادش را داشته باشیم.
    // اینجا یک نمونه ساده با اندازه 1x1x1 فرض می‌کنیم و به عنوان نمونه جایگزینش کن:

    const modelBox = new THREE.Box3().setFromCenterAndSize(
      modelPos,
      new THREE.Vector3(step, step, step)
    );

    // جعبه مدل جدید روی موقعیت پیشنهادی
    let newBox = new THREE.Box3().setFromCenterAndSize(
      adjustedPos,
      new THREE.Vector3(step, step, step)
    );

    if (modelBox.intersectsBox(newBox)) {
      // وقتی برخورد داریم، مدل جدید را دقیقاً کنار مدل قبلی می‌چسبانیم

      // فاصله لازم برای چسبیدن روی محور x,z (برای فرض گرید دوبعدی)
      // اینجا فرض می‌کنیم مدل‌ها در محور y روی زمین هستند (y=0)
      // و می‌خواهیم مدل جدید را دقیقاً کنار مدل قبلی بدون فاصله قرار دهیم.

      // به صورت ساده می‌تونیم مدل جدید رو روی محور x یا z جابجا کنیم تا نچسبه به قبلی
      // مثلا اگر مدل جدید وسطش روی x کمتره، بذاریم کنارش روی x جابجا بشه:

      if (adjustedPos.x < modelPos.x) {
        adjustedPos.x = modelBox.min.x - step / 2;
      } else {
        adjustedPos.x = modelBox.max.x + step / 2;
      }

      // همچنین اگر روی محور z نزدیک هستیم، این کار رو انجام بدیم
      if (Math.abs(adjustedPos.z - modelPos.z) < step) {
        if (adjustedPos.z < modelPos.z) {
          adjustedPos.z = modelBox.min.z - step / 2;
        } else {
          adjustedPos.z = modelBox.max.z + step / 2;
        }
      }

      // فرض می‌کنیم مدل‌ها روی زمین هستن و ارتفاع y ثابت است
      adjustedPos.y = modelPos.y;
    }
  }

  return [adjustedPos.x, adjustedPos.y, adjustedPos.z];
};

const ModelPlacer = () => {
  const { raycaster, camera, gl, scene } = useThree();

  const [hoverPos, setHoverPos] = useState(null);
  const planeRef = useRef();

  const selectedModels = useModelStore((s) => s.selectedModels);
  const currentPlacingModel = useModelStore((s) => s.currentPlacingModel);
  const setCurrentPlacingModel = useModelStore((s) => s.setCurrentPlacingModel);
  const setSelectedModels = useModelStore((s) => s.setSelectedModels);
  const setSelectedModelId = useModelStore((s) => s.setSelectedModelId);

  const { scene: originalScene } = currentPlacingModel
    ? useGLTF(currentPlacingModel, true)
    : { scene: null };

  const previewModel = useMemo(() => {
    if (!originalScene) return null;

    const clonedScene = originalScene.clone();

    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    box.getCenter(center);

    clonedScene.position.sub(center);

    return clonedScene;
  }, [originalScene]);

  useFrame(() => {
    if (!currentPlacingModel || !planeRef.current) return;

    const mouse = new THREE.Vector2();
    if (gl && gl.domElement) {
      mouse.x = (gl.domElement.mouseX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(gl.domElement.mouseY / gl.domElement.clientHeight) * 2 + 1;
    }

    raycaster.setFromCamera(mouse, camera);
    raycaster.layers.set(0);
    const intersects = raycaster.intersectObject(planeRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const baseSnapped = snapToGrid([point.x, 0, point.z], 1);

      // اصلاح موقعیت با چک برخورد با مدل‌های قبلی
      const adjusted = adjustPositionToAvoidOverlap(
        baseSnapped,
        selectedModels
      );

      setHoverPos(adjusted);
    }
  });

  const handleClick = () => {
    if (hoverPos && currentPlacingModel) {
      setSelectedModels({
        id: Date.now(),
        path: currentPlacingModel,
        position: hoverPos,
        rotation: [0, 0, 0],
      });
      setCurrentPlacingModel(null);
    } else {
      raycaster.layers.set(0);
      raycaster.setFromCamera(
        {
          x: (gl.domElement.mouseX / gl.domElement.clientWidth) * 2 - 1,
          y: -(gl.domElement.mouseY / gl.domElement.clientHeight) * 2 + 1,
        },
        camera
      );

      const intersects = raycaster.intersectObjects(
        scene.children.filter(
          (child) =>
            child !== previewModel &&
            (child.isMesh || child === planeRef.current)
        ),
        true
      );

      if (intersects.length === 0) {
        setSelectedModelId(null);
      } else if (intersects[0].object === planeRef.current) {
        setSelectedModelId(null);
      }
    }
  };

  useEffect(() => {
    if (!gl || !gl.domElement) return;

    const updateMousePosition = (event) => {
      gl.domElement.mouseX = event.clientX;
      gl.domElement.mouseY = event.clientY;
    };

    gl.domElement.addEventListener("mousemove", updateMousePosition);
    gl.domElement.addEventListener("click", handleClick);

    return () => {
      gl.domElement.removeEventListener("mousemove", updateMousePosition);
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [
    hoverPos,
    currentPlacingModel,
    selectedModels,
    gl,
    setSelectedModels,
    setCurrentPlacingModel,
    setSelectedModelId,
    previewModel,
  ]);

  return (
    <>
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        visible={false}
        layers={0}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {hoverPos && previewModel && (
        <group position={new THREE.Vector3(...hoverPos)}>
          <primitive object={previewModel} scale={100} />
        </group>
      )}
    </>
  );
};

export default ModelPlacer;
