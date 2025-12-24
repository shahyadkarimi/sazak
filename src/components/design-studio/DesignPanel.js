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
  const [isRightMobileOpen, setIsRightMobileOpen] = useState(false);
  const [isLeftMobileOpen, setIsLeftMobileOpen] = useState(false);

  const [cameraView, setCameraView] = useState({
    camera: [0, 22, 45],
    fov: 45,
    immediate: false,
  });
  const mainCameraRef = useRef();

  const closeAll = () => {
    setIsLeftOpen(false);
    setIsRightOpen(false);
  };

  const closeAllMobile = () => {
    setIsLeftMobileOpen(false);
    setIsRightMobileOpen(false);
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
            className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-10 rounded-l-xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primaryThemeColor z-10"
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
      <div className="md:block h-full md:h-auto min-w-0">
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
            className="absolute top-1/2 -translate-y-1/2 -right-5 w-5 h-10 rounded-r-xl z-10 bg-white dark:bg-gray-800 border dark:border-gray-700 border-l-0 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primaryThemeColor"
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

      {/* Mobile: drawers */}
      <div className="md:hidden">
        <button
          onClick={() => setIsLeftMobileOpen(true)}
          className="fixed bottom-14 left-4 z-30 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border dark:border-gray-700 shadow-lg size-11 rounded-2xl text-gray-700 dark:text-gray-200 flex items-center justify-center"
          aria-label="open tools"
        >
          <i className="fi fi-rr-apps h-[18px] block text-lg"></i>
        </button>

        <button
          onClick={() => setIsRightMobileOpen(true)}
          className="fixed bottom-14 right-4 z-30 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border dark:border-gray-700 shadow-lg size-11 rounded-2xl text-gray-700 dark:text-gray-200 flex items-center justify-center"
          aria-label="open models"
        >
          <i className="fi fi-rr-box-open h-[18px] block text-lg"></i>
        </button>
      </div>

      {/* isRightMobileOpen || isLeftMobileOpen */}
      {(isRightMobileOpen || isLeftMobileOpen) && (
        <div
          className="fixed inset-0 bg-black/40 z-50"
          onClick={closeAllMobile}
        />
      )}

      {/* LeftSidebar Mobile */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-32 max-w-[60vw] transform transition-all duration-300 ease-in-out md:hidden ${
          isLeftMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <LeftSidebar
          mainCamera={mainCameraRef.current}
          cameraView={cameraView}
          onViewChange={setCameraView}
        />
      </div>

      {/* Sidebar Mobile */}
      <div
        className={`fixed top-0 bottom-0 z-50 min-h-full w-72 max-w-[85vw] transform transition-all duration-300 ease-in-out md:hidden ${
          isRightMobileOpen ? "right-0" : "-right-full"
        }`}
      >
        <Sidebar />
      </div>
    </div>
  );
};

export default DesignPanel;
