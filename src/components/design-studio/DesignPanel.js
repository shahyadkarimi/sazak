"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import LeftSidebar from "./LeftSidebar";
import GridPage from "./GridPage";
import { Checkbox } from "@heroui/react";

const DesignPanel = ({project}) => {
  return (
    <div className="w-full h-[calc(100vh-176px)] relative flex gap-4">
      {/* sidebar */}
      <Sidebar />

      {/* 3d view */}
      <GridPage project={project} />

      {/* left tools sidebar */}
      <LeftSidebar />
    </div>
  );
};

export default DesignPanel;
