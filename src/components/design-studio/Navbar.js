"use client";

import useModelStore from "@/store/useModelStore";
import React from "react";
import toast from "react-hot-toast";

const Navbar = ({ project }) => {
  const { selectedModels, setSelectedModels } = useModelStore();

  const exportProjectHandler = () => {
    const jsonStr = JSON.stringify(selectedModels, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${project.name}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importProjectHandler = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setSelectedModels(json);
      } catch (err) {
        toast.error("خطا هنگام بارگذاری پروژه")
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="w-full h-8 flex justify-center bg-gray-100">
      <div className="w-full max-w-[1450px] flex">
        <div className="text-sm relative text-gray-700 flex items-center h-full px-2 hover:bg-gray-200 transition-all">
          <span>بارگذاری پروژه</span>

          <input
            type="file"
            accept=".json"
            className="cursor-pointer absolute opacity-0 left-0 w-full"
            onChange={importProjectHandler}
          />
        </div>

        <button
          onClick={exportProjectHandler}
          className="text-sm text-gray-700 flex items-center h-full px-2 hover:bg-gray-200 transition-all"
        >
          دانلود خروجی
        </button>
      </div>
    </div>
  );
};

export default Navbar;
