"use client";

import { toFarsiNumber } from "@/helper/helper";
import useModelStore from "@/store/useModelStore";
import React, { useState } from "react";

const Sidebar = () => {
  const setSelectedModels = useModelStore((state) => state.setSelectedModels);

  const modelsList = [
    { id: 1, path: "/models/element-1.glb" },
    { id: 2, path: "/models/element-2.glb" },
    { id: 3, path: "/models/element-3.glb" },
    { id: 4, path: "/models/element-4.glb" },
    { id: 5, path: "/models/element-5.glb" },
    { id: 6, path: "/models/element-6.glb" },
    { id: 7, path: "/models/element-7.glb" },
    { id: 8, path: "/models/element-8.glb" },
    { id: 9, path: "/models/element-9.glb" },
  ];

  return (
    <div className="w-[275px] flex flex-col gap-4 fixed h-full bottom-0 right-0 bg-white p-4">
      <h2 className="text-gray-800 font-black text-xl">المان های شما</h2>

      {modelsList.map((item, index) => (
        <button
          key={index}
          onClick={() => setSelectedModels(item.path)}
          className="w-full h-32 border rounded-2xl text-sm text-gray-700 flex flex-col items-center justify-center gap-3 hover:border-primaryThemeColor transition-all duration-300"
        >
          <span>المان {toFarsiNumber(index + 1)}</span>
        </button>
      ))}
    </div>
  );
};

export default Sidebar;
