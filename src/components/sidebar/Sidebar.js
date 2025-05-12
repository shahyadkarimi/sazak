"use client";

import { toFarsiNumber } from "@/helper/helper";
import React, { useState } from "react";

const Sidebar = () => {
  return (
    <div className="w-[275px] flex flex-col gap-4 fixed h-full bottom-0 right-0 bg-white p-4">
      <h2 className="text-gray-800 font-black text-xl">المان های شما</h2>

      {new Array(4).fill(true).map((item, index) => (
        <button className="w-full h-32 border rounded-2xl text-sm text-gray-700 flex flex-col items-center justify-center gap-3 hover:border-primaryThemeColor transition-all duration-300">
          <span>المان {toFarsiNumber(index + 1)}</span>
        </button>
      ))}
    </div>
  );
};

export default Sidebar;
