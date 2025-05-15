"use client";

import { toFarsiNumber } from "@/helper/helper";
import useModelStore from "@/store/useModelStore";
import React, { useState } from "react";

const Sidebar = () => {
  const setCurrentPlacingModel = useModelStore(
    (state) => state.setCurrentPlacingModel
  );

  const modelsList = [
    { id: 1, name: "I3 سبز", path: "/models/I3_green.glb" },
    { id: 2, name: "I3 زرد", path: "/models/I3_yellow.glb" },
    { id: 3, name: "I4 نارنجی", path: "/models/I4_orange.glb" },
    { id: 4, name: "I4 صورتی", path: "/models/I4_pink.glb" },
    { id: 5, name: "L3N نارنجی", path: "/models/L3N_orange.glb" },
    { id: 6, name: "L4S آبی", path: "/models/L4S_blue.glb" },
    { id: 7, name: "L5N نارنجی", path: "/models/L5N_orange.glb" },
    { id: 8, name: "L5N قرمز", path: "/models/L5N_red.glb" },
    { id: 9, name: "L5S آبی", path: "/models/L5S_blue.glb" },
    { id: 10, name: "L5S زرد", path: "/models/L5S_yellow.glb" },
    { id: 11, name: "S10 آبی", path: "/models/S10_blue.glb" },
    { id: 12, name: "S10 قرمز", path: "/models/S10_red.glb" },
    { id: 13, name: "S12 آبی", path: "/models/S12_blue.glb" },
    { id: 14, name: "S12 قرمز", path: "/models/S12_red.glb" },
    { id: 15, name: "U صورتی", path: "/models/U_pink.glb" },
    { id: 16, name: "U زرد", path: "/models/U_yellow.glb" },
  ];

  return (
    <div className="w-[275px] flex flex-col gap-4 fixed h-full bottom-0 right-0 bg-white p-4">
      <h2 className="text-gray-800 font-black text-xl">المان های شما</h2>

      <div className="w-full flex flex-col gap-3 overflow-y-auto">
        {modelsList.map((item, index) => (
          <button
            key={index}
            onClick={() => setCurrentPlacingModel(item.path)}
            className="w-full p-2 border rounded-2xl text-sm text-gray-700 flex flex-col items-center justify-center gap-3 hover:border-primaryThemeColor transition-all duration-300"
          >
            <span>{toFarsiNumber(item.name)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
