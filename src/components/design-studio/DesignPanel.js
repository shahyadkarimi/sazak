"use client";

import React, { useState, useRef } from "react";
import Sidebar from "./Sidebar";
import LeftSidebar from "./LeftSidebar";
import GridPage from "./GridPage";
import { Checkbox } from "@heroui/react";
import { Icon } from "@iconify/react";

const DesignPanel = ({ project }) => {
  const [isRightOpen, setIsRightOpen] = useState(true); // desktop default open
  const [isLeftOpen, setIsLeftOpen] = useState(true); // desktop default open
  const [cameraView, setCameraView] = useState(null);
  const mainCameraRef = useRef();

  const closeAll = () => {
    setIsLeftOpen(false);
    setIsRightOpen(false);
  };

  return (
    <div className="w-full h-[calc(100vh-144px)] relative overflow-hidden md:grid md:grid-cols-[auto_1fr_auto] md:items-stretch">
      {/* Sidebar (RIGHT) */}
      <div
        className={`hidden md:block h-full relative transition-all duration-300 ease-in-out ${
          isRightOpen ? "w-80" : "w-3"
        }`}
      >
        {isRightOpen ? (
          <Sidebar onToggle={() => setIsRightOpen(false)} />
        ) : (
          <button
            onClick={() => setIsRightOpen(true)}
            className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-10 rounded-l-xl bg-white border shadow flex items-center justify-center text-gray-600 hover:text-primaryThemeColor z-10"
            title="باز کردن سایدبار راست"
          >
            <Icon
              icon="solar:alt-arrow-left-line-duotone"
              width="24"
              height="24"
            />
          </button>
        )}
      </div>

      {/* Center Grid */}
      <div className="md:block min-w-0">
        <GridPage
          project={project}
          cameraView={cameraView}
          onViewChange={setCameraView}
          mainCameraRef={mainCameraRef}
        />
      </div>

      {/* LeftSidebar (LEFT) */}
      <div
        className={`hidden md:block h-full relative transition-all duration-300 ease-in-out ${
          isLeftOpen ? "w-32" : "w-0"
        }`}
      >
        {isLeftOpen ? (
          <LeftSidebar
            mainCamera={mainCameraRef.current}
            cameraView={cameraView}
            onViewChange={setCameraView}
            onToggle={() => setIsLeftOpen(false)}
          />
        ) : (
          <button
            onClick={() => setIsLeftOpen(true)}
            className="absolute top-1/2 -translate-y-1/2 -right-5 w-5 h-10 rounded-r-xl z-10 bg-white border border-l-0 flex items-center justify-center text-gray-600 hover:text-primaryThemeColor"
            title="باز کردن سایدبار چپ"
          >
            <Icon
              icon="solar:alt-arrow-right-line-duotone"
              width="24"
              height="24"
            />
          </button>
        )}
      </div>

      {/* Desktop edge toggles moved into sidebars as tabs */}

      {/* Mobile: drawers */}
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

      {(isLeftOpen || isRightOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeAll}
        />
      )}

      <div
        className={`fixed top-0 left-0 z-50 h-full w-20 max-w-[60vw] transform transition-transform duration-300 ease-in-out md:hidden ${
          isLeftOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <LeftSidebar
          mainCamera={mainCameraRef.current}
          cameraView={cameraView}
          onViewChange={setCameraView}
        />
      </div>

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
