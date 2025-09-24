"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import React, { useEffect, useRef, useState } from "react";
import useModelStore from "@/store/useModelStore";
import Model from "./Model";
import ModelPlacer from "./ModelPlacer";
import CustomGrid from "../home/CustomGrid";
import { Checkbox } from "@heroui/react";
import { postData } from "@/services/API";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

const GridPage = ({ project }) => {
  const selectedModels = useModelStore((state) => state.selectedModels);
  const isAdjustingHeight = useModelStore((state) => state.isAdjustingHeight);
  const [autoSave, setAutoSave] = useState(false);

  const router = useRouter();

  const [cameraPosition, setCameraPosition] = useState({
    camera: [10, 10, 10],
    fov: 50,
  });

  useEffect(() => {
    setAutoSave(project.autoSave);
  }, []);

  return (
    <div className="w-full h-full relative">
      <Toaster />
      <div className="absolute flex justify-center items-center top-4 right-4 bg-white p-2 px-3 rounded-xl shadow-lg shadow-gray-100">
        <Checkbox
          classNames={{ label: "text-sm text-gray-700" }}
          isSelected={autoSave}
          onValueChange={(value) => {
            setAutoSave(value);

            postData("/project/auto-save", { id: project._id })
              .then((res) => {
                router.refresh();
              })
              .catch((err) => {
                setAutoSave(false);
                toast.error("خطا هنگام فعالسازی ذخیره خودکار");
              });
          }}
        >
          ذخیره خودکار
        </Checkbox>
      </div>

      <Canvas
        className="design-studio"
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: cameraPosition.camera, fov: 50 }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />

        {/* <CameraUpdater
          position={cameraPosition.camera}
          fov={cameraPosition.fov}
        /> */}

        {selectedModels.map((model) => (
          <Model
            key={model.id}
            id={model.id}
            path={model.path}
            position={model.position}
            rotation={model.rotation}
          />
        ))}

        <ModelPlacer />

        <CustomGrid />

        <OrbitControls
          enableRotate={!isAdjustingHeight}
          enablePan={!isAdjustingHeight}
        />
      </Canvas>

      {/* <ViewCube onViewChange={setCameraPosition} /> */}
    </div>
  );
};

export default GridPage;
