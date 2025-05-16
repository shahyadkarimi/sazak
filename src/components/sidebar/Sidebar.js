"use client";

import { toFarsiNumber } from "@/helper/helper";
import useModelStore from "@/store/useModelStore";
import React, { useRef, useState } from "react";

const Sidebar = () => {
  const setCurrentPlacingModel = useModelStore(
    (state) => state.setCurrentPlacingModel
  );
  const [activeModel, setActiveModel] = useState(null);
  const [colorBoxPos, setColorBoxPos] = useState({ top: 0, right: 0 });

  const buttonRefs = useRef({}); // برای نگه‌داشتن ref هر مدل

  const rawModelsList = [
    { id: 1, name: "I3", color: "سبز", path: "/models/I3_green.glb" },
    { id: 2, name: "I3", color: "زرد", path: "/models/I3_yellow.glb" },
    { id: 3, name: "I4", color: "نارنجی", path: "/models/I4_orange.glb" },
    { id: 4, name: "I4", color: "صورتی", path: "/models/I4_pink.glb" },
    { id: 5, name: "L3N", color: "نارنجی", path: "/models/L3N_orange.glb" },
    { id: 6, name: "L4S", color: "آبی", path: "/models/L4S_blue.glb" },
    { id: 7, name: "L5N", color: "نارنجی", path: "/models/L5N_orange.glb" },
    { id: 8, name: "L5N", color: "قرمز", path: "/models/L5N_red.glb" },
    { id: 9, name: "L5S", color: "آبی", path: "/models/L5S_blue.glb" },
    { id: 10, name: "L5S", color: "زرد", path: "/models/L5S_yellow.glb" },
    { id: 11, name: "S10", color: "آبی", path: "/models/S10_blue.glb" },
    { id: 12, name: "S10", color: "قرمز", path: "/models/S10_red.glb" },
    { id: 13, name: "S12", color: "آبی", path: "/models/S12_blue.glb" },
    { id: 14, name: "S12", color: "قرمز", path: "/models/S12_red.glb" },
    { id: 15, name: "U", color: "صورتی", path: "/models/U_pink.glb" },
    { id: 16, name: "U", color: "زرد", path: "/models/U_yellow.glb" },
  ];

  const groupedModels = rawModelsList.reduce((acc, model) => {
    if (!acc[model.name]) acc[model.name] = [];
    acc[model.name].push(model);
    return acc;
  }, {});

  const handleModelClick = (modelName) => {
    if (activeModel === modelName) {
      setActiveModel(null);
    } else {
      const btn = buttonRefs.current[modelName];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setColorBoxPos({
          top: rect.top + window.scrollY,
          right: window.innerWidth - rect.right + 10, // فاصله از دکمه
        });
      }
      setActiveModel(modelName);
    }
  };

  return (
    <>
      <div className="w-[275px] flex flex-col gap-4 fixed h-full bottom-0 right-0 bg-white p-4 z-50 shadow-lg">
        <h2 className="text-gray-800 font-black text-xl">المان های شما</h2>

        <div className="w-full scroll-bar flex flex-col gap-3 overflow-y-auto pl-3">
          {Object.entries(groupedModels).map(([modelName]) => (
            <button
              key={modelName}
              ref={(el) => (buttonRefs.current[modelName] = el)}
              onClick={() => handleModelClick(modelName)}
              className="w-full p-2 border rounded-2xl text-sm text-gray-700 flex items-center justify-center hover:border-primaryThemeColor transition-all duration-300"
            >
              {toFarsiNumber(modelName)}
            </button>
          ))}
        </div>
      </div>

      {/* رنگ‌ها کنار دکمه کلیک‌شده */}
      {activeModel && (
        <div
          className="flex items-center gap-4 absolute z-50 bg-white py-3 px-4 rounded-2xl shadow-lg shadow-gray-200"
          style={{
            top: colorBoxPos.top - 5,
            right: 285,
          }}
        >
          {groupedModels[activeModel].map((variant) => (
            <button
              key={variant.path}
              title={variant.color}
              onClick={() => {
                setCurrentPlacingModel(variant.path);
                setActiveModel(null);
              }}
              className="flex items-center gap-2 text-sm group text-gray-800 hover:text-primaryThemeColor transition-all duration-300"
            >
              <span
                style={{ backgroundColor: getColorHex(variant.color) }}
                className="size-5 rounded-full group-hover:scale-110 transition-all duration-300"
              ></span>
              <span>{variant.color}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default Sidebar;

// رنگ‌ها
const getColorHex = (color) => {
  switch (color) {
    case "سبز":
      return "#22c55e";
    case "زرد":
      return "#facc15";
    case "نارنجی":
      return "#ea580c";
    case "صورتی":
      return "#db2777";
    case "قرمز":
      return "#dc2626";
    case "آبی":
      return "#3b82f6";
    default:
      return "#ccc";
  }
};
