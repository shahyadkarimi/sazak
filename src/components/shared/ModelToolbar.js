import { toFarsiNumber } from "@/helper/helper";
import useModelStore from "@/store/useModelStore";
import React from "react";
import MoveIcon from "../icons/MoveIcon";
import DuplicateIcon from "../icons/DuplicateIcon";
import SizeIcon from "../icons/SizeIcon";
import DeleteIcon from "../icons/DeleteIcon";
import RotateIcon from "../icons/RotateIcon";

const ModelToolbar = ({
  mode,
  setMode,
  rotateSnap,
  setRotateSnap,
  activeModelId,
  setActiveModelId,
  modelRefs,
}) => {
  const selectedModels = useModelStore((state) => state.selectedModels);

  const rotationOptions = [15, 30, 45, 90, 180];

  const duplicateModelHandler = () => {
    const currentModel = selectedModels.find((m) => m.id === activeModelId);
    if (!currentModel) {
      return;
    }

    const object = modelRefs.current[activeModelId]; // گرفتن مدل از scene
    if (!object) {
      return;
    }

    const newId = Date.now();

    const newModel = {
      ...currentModel,
      id: newId,
      position: [
        object.position.x, // استفاده از موقعیت فعلی در صحنه
        object.position.y,
        object.position.z + 2,
      ],
      rotation: [
        object.rotation.x, // استفاده از چرخش فعلی در صحنه
        object.rotation.y,
        object.rotation.z,
      ],
    };

    useModelStore.setState((state) => ({
      selectedModels: [...state.selectedModels, newModel],
    }));

    setActiveModelId(newId);
  };

  const deleteModelHandler = () => {
    useModelStore.setState((state) => ({
      selectedModels: state.selectedModels.filter(
        (model) => model.id !== activeModelId
      ),
    }));
    
    setActiveModelId(null);
  };

  return (
    <div className="min-w-fit absolute flex flex-col gap-3 top-2 text-sm left-2 z-10 ">
      <div className="flex gap-5 bg-white py-3 px-4 rounded-2xl shadow-lg shadow-gray-200">
        <button
          onClick={() => setMode("translate")}
          className={`flex items-center gap-1 ${
            mode === "translate" ? "text-primaryThemeColor" : ""
          } hover:text-primaryThemeColor transition-all duration-300`}
        >
          <MoveIcon />
          <span>حرکت</span>
        </button>

        <button
          onClick={() => setMode("rotate")}
          className={`flex items-center gap-1 ${
            mode === "rotate" ? "text-primaryThemeColor" : ""
          } hover:text-primaryThemeColor transition-all duration-300`}
        >
          <RotateIcon />
          <span>چرخش</span>
        </button>

        <button
          onClick={duplicateModelHandler}
          className="flex items-center gap-1 hover:text-primaryThemeColor transition-all duration-300"
        >
          <DuplicateIcon />
          <span>کپی</span>
        </button>
        <button
          disabled
          onClick={() => setMode("scale")}
          className={`flex items-center gap-1 disabled:opacity-60 ${
            mode === "scale" ? "text-primaryThemeColor" : ""
          }`}
        >
          <SizeIcon />
          <span>بزرگ‌نمایی</span>
        </button>

        <button
          onClick={deleteModelHandler}
          className="flex items-center gap-1 hover:text-red-600 transition-all duration-300"
        >
          <DeleteIcon />
          <span>حذف</span>
        </button>
      </div>

      <div className="relative group">
        {/* منوی دکمه‌ها برای انتخاب زاویه چرخش */}
        {mode === "rotate" && (
          <div className="w-fit flex items-center gap-4 text-xs text-gray-700 h-auto py-2 px-3 rounded-xl shadow-lg shadow-gray-100 bg-white">
            <span>درجه چرخش:</span>
            {rotationOptions.map((angle) => (
              <button
                key={angle}
                onClick={() => setRotateSnap(angle)}
                className={`hover:text-primaryThemeColor transition-all duration-300 ${
                  rotateSnap === angle ? "text-primaryThemeColor" : ""
                }`}
              >
                {toFarsiNumber(angle)}°
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelToolbar;
