"use client";

import { toFarsiNumber } from "@/helper/helper";
import useModelStore from "@/store/useModelStore";
import { button, cn, Input, MenuItem, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { getFavoriteModels, toggleFavoriteModel } from "@/utils/favoriteModels";

const ModelThumbnail = dynamic(() => import("./ModelThumbnail"), {
  ssr: false,
});

const Sidebar = ({ onToggle }) => {
  const setCurrentPlacingModel = useModelStore(
    (state) => state.setCurrentPlacingModel
  );
  const setCurrentPlacingModelColor = useModelStore(
    (state) => state.setCurrentPlacingModelColor
  );
  const setCurrentPlacingModelNoColor = useModelStore(
    (state) => state.setCurrentPlacingModelNoColor
  );
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modelList, setModelList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState([{ name: "همه", value: "all" }]);
  const [loading, setLoading] = useState(true);
  const [favoriteModels, setFavoriteModels] = useState([]);

  useEffect(() => {
    loadParts();
    // Load favorite models from localStorage
    setFavoriteModels(getFavoriteModels());
  }, []);

  // Listen for changes in localStorage (for cross-tab sync and same-tab updates)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "favoriteModels") {
        setFavoriteModels(getFavoriteModels());
      }
    };
    const handleFavoriteChange = () => {
      setFavoriteModels(getFavoriteModels());
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("favoriteModelsChanged", handleFavoriteChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("favoriteModelsChanged", handleFavoriteChange);
    };
  }, []);

  const loadParts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/parts");
      const data = await res.json();

      if (data.success) {
        const partsWithDefaults = data.parts.map((part, index) => ({
          id: part.id,
          path: part.path,
          thumbnailPath: part.thumbnailPath,
          name: part.name,
          nameFa: part.name,
          category: part.category,
          noColor: part.noColor || false,
          color: getDefaultColor(index),
        }));

        setModelList(partsWithDefaults);

        if (data.categories && data.categories.length > 0) {
          const categoryFilters = [
            { name: "همه", value: "all" },
            { name: "منتخب", value: "favorite" },
            ...data.categories.reverse().map((cat) => ({
              name: cat.name,
              value: cat.id,
            })),
          ];
          setFilters(categoryFilters);
          setCategories(data.categories);
        } else {
          // If no categories, still add favorite filter
          setFilters([
            { name: "همه", value: "all" },
            { name: "منتخب", value: "favorite" },
          ]);
        }
      }
    } catch (error) {
      console.error("Error loading parts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultColor = (index) => {
    const colors = [
      "#ef4444",
      "#3b82f6",
      "#22c55e",
      "#eab308",
      "#f97316",
      "#a855f7",
      "#10b981",
      "#0ea5e9",
      "#6366f1",
      "#f43f5e",
      "#22d3ee",
      "#84cc16",
      "#fb7185",
      "#f59e0b",
      "#64748b",
      "#14b8a6",
      "#374151",
    ];
    return colors[index % colors.length];
  };

  // const modelList = [
  //   {
  //     id: 1,
  //     path: "/models/3_ways_Piece.glb",
  //     nameEn: "3-Way Connector",
  //     nameFa: "L4",
  //     type: "connector",
  //     color: "#ef4444",
  //   },
  //   {
  //     id: 2,
  //     path: "/models/I_Piece_2_hole_1_track_hole_Onde_Sided_Plate _12cm.glb",
  //     nameEn: "Straight Plate 12cm",
  //     nameFa: "شیاری بلند",
  //     type: "plate",
  //     color: "#3b82f6",
  //   },
  //   {
  //     id: 3,
  //     path: "/models/I_Piece_2_hole_1_track_hole_One_Sided_Plate_8cm.glb",
  //     nameEn: "Straight Plate 8cm",
  //     nameFa: "شیاری کوتاه",
  //     type: "plate",
  //     color: "#22c55e",
  //   },
  //   {
  //     id: 4,
  //     path: "/models/I_Piece_2_hole_1side_hole.glb",
  //     nameEn: "Straight Bar",
  //     nameFa: "I2",
  //     type: "connector",
  //     color: "#eab308",
  //   },
  //   {
  //     id: 5,
  //     path: "/models/I_Piece_3_hole__2_side_hole.glb",
  //     nameEn: "Straight Bar (3H)",
  //     nameFa: "I3",
  //     type: "connector",
  //     color: "#f97316",
  //   },
  //   {
  //     id: 6,
  //     path: "/models/I_Piece_4_hole__3_side_hole.glb",
  //     nameEn: "Straight Bar (4H)",
  //     nameFa: "I4",
  //     type: "connector",
  //     color: "#a855f7",
  //   },
  //   {
  //     id: 7,
  //     path: "/models/I_Piece_4_hole_4_side_hole.glb",
  //     nameEn: "Straight Bar (4H Side)",
  //     nameFa: "I4",
  //     type: "connector",
  //     color: "#10b981",
  //   },
  //   {
  //     id: 8,
  //     path: "/models/I_Piece_6_hole_I_Piece_With_1_Track.glb",
  //     nameEn: "Track Bar",
  //     nameFa: "S7",
  //     type: "plate",
  //     color: "#0ea5e9",
  //   },
  //   {
  //     id: 9,
  //     path: "/models/I_piece_10_hole_One_Sided_Plate.glb",
  //     nameEn: "Long Plate",
  //     nameFa: "S10",
  //     type: "plate",
  //     color: "#6366f1",
  //   },
  //   {
  //     id: 10,
  //     path: "/models/I_piece_12_hole_One_Sided_Plate.glb",
  //     nameEn: "Long Plate",
  //     nameFa: "S12",
  //     type: "plate",
  //     color: "#6366f1",
  //   },
  //   {
  //     id: 11,
  //     path: "/models/I_piece_16_hole_One_Sided_Plate.glb",
  //     nameEn: "Long Plate",
  //     nameFa: "S16",
  //     type: "plate",
  //     color: "#6366f1",
  //   },
  //   {
  //     id: 12,
  //     path: "/models/L_Piece_3_hole_1_side_hole.glb",
  //     nameEn: "L-Angle Small",
  //     nameFa: "L3",
  //     type: "connector",
  //     color: "#f43f5e",
  //   },
  //   {
  //     id: 13,
  //     path: "/models/L_Piece_3_hole_2_track_hole_One_Sided_Plate.glb",
  //     nameEn: "L-Angle with Track",
  //     nameFa: "L7T",
  //     type: "L",
  //     color: "#22d3ee",
  //   },
  //   {
  //     id: 14,
  //     path: "/models/L_Piece_4_hole_1_side_hole.glb",
  //     nameEn: "L-Angle Medium",
  //     nameFa: "L4",
  //     type: "connector",
  //     color: "#84cc16",
  //   },
  //   {
  //     id: 15,
  //     path: "/models/L_Piece_5_hole_2_side_hole.glb",
  //     nameEn: "L-Angle Large",
  //     nameFa: "L5",
  //     type: "connector",
  //     color: "#fb7185",
  //   },
  //   {
  //     id: 16,
  //     path: "/models/L_Piece_5_hole_4_side_hole.glb",
  //     nameEn: "L-Angle Extra",
  //     nameFa: "L5 تداخلی",
  //     type: "connector",
  //     color: "#f59e0b",
  //   },
  //   {
  //     id: 17,
  //     path: "/models/L_Piece_5_hole_One_sided_Plate.glb",
  //     nameEn: "L-Plate",
  //     nameFa: "L5T",
  //     type: "connector",
  //     color: "#64748b",
  //   },
  //   {
  //     id: 18,
  //     path: "/models/U_Piece_7_hole_4_side_hole.glb",
  //     nameEn: "U-Channel",
  //     nameFa: "U",
  //     type: "connector",
  //     color: "#14b8a6",
  //   },
  //     {
  //       id: 19,
  //       path: "/models/Screw_1cm.glb",
  //       nameEn: "Screw 1cm",
  //       nameFa: "پیچ 1cm",
  //       type: "screw",
  //       color: "#374151",
  //     },
  //     {
  //       id: 20,
  //       path: "/models/Screw_2cm.glb",
  //       nameEn: "Screw 2cm",
  //       nameFa: "پیچ 2cm",
  //       type: "screw",
  //       color: "#374151",
  //     },
  //     {
  //       id: 21,
  //       path: "/models/Screw_3cm.glb",
  //       nameEn: "Screw 3cm",
  //       nameFa: "پیچ 3cm",
  //       type: "screw",
  //       color: "#374151",
  //     },
  //     {
  //       id: 22,
  //       path: "/models/Screw_4cm.glb",
  //       nameEn: "Screw 4cm",
  //       nameFa: "پیچ 4cm",
  //       type: "screw",
  //       color: "#374151",
  //     },
  //     {
  //       id: 23,
  //       path: "/models/Screw_5cm.glb",
  //       nameEn: "Screw 5cm",
  //       nameFa: "پیچ 5cm",
  //       type: "screw",
  //       color: "#374151",
  //     },
  //     {
  //       id: 24,
  //       path: "/models/Screw_6cm.glb",
  //       nameEn: "Screw 6cm",
  //       nameFa: "پیچ 6cm",
  //       type: "screw",
  //       color: "#374151",
  //     },
  //     {
  //       id: 25,
  //       path: "/models/Screw_8cm.glb",
  //       nameEn: "Screw 8cm",
  //       nameFa: "پیچ 8cm",
  //       type: "screw",
  //       color: "#374151",
  //     },
  //     {
  //       id: 26,
  //       path: "/models/Screw_10cm.glb",
  //       nameEn: "Screw 10cm",
  //       nameFa: "پیچ 10cm",
  //       type: "screw",
  //       color: "#374151",
  //     },
  // ];

  // const groupedModels = {
  //   all: modelList,
  //   connector: modelList.filter((m) =>
  //     ["connector", "L", "U"].includes(m.type)
  //   ),
  //   plate: modelList.filter((m) => m.type === "plate"),
  //   screw: modelList.filter((m) => m.type === "screw"),
  // };

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

  const getRandomColor = () => {
    const colors = [
      "#ef4444",
      "#3b82f6",
      "#22c55e",
      "#eab308",
      "#f97316",
      "#a855f7",
      "#10b981",
      "#0ea5e9",
      "#6366f1",
      "#f43f5e",
      "#22d3ee",
      "#84cc16",
      "#fb7185",
      "#f59e0b",
      "#64748b",
      "#14b8a6",
      "#374151",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const clickModelHandler = (modelId) => {
    const model = modelList.find((m) => m.id === modelId);
    
    if (model?.noColor) {
      setCurrentPlacingModel(model?.path);
      setCurrentPlacingModelColor(null);
      setCurrentPlacingModelNoColor(true);
      return;
    }

    setCurrentPlacingModelNoColor(false);

    const randomColor = getRandomColor();
    setCurrentPlacingModel(model?.path);
    setCurrentPlacingModelColor(randomColor);
  };

  const filteredModels =
    selectedFilter === "all"
      ? modelList
      : selectedFilter === "favorite"
      ? modelList.filter((item) => favoriteModels.includes(item.id))
      : modelList.filter((item) => item.category?.id === selectedFilter);

  const searchedModels = filteredModels.filter(
    (item) => item.nameFa?.includes(search) || item.name?.includes(search)
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
              icon="solar:alt-arrow-right-line-duotone"
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
          {loading ? (
            <div className="col-span-3 flex items-center justify-center py-8">
              <Spinner
                size="lg"
                classNames={{
                  circle1: "border-b-primaryThemeColor",
                  circle2: "border-b-primaryThemeColor",
                }}
              />
            </div>
          ) : searchedModels.length === 0 ? (
            <div className="col-span-3 flex items-center justify-center py-8 text-gray-500">
              قطعه‌ای یافت نشد
            </div>
          ) : (
            searchedModels.map((model) => {
              const isFavorite = favoriteModels.includes(model.id);
              return (
                <div key={model.id} className="relative w-full group">
                  <button
                    onClick={() => clickModelHandler(model.id)}
                    className="w-full h-24 border min-h-fit rounded-2xl text-sm text-gray-500 flex flex-col overflow-hidden justify-center items-center gap-3 hover:border-primaryThemeColor transition-all duration-300"
                  >
                    <div className="w-full h-12 rounded-xl overflow-hidden">
                      <Image
                        src={model.thumbnailPath}
                        alt={model.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="text-xs font-semibold text-center">
                      {toFarsiNumber(model.nameFa || model.name)}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteModel(model.id);
                    }}
                    className={cn(
                      "absolute top-2 right-2 z-10 p-1 rounded-full transition-all duration-200 hover:scale-110",
                      isFavorite
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    )}
                    title={isFavorite ? "حذف از منتخب" : "اضافه به منتخب"}
                  >
                    <Icon
                      icon={
                        isFavorite
                          ? "solar:star-bold"
                          : "solar:star-line-duotone"
                      }
                      width={14}
                      height={14}
                      className={cn(
                        "transition-colors duration-200",
                        isFavorite
                          ? "text-yellow-500"
                          : "text-gray-400 hover:text-yellow-500"
                      )}
                    />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

    </>
  );
};

export default Sidebar;
