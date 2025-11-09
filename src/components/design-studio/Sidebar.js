"use client";

import { toFarsiNumber } from "@/helper/helper";
import useClickOutside from "@/hooks/useClickOutside";
import useModelStore from "@/store/useModelStore";
import { button, cn, Input, MenuItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import React, { useRef, useState } from "react";
import dynamic from "next/dynamic";

const ModelThumbnail = dynamic(() => import("./ModelThumbnail"), {
  ssr: false,
});

const filters = [
  { name: "همه", value: "all" },
  { name: "تخت", value: "plate" },
  { name: "اتصالی", value: "connector" },
  { name: "پیچ ها", value: "screw" },
];

const Sidebar = ({ onToggle }) => {
  const setCurrentPlacingModel = useModelStore(
    (state) => state.setCurrentPlacingModel
  );
  const setCurrentPlacingModelColor = useModelStore(
    (state) => state.setCurrentPlacingModelColor
  );
  const [activeModel, setActiveModel] = useState(null);
  const [colorBoxPos, setColorBoxPos] = useState({ top: 0, right: 0 });
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [search, setSearch] = useState("");

  const buttonRefs = useRef({});
  const colorRef = useRef(null);

  useClickOutside(colorRef, () => {
    setActiveModel(null);
  });

  const modelList = [
    {
      id: 1,
      path: "/models/3_ways_Piece.glb",
      nameEn: "3-Way Connector",
      nameFa: "L4",
      type: "connector",
      color: "#ef4444",
    },
    {
      id: 2,
      path: "/models/I_Piece_2_hole_1_track_hole_Onde_Sided_Plate _12cm.glb",
      nameEn: "Straight Plate 12cm",
      nameFa: "شیاری بلند",
      type: "plate",
      color: "#3b82f6",
    },
    {
      id: 3,
      path: "/models/I_Piece_2_hole_1_track_hole_One_Sided_Plate_8cm.glb",
      nameEn: "Straight Plate 8cm",
      nameFa: "شیاری کوتاه",
      type: "plate",
      color: "#22c55e",
    },
    {
      id: 4,
      path: "/models/I_Piece_2_hole_1side_hole.glb",
      nameEn: "Straight Bar",
      nameFa: "I2",
      type: "connector",
      color: "#eab308",
    },
    {
      id: 5,
      path: "/models/I_Piece_3_hole__2_side_hole.glb",
      nameEn: "Straight Bar (3H)",
      nameFa: "I3",
      type: "connector",
      color: "#f97316",
    },
    {
      id: 6,
      path: "/models/I_Piece_4_hole__3_side_hole.glb",
      nameEn: "Straight Bar (4H)",
      nameFa: "I4",
      type: "connector",
      color: "#a855f7",
    },
    {
      id: 7,
      path: "/models/I_Piece_4_hole_4_side_hole.glb",
      nameEn: "Straight Bar (4H Side)",
      nameFa: "I4",
      type: "connector",
      color: "#10b981",
    },
    {
      id: 8,
      path: "/models/I_Piece_6_hole_I_Piece_With_1_Track.glb",
      nameEn: "Track Bar",
      nameFa: "S7",
      type: "plate",
      color: "#0ea5e9",
    },
    {
      id: 9,
      path: "/models/I_piece_10_hole_One_Sided_Plate.glb",
      nameEn: "Long Plate",
      nameFa: "S10",
      type: "plate",
      color: "#6366f1",
    },
    {
      id: 10,
      path: "/models/I_piece_12_hole_One_Sided_Plate.glb",
      nameEn: "Long Plate",
      nameFa: "S12",
      type: "plate",
      color: "#6366f1",
    },
    {
      id: 11,
      path: "/models/I_piece_16_hole_One_Sided_Plate.glb",
      nameEn: "Long Plate",
      nameFa: "S16",
      type: "plate",
      color: "#6366f1",
    },
    {
      id: 12,
      path: "/models/L_Piece_3_hole_1_side_hole.glb",
      nameEn: "L-Angle Small",
      nameFa: "L3",
      type: "connector",
      color: "#f43f5e",
    },
    {
      id: 13,
      path: "/models/L_Piece_3_hole_2_track_hole_One_Sided_Plate.glb",
      nameEn: "L-Angle with Track",
      nameFa: "L7T",
      type: "L",
      color: "#22d3ee",
    },
    {
      id: 14,
      path: "/models/L_Piece_4_hole_1_side_hole.glb",
      nameEn: "L-Angle Medium",
      nameFa: "L4",
      type: "connector",
      color: "#84cc16",
    },
    {
      id: 15,
      path: "/models/L_Piece_5_hole_2_side_hole.glb",
      nameEn: "L-Angle Large",
      nameFa: "L5",
      type: "connector",
      color: "#fb7185",
    },
    {
      id: 16,
      path: "/models/L_Piece_5_hole_4_side_hole.glb",
      nameEn: "L-Angle Extra",
      nameFa: "L5 تداخلی",
      type: "connector",
      color: "#f59e0b",
    },
    {
      id: 17,
      path: "/models/L_Piece_5_hole_One_sided_Plate.glb",
      nameEn: "L-Plate",
      nameFa: "L5T",
      type: "connector",
      color: "#64748b",
    },
    {
      id: 18,
      path: "/models/U_Piece_7_hole_4_side_hole.glb",
      nameEn: "U-Channel",
      nameFa: "U",
      type: "connector",
      color: "#14b8a6",
    },
      {
        id: 19,
        path: "/models/Screw_1cm.glb",
        nameEn: "Screw 1cm",
        nameFa: "پیچ 1cm",
        type: "screw",
        color: "#374151",
      },
      {
        id: 20,
        path: "/models/Screw_2cm.glb",
        nameEn: "Screw 2cm",
        nameFa: "پیچ 2cm",
        type: "screw",
        color: "#374151",
      },
      {
        id: 21,
        path: "/models/Screw_3cm.glb",
        nameEn: "Screw 3cm",
        nameFa: "پیچ 3cm",
        type: "screw",
        color: "#374151",
      },
      {
        id: 22,
        path: "/models/Screw_4cm.glb",
        nameEn: "Screw 4cm",
        nameFa: "پیچ 4cm",
        type: "screw",
        color: "#374151",
      },
      {
        id: 23,
        path: "/models/Screw_5cm.glb",
        nameEn: "Screw 5cm",
        nameFa: "پیچ 5cm",
        type: "screw",
        color: "#374151",
      },
      {
        id: 24,
        path: "/models/Screw_6cm.glb",
        nameEn: "Screw 6cm",
        nameFa: "پیچ 6cm",
        type: "screw",
        color: "#374151",
      },
      {
        id: 25,
        path: "/models/Screw_8cm.glb",
        nameEn: "Screw 8cm",
        nameFa: "پیچ 8cm",
        type: "screw",
        color: "#374151",
      },
      {
        id: 26,
        path: "/models/Screw_10cm.glb",
        nameEn: "Screw 10cm",
        nameFa: "پیچ 10cm",
        type: "screw",
        color: "#374151",
      },
  ];

//   Access Key	asb2n9h31feq4cun	
// Secret Key	8acb4510-ec61-4b72-b0ac-ca26d314b05e	

  const groupedModels = {
    all: modelList,
    connector: modelList.filter((m) =>
      ["connector", "L", "U"].includes(m.type)
    ),
    plate: modelList.filter((m) => m.type === "plate"),
    screw: modelList.filter((m) => m.type === "screw"),
  };

  const colors = [
    { name: "قرمز", hex: "#ef4444" },
    { name: "آبی", hex: "#3b82f6" },
    { name: "سبز", hex: "#22c55e" },
    { name: "زرد", hex: "#eab308" },
    { name: "نارنجی", hex: "#f97316" },
    { name: "بنفش", hex: "#a855f7" },
    { name: "مشکی", hex: "#000000" },
    { name: "سفید", hex: "#ffffff" },
  ];

  const clickModelHandler = (modelId) => {
    if (activeModel === modelId) {
      setActiveModel(null);
    } else {
      const btn = buttonRefs.current[modelId];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setColorBoxPos({
          top: rect.top + window.scrollY,
          right: window.innerWidth - rect.right + 10,
        });
      }
      setActiveModel(modelId);
      const model = modelList.find((m) => m.id === modelId);
      if (model?.color) {
        setCurrentPlacingModelColor(model.color);
      }
    }
  };

  const filteredModels = groupedModels[selectedFilter];

  const searchedModels = filteredModels.filter((item) =>
    item.nameFa.includes(search)
  );

  return (
    <>
      <div className="relative min-w-80 max-w-80 h-full flex flex-col gap-4 bg-white p-4 md:h-[calc(100vh-144px)]">
        {typeof onToggle === "function" && (
          <button
            onClick={onToggle}
            className="absolute top-1/2 -translate-y-1/2 -left-5 w-5 h-10 rounded-l-xl z-10 bg-white border border-r-0 flex items-center justify-center text-gray-600 hover:text-primaryThemeColor"
            title="بستن"
          >
            <Icon
              icon="solar:alt-arrow-left-line-duotone"
              width="24"
              height="24"
            />
          </button>
        )}
        <Input
          type="text"
          placeholder="جست و جو سازه"
          variant="bordered"
          labelPlacement="outside"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={
            <Icon
              icon="solar:minimalistic-magnifer-broken"
              width="24"
              height="24"
            />
          }
          classNames={{
            input: "placeholder:font-light placeholder:text-gray-600",
            inputWrapper:
              "border h-12 !text-sm border-gray-300 text-gray-600 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
          }}
        />

        <div className="w-full scrollbar-hide flex items-center gap-2 text-xs overflow-x-scroll min-h-8">
          {filters.map((f, index) => (
            <button
              key={index}
              className={cn(
                "text-gray-700 p-2 px-4 rounded-xl hover:bg-primaryThemeColor hover:text-white transition-all",
                f.value === selectedFilter
                  ? "bg-primaryThemeColor text-white"
                  : ""
              )}
              onClick={() => setSelectedFilter(f.value)}
            >
              {f.name}
            </button>
          ))}
        </div>

        <div className="w-full scroll-bar grid grid-cols-1 lg:grid-cols-3 gap-3 pt-2 overflow-y-auto pl-2">
          {searchedModels.map((model) => (
            <button
              key={model.id}
              ref={(el) => (buttonRefs.current[model.id] = el)}
              onClick={() => clickModelHandler(model.id)}
              className={cn(
                "w-full h-24 border min-h-fit rounded-2xl text-sm text-gray-500 flex flex-col overflow-hidden justify-center items-center gap-3 hover:border-primaryThemeColor transition-all duration-300",
                activeModel === model.id
                  ? "border-2 border-primaryThemeColor"
                  : ""
              )}
            >
              <div className="w-full h-12 rounded-xl">
                <ModelThumbnail
                  path={model.path}
                  className="w-full h-full"
                  color={model.color}
                />
              </div>
              <span className="text-xs font-semibold text-center">
                {toFarsiNumber(model.nameFa)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeModel && (
        <div
          ref={colorRef}
          className="w-48 grid grid-cols-4 items-center gap-6 absolute z-[999] bg-gray-200/50 rounded-2xl py-3 px-4 top-32 right-80"
        >
          <p className="text-sm font-semibold text-gray-700 col-span-4 text-center">
            قطعه{" "}
            {toFarsiNumber(modelList.find((m) => m.id === activeModel)?.nameFa)}
          </p>

          <button
            onClick={() => {
              setCurrentPlacingModel(
                modelList.find((m) => m.id === activeModel)?.path
              );
              setCurrentPlacingModelColor(null); // Set transparent
              setActiveModel(null);
            }}
            className="w-full h-8 flex justify-center items-center text-sm font-light bg-gray-50 col-span-4 rounded-xl hover:bg-gray-100 transition-all duration-300"
          >
            شفاف
          </button>

          <div className="col-span-4 flex items-center justify-between">
            <span className="text-xs text-gray-700">انتخاب رنگ</span>
            <input
              type="color"
              onChange={(e) => {
                setCurrentPlacingModel(
                  modelList.find((m) => m.id === activeModel)?.path
                );
                setCurrentPlacingModelColor(e.target.value);
                setActiveModel(null);
              }}
              className="w-10 h-6 p-0 border-0 bg-transparent cursor-pointer"
              title="Color Picker"
            />
          </div>

          {colors.map((c) => (
            <button
              key={c.hex}
              onClick={() => {
                setCurrentPlacingModel(
                  modelList.find((m) => m.id === activeModel)?.path
                );
                setCurrentPlacingModelColor(c.hex);
                setActiveModel(null);
              }}
              className="flex items-center gap-2 text-sm group text-gray-800 hover:text-primaryThemeColor transition-all duration-300"
            >
              <span
                style={{ backgroundColor: c.hex }}
                className="size-5 rounded-full group-hover:scale-110 transition-all duration-300"
              ></span>
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default Sidebar;
