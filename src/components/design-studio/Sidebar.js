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
  { name: "اتصالی", value: "connector" },
  { name: "تخت", value: "plate" },
  { name: "پیچ ها", value: "screw" },
];

const Sidebar = () => {
  const setCurrentPlacingModel = useModelStore(
    (state) => state.setCurrentPlacingModel
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
      nameFa: "سه راهی",
      type: "connector",
    },
    {
      id: 2,
      path: "/models/I_Piece_2_hole_1_track_hole_Onde_Sided_Plate _12cm.glb",
      nameEn: "Straight Plate 12cm",
      nameFa: "تخت ۱۲ تایی",
      type: "plate",
    },
    {
      id: 3,
      path: "/models/I_Piece_2_hole_1_track_hole_One_Sided_Plate_8cm.glb",
      nameEn: "Straight Plate 8cm",
      nameFa: "تخت ۸ تایی",
      type: "plate",
    },
    {
      id: 4,
      path: "/models/I_Piece_2_hole_1side_hole.glb",
      nameEn: "Straight Bar",
      nameFa: "آی 2",
      type: "bar",
    },
    {
      id: 5,
      path: "/models/I_Piece_3_hole__2_side_hole.glb",
      nameEn: "Straight Bar (3H)",
      nameFa: "آی 3",
      type: "bar",
    },
    {
      id: 6,
      path: "/models/I_Piece_4_hole__3_side_hole.glb",
      nameEn: "Straight Bar (4H)",
      nameFa: "آی 4",
      type: "bar",
    },
    {
      id: 7,
      path: "/models/I_Piece_4_hole_4_side_hole.glb",
      nameEn: "Straight Bar (4H Side)",
      nameFa: "آی 4 کناری",
      type: "bar",
    },
    {
      id: 8,
      path: "/models/I_Piece_6_hole_I_Piece_With_1_Track.glb",
      nameEn: "Track Bar",
      nameFa: "میله ریل دار",
      type: "bar",
    },
    {
      id: 9,
      path: "/models/I_piece_10_hole_One_Sided_Plate.glb",
      nameEn: "Long Plate",
      nameFa: "صفحه بلند",
      type: "plate",
    },
    {
      id: 10,
      path: "/models/L_Piece_3_hole_1_side_hole.glb",
      nameEn: "L-Angle Small",
      nameFa: "نبشی کوچک",
      type: "L",
    },
    {
      id: 11,
      path: "/models/L_Piece_3_hole_2_track_hole_One_Sided_Plate.glb",
      nameEn: "L-Angle with Track",
      nameFa: "نبشی ریل دار",
      type: "L",
    },
    {
      id: 12,
      path: "/models/L_Piece_4_hole_1_side_hole.glb",
      nameEn: "L-Angle Medium",
      nameFa: "نبشی متوسط",
      type: "L",
    },
    {
      id: 13,
      path: "/models/L_Piece_5_hole_2_side_hole).glb",
      nameEn: "L-Angle Large",
      nameFa: "نبشی بزرگ",
      type: "L",
    },
    {
      id: 14,
      path: "/models/L_Piece_5_hole_4_side_hole.glb",
      nameEn: "L-Angle Extra",
      nameFa: "نبشی تقویتی",
      type: "L",
    },
    {
      id: 15,
      path: "/models/L_Piece_5_hole_One_sided_Plate.glb",
      nameEn: "L-Plate",
      nameFa: "صفحه L",
      type: "L",
    },
    {
      id: 16,
      path: "/models/U_Piece_7_hole_4_side_hole.glb",
      nameEn: "U-Channel",
      nameFa: "یو چنل",
      type: "U",
    },
  ];

  const groupedModels = {
    all: modelList,
    connector: modelList.filter((m) => ["connector", "L", "U"].includes(m.type)),
    plate: modelList.filter((m) => m.type === "plate"),
    screw: modelList.filter((m) => m.type === "bar"),
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
    }
  };

  const filteredModels = groupedModels[selectedFilter];

  const searchedModels = filteredModels.filter((item) =>
    item.nameFa.includes(search)
  );

  

  return (
    <>
      <div className="min-w-80 max-w-80 flex flex-col gap-4 h-full bg-white p-4 overflow-y-auto">
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

        <div className="w-full scroll-bar flex flex-col gap-3 overflow-y-auto pl-2">
          {searchedModels.map((model) => (
            <button
              key={model.id}
              ref={(el) => (buttonRefs.current[model.id] = el)}
              onClick={() => clickModelHandler(model.id)}
              className="w-full p-2 border font-light rounded-2xl text-sm text-gray-700 flex items-center gap-3 hover:border-primaryThemeColor transition-all duration-300"
            >
              <div className="size-20 rounded-xl overflow-hidden">
                <ModelThumbnail path={model.path} className="w-full h-full" />
              </div>
              <span className="text-center">{toFarsiNumber(model.nameFa)}</span>
            </button>
          ))}
        </div>
      </div>

      {activeModel && (
        <div
          ref={colorRef}
          className="w-auto grid grid-cols-4 items-center gap-6 absolute z-50 bg-gray-200/50 rounded-2xl py-3 px-4"
          style={{
            top: colorBoxPos.top,
            transform: "translateY(-100%)",
            right: 290,
          }}
        >
          <button className="w-full h-8 flex justify-center items-center text-sm font-light bg-gray-50 col-span-4 rounded-xl">
            شفاف
          </button>

          {colors.map((c) => (
            <button
              key={c.hex}
              onClick={() => {
                setCurrentPlacingModel(
                  modelList.find((m) => m.id === activeModel)?.path
                );
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
