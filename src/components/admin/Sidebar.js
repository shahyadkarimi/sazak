"use client";

import { usePathname } from "next/navigation";
import { toFarsiNumber } from "../../helper/helper";
import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";
import Image from "next/image";
import { useSettings } from "@/hooks/useSettings";

const navItems = [
  {
    title: "داشبورد",
    path: "/admin",
    icon: "solar:widget-5-line-duotone",
  },
  {
    title: "کاربران",
    path: "/admin/users",
    icon: "solar:users-group-two-rounded-line-duotone",
  },
  {
    title: "پروژه‌ها",
    path: "/admin/projects",
    icon: "solar:folder-with-files-line-duotone",
  },
  {
    title: "قطعات",
    path: "#",
    icon: "solar:layers-line-duotone",
    subMenu: [
      {
        title: "همه قطعات",
        path: "/admin/parts",
      },
      {
        title: "دسته بندی ها",
        path: "/admin/parts/categories",
      },
    ],
  },
  {
    title: "فعالیت‌های اخیر",
    path: "/admin/logs",
    icon: "solar:history-line-duotone",
  },
  {
    title: "تنظیمات",
    path: "/admin/settings",
    icon: "solar:settings-line-duotone",
  },
];

const helpItems = [
  {
    title: "تنظیمات",
    path: "#",
    icon: "solar:settings-line-duotone",
  },
  {
    title: "راهنما و پشتیبانی",
    path: "#",
    icon: "solar:help-line-duotone",
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const [openMenu, setOpenMenu] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState({});
  const { settings } = useSettings();

  const pathname = usePathname();

  React.useEffect(() => {
    const activeMenu = navItems.find((item) => {
      if (item.subMenu) {
        return item.subMenu.some(
          (sub) => pathname === sub.path || pathname.startsWith(sub.path + "/")
        );
      }
      return pathname === item.path;
    });

    if (activeMenu && activeMenu.subMenu) {
      setSelectedMenu(activeMenu);
      setOpenMenu(true);
    }
  }, [pathname]);

  const openMenuHandler = (e, menu) => {
    if (menu.subMenu) {
      if (menu.title === selectedMenu.title) {
        setOpenMenu((prev) => !prev);
      } else {
        setOpenMenu(true);
      }
    }
    setSelectedMenu(menu);
  };

  return (
    <div
      className={`w-64 lg:w-64 flex min-h-screen flex-col border-r dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-200 ease-in-out`}
    >
      <div className="flex h-16 items-center justify-center border-b dark:border-gray-800 px-4">
        <Link href={"/admin"} className="flex items-center gap-4">
          <Image
            src={settings.logo || "/assets/logo.png"}
            width={150}
            height={150}
            className="size-8 rounded-full scale-150"
            alt={settings.siteName || "site logo"}
          />

          <div className="flex flex-col">
            <h2 className="font-black text-primaryThemeColor">{settings.siteName || "سازک"}</h2>
            <p className="text-xs text-gray-700 dark:text-gray-300">پنل مدیریت</p>
          </div>
        </Link>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <div className="mt-2 px-2">
          <div className="relative">
            <input
              type="text"
              placeholder="جستجو در هر چیزی"
              className="flex h-8 w-full rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none px-3 py-2 placeholder:text-xs text-sm pl-8"
            />
            <Icon
              icon="solar:magnifer-line-duotone"
              className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              width="20"
              height="20"
            />
          </div>
        </div>

        <div className="relative flex w-full min-w-0 flex-col p-2">
          <div className="flex h-8 shrink-0 items-center rounded-xl px-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            منوی اصلی
          </div>

          <ul className="flex w-full min-w-0 flex-col gap-1">
            {navItems.map((item, index) => (
              <li key={index} className="group/menu-item relative">
                <Link
                  onClick={(e) => openMenuHandler(e, item)}
                  href={item.path ? item.path : "javascript:void(0)"}
                  className={`flex w-full items-center justify-between gap-2 overflow-hidden rounded-xl p-2 text-left text-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 ${
                    pathname === item.path
                      ? "bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-gray-100"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon icon={item.icon} width="20" height="20" />

                    <span className="truncate">
                      {item.title}
                    </span>
                  </div>

                  {item.subMenu && (
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      width="16"
                      height="16"
                      className={`size-4 ${
                        openMenu && selectedMenu.title === item.title
                          ? "-rotate-180"
                          : ""
                      } transition-all duration-300`}
                    />
                  )}

                  {item.badge && (
                    <span className="ml-auto inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 p-0 text-xs font-medium text-gray-700 dark:text-gray-200">
                      {toFarsiNumber(item.badge)}
                    </span>
                  )}
                </Link>

                {item.subMenu && (
                  <div
                    className={`w-full ${
                      selectedMenu.title === item.title && openMenu
                        ? "max-h-96 mt-1"
                        : "max-h-0"
                    } overflow-hidden flex flex-col gap-1 transition-all duration-300`}
                  >
                    {item.subMenu.map((subMenu, index) => {
                      const isActive =
                        subMenu.path === pathname ||
                        pathname.startsWith(subMenu.path + "/");
                      return (
                        <Link
                          href={subMenu.path}
                          key={index}
                          className={cn(
                            "text-[13px] flex items-center text-gray-600 dark:text-gray-400 gap-4 py-2 pr-4 rounded-xl group hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-300",
                            isActive && "font-semibold text-gray-700 dark:text-gray-200"
                          )}
                        >
                          <div className="size-[6px] group-hover:bg-gray-700 dark:group-hover:bg-gray-500 rounded-full bg-gray-600 dark:bg-gray-500 transition-all duration-300"></div>
                          <span className="text-sm">{subMenu.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* <div className="relative flex w-full flex-col p-2 mt-4">
          <div
            className={`flex h-8 shrink-0 items-center rounded-xl px-2 text-xs font-medium text-gray-500 ${
              isSidebarOpen ? "" : "hidden"
            }`}
          >
            سایر
          </div>

          <ul className="flex w-full flex-col gap-1">
            {helpItems.map((item) => (
              <li key={item.title} className="group/menu-item relative">
                <Link
                  href={item.path}
                  className={`flex w-full items-center gap-2 overflow-hidden rounded-xl p-2 text-left text-sm transition-all hover:bg-gray-100 hover:text-gray-900 text-gray-700 ${
                    isSidebarOpen ? "" : "!size-8 !p-2 justify-center"
                  }`}
                >
                  <Icon icon={item.icon} width="20" height="20" />

                  <span className={`truncate ${isSidebarOpen ? "" : "hidden"}`}>
                    {item.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div> */}
      </div>

      <div className="flex flex-col gap-1 p-2">
        <div className="group/menu-item relative">
          <Link
            href="/user"
            className="flex w-full items-center gap-2 overflow-hidden rounded-xl p-2 text-left text-sm transition-all hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor text-gray-700 dark:text-gray-300"
          >
            <Icon icon="solar:user-circle-line-duotone" width="20" height="20" />
            <span className="truncate">
              بازگشت به پنل کاربری
            </span>
          </Link>
        </div>

        <div className="group/menu-item relative">
          <Link
            href={"/user/profile"}
            className="flex w-full items-center gap-2 overflow-hidden rounded-xl p-2 text-left text-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 text-gray-700 dark:text-gray-300"
          >
            <Icon icon="solar:user-line-duotone" width="20" height="20" />
            <span className="truncate">
              پروفایل
            </span>
          </Link>
        </div>

        <div className="group/menu-item relative">
          <button
            className="flex w-full items-center gap-2 overflow-hidden rounded-xl p-2 text-left text-sm transition-all hover:bg-red-600/15 dark:hover:bg-red-600/20 hover:text-red-600 text-gray-700 dark:text-gray-300"
          >
            <Icon icon="solar:logout-3-line-duotone" width="20" height="20" />
            <span className="truncate">
              خروج
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
