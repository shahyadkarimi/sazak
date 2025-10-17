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

  const [color, setColor] = useState(initialColor || null);

  useEffect(() => {
    setColor(initialColor || null);
  }, [initialColor]);

  if (!selectedModelId) return null;

  const applyColor = (hex) => {
    setColor(hex);
    updateModelColor(selectedModelId, hex);
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg shadow-gray-100 border border-gray-100 p-3 w-56">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-800">انتخاب رنگ مدل</span>
          <div className="w-5 h-5 rounded-full border" style={{ background: color || '#ffffff' }} />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => applyColor(null)}
            className="col-span-4 h-8 flex items-center justify-center text-xs font-light bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
            title="شفاف"
          >
            شفاف
          </button>
          <div className="col-span-4 flex items-center justify-between">
            <span className="text-xs text-gray-600">انتخاب رنگ</span>
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
                className="size-6 rounded-full border border-gray-200 group-hover:scale-110 transition"
              ></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectedModelPanel;


