"use client";

import { cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export const menu = [
  { title: "داشبورد", path: "/panel", icon: "solar:home-smile-broken" },
  {
    title: "دوره های من",
    path: "/my-courses",
    icon: "solar:square-academic-cap-2-broken",
  },
  {
    title: "پروژه های من",
    path: "/my-projects",
    icon: "solar:ruler-cross-pen-broken",
  },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="min-w-64 h-full flex flex-col justify-between bg-white py-6 px-5">
      <div className="flex flex-col gap-4">
        {/* logo */}
        <div className="flex items-center gap-2 pb-4 border-b">
          <Image
            src={"/assets/logo.png"}
            width={150}
            height={150}
            className="size-12 rounded-full"
            alt="sazak logo"
          />

          <div className="flex flex-col">
            <p className="text-xs text-gray-700">آموزشگاه رباتیک</p>
            <h2 className="font-extrabold text-primaryThemeColor">سازک</h2>
          </div>
        </div>

        {/* menu */}
        <div className="flex flex-col gap-2">
          {menu.map((item, index) => {
            const isActive = item.path === pathname;
            return (
              <Link
                key={index}
                href={item.path}
                className={cn(
                  "flex items-center gap-2 text-gray-700 rounded-2xl h-12 hover:bg-gray-100/70 hover:text-primaryThemeColor px-4 transition-all duration-300",
                  isActive &&
                    "bg-primaryThemeColor/5 hover:bg-primaryThemeColor/5 text-primaryThemeColor font-bold"
                )}
              >
                <Icon icon={item.icon} width="20" hanging="20" />
                <span>{item.title}</span>
              </Link>
            );
          })}

          <button className="flex items-center gap-2 text-gray-700 rounded-2xl h-12 hover:bg-gray-100/70 hover:text-red-600 px-4 transition-all duration-300">
            <Icon icon="solar:logout-3-linear" width="20" height="24" />
            <span>خروج</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
