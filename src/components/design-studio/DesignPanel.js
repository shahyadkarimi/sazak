"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import LeftSidebar from "./LeftSidebar";
import GridPage from "./GridPage";
import { Checkbox } from "@heroui/react";

const DesignPanel = ({project}) => {
  const [isRightOpen, setIsRightOpen] = useState(false); // models sidebar
  const [isLeftOpen, setIsLeftOpen] = useState(false);   // tools sidebar

  const closeAll = () => {
    setIsLeftOpen(false);
    setIsRightOpen(false);
  };

  return (
    <div className="w-full h-[calc(100vh-144px)] relative flex">
      {/* Desktop persistent sidebars */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* 3d view */}
      <GridPage project={project} />

      <div className="hidden md:flex">
        <LeftSidebar />
      </div>

      {/* Mobile floating toggles */}
      <div className="md:hidden">
        <button
          onClick={() => setIsLeftOpen(true)}
          className="fixed bottom-4 left-4 z-30 bg-white/90 backdrop-blur-md border shadow-lg size-11 rounded-2xl text-gray-700 flex items-center justify-center"
          aria-label="open tools"
        >
          <i className="fi fi-rr-apps h-[18px] block text-lg"></i>
        </button>

        <button
          onClick={() => setIsRightOpen(true)}
          className="fixed bottom-4 right-4 z-30 bg-white/90 backdrop-blur-md border shadow-lg size-11 rounded-2xl text-gray-700 flex items-center justify-center"
          aria-label="open models"
        >
          <i className="fi fi-rr-box-open h-[18px] block text-lg"></i>
        </button>
      </div>

      {/* Mobile overlay */}
      {(isLeftOpen || isRightOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeAll}
        />
      )}

      {/* Mobile left drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-20 max-w-[60vw] transform transition-transform duration-300 ease-in-out md:hidden ${
          isLeftOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <LeftSidebar />
      </div>

      {/* Mobile right drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 max-w-[85vw] transform transition-transform duration-300 ease-in-out md:hidden ${
          isRightOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Sidebar />
      </div>
    </div>
  );
};

export default DesignPanel;
