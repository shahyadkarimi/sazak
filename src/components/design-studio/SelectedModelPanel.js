"use client";

import React, { useMemo, useState, useEffect } from "react";
import useModelStore from "@/store/useModelStore";

const PRESET_COLORS = [
  { name: "قرمز", hex: "#ef4444" },
  { name: "آبی", hex: "#3b82f6" },
  { name: "سبز", hex: "#22c55e" },
  { name: "زرد", hex: "#eab308" },
  { name: "نارنجی", hex: "#f97316" },
  { name: "بنفش", hex: "#a855f7" },
  { name: "مشکی", hex: "#000000" },
  { name: "سفید", hex: "#ffffff" },
];

const SelectedModelPanel = () => {
  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const selectedModels = useModelStore((s) => s.selectedModels);
  const updateModelColor = useModelStore((s) => s.updateModelColor);
  const updateModelNoColor = useModelStore((s) => s.updateModelNoColor);
  const showColorPanel = useModelStore((s) => s.showColorPanel);
  const setShowColorPanel = useModelStore((s) => s.setShowColorPanel);

  const initialColor = useMemo(() => {
    if (!selectedModelId) return null;
    if (selectedModelId === "ALL") {
      // If all selected, if all have same color show it, else null
      const colors = Array.from(new Set(selectedModels.map((m) => m.color).filter(Boolean)));
      return colors.length === 1 ? colors[0] : null;
    }
    if (Array.isArray(selectedModelId)) {
      const colors = Array.from(
        new Set(
          selectedModels
            .filter((m) => selectedModelId.includes(m.id))
            .map((m) => m.color)
            .filter(Boolean)
        )
      );
      return colors.length === 1 ? colors[0] : null;
    }
    const model = selectedModels.find((m) => m.id === selectedModelId);
    return model?.color || null;
  }, [selectedModelId, selectedModels]);

  const initialNoColor = useMemo(() => {
    if (!selectedModelId) return false;
    if (selectedModelId === "ALL") {
      const statuses = Array.from(
        new Set(selectedModels.map((m) => !!m.noColor))
      );
      return statuses.length === 1 ? statuses[0] : false;
    }
    if (Array.isArray(selectedModelId)) {
      const statuses = Array.from(
        new Set(
          selectedModels
            .filter((m) => selectedModelId.includes(m.id))
            .map((m) => !!m.noColor)
        )
      );
      return statuses.length === 1 ? statuses[0] : false;
    }
    const model = selectedModels.find((m) => m.id === selectedModelId);
    return !!model?.noColor;
  }, [selectedModelId, selectedModels]);

  const [color, setColor] = useState(initialColor || null);
  const [isNoColor, setIsNoColor] = useState(initialNoColor);

  useEffect(() => {
    setColor(initialColor || null);
  }, [initialColor]);

  useEffect(() => {
    setIsNoColor(initialNoColor);
  }, [initialNoColor]);

  // Close color panel when model is deselected
  useEffect(() => {
    if (!selectedModelId && showColorPanel) {
      setShowColorPanel(false);
    }
  }, [selectedModelId, showColorPanel, setShowColorPanel]);

  if (!selectedModelId || !showColorPanel) return null;

  const applyColor = (hex) => {
    setIsNoColor(false);
    setColor(hex);
    updateModelColor(selectedModelId, hex);
  };

  const applyTransparent = () => {
    setIsNoColor(false);
    setColor(null);
    updateModelColor(selectedModelId, null);
  };

  const applyNoColor = () => {
    setIsNoColor(true);
    setColor(null);
    updateModelNoColor(selectedModelId, true);
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-lg shadow-gray-100 dark:shadow-gray-900 border border-gray-100 dark:border-gray-700 p-3 w-56">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">انتخاب رنگ مدل</span>
          <div className="w-5 h-5 rounded-full border dark:border-gray-600" style={{ background: color || '#ffffff' }} />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-4 grid grid-cols-2 gap-2">
            <button
              onClick={applyTransparent}
              className="h-8 flex items-center justify-center text-xs font-light bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-all"
              title="شفاف"
            >
              شفاف
            </button>
            <button
              onClick={applyNoColor}
              className={`h-8 flex items-center justify-center text-xs font-light rounded-xl transition-all ${
                isNoColor
                  ? "bg-primaryThemeColor/10 dark:bg-primaryThemeColor/20 text-primaryThemeColor border border-primaryThemeColor/30 dark:border-primaryThemeColor/40"
                  : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
              }`}
              title="بدون رنگ"
            >
              بدون رنگ
            </button>
          </div>
          <div className="col-span-4 flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-300">انتخاب رنگ</span>
            <input
              type="color"
              value={color || '#cccccc'}
              onChange={(e) => applyColor(e.target.value)}
              className="w-10 h-6 p-0 border-0 bg-transparent cursor-pointer"
              title="Color Picker"
            />
          </div>
          {PRESET_COLORS.map((c) => (
            <button
              key={c.hex}
              onClick={() => applyColor(c.hex)}
              className="group flex items-center justify-center"
              title={c.name}
            >
              <span
                style={{ backgroundColor: c.hex }}
                className="size-6 rounded-full border border-gray-200 dark:border-gray-600 group-hover:scale-110 transition"
              ></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectedModelPanel;


