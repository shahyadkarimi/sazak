"use client";

import { removeSession } from "@/lib/auth";
import { useUserStore } from "@/store/UserInfo";
import { Button, cn, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import { useSettings } from "@/hooks/useSettings";

export const menu = [
  { title: "داشبورد", path: "/user", icon: "solar:home-smile-broken" },
  {
    title: "آموزشگاه",
    path: "#",
    soon: true,
    icon: "solar:square-academic-cap-2-broken",
  },
  {
    title: "پروژه های من",
    path: "/user/project/my-projects",
    icon: "solar:ruler-cross-pen-broken",
  },
];

const Sidebar = () => {
  const { user, setUser } = useUserStore();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { settings } = useSettings();

  const logoutHandler = () => {
    setLoading(true);
    router.push("/auth");
    localStorage.removeItem("token");
    removeSession();

    setTimeout(() => {
      setUser({});
    }, 1000);
  };

  return (
    <div className="min-w-64 min-h-full flex flex-col justify-between bg-white dark:bg-gray-900 py-6 px-5 max-h-screen overflow-y-auto">
      <div className="flex flex-col gap-4">
        {/* logo */}
        <div className="flex items-center gap-2 pb-4 border-b dark:border-gray-800">
          <Image
            src={settings.logo || "/assets/logo.png"}
            width={150}
            height={150}
            className="size-12 rounded-full"
            alt={settings.siteName || "site logo"}
          />

          <div className="flex flex-col">
            <p className="text-xs text-gray-700 dark:text-gray-300">
              {settings.siteDescription || "آموزشگاه رباتیک"}
            </p>
            <h2 className="font-extrabold text-primaryThemeColor">
              {settings.siteName || "سازک"}
            </h2>
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
                  "flex items-center gap-2 text-gray-700 dark:text-gray-200 rounded-2xl h-12 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-primaryThemeColor px-4 transition-all duration-300",
                  isActive &&
                    "bg-primaryThemeColor/5 dark:bg-primaryThemeColor/10 hover:bg-primaryThemeColor/5 dark:hover:bg-primaryThemeColor/10 text-primaryThemeColor dark:text-primaryThemeColor font-bold"
                )}
              >
                <Icon icon={item.icon} width="20" hanging="20" />
                <span>{item.title}</span>
              </Link>
            );
          })}

          <button
            onClick={logoutHandler}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-200 rounded-2xl h-12 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-danger px-4 transition-all duration-300"
          >
            {loading ? (
              <Spinner size="sm" color="danger" />
            ) : (
              <Icon icon="solar:logout-3-linear" width="20" height="24" />
            )}
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* user profile */}
      <div className="w-full flex justify-between items-center">
        {/* user info */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="flex h-2 w-2 absolute bottom-0 right-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative bg-success inline-flex rounded-full h-2 w-2"></span>
            </div>

            <Image
              src={user.profilePicture || "/assets/avatar.png"}
              width={100}
              height={100}
              className="size-10 rounded-full border-2 dark:border-gray-700 shadow-lg shadow-gray-100 dark:shadow-gray-900"
              alt="user avatar"
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-gray-600 dark:text-gray-300 font-bold">
              {user.fullName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{user.role === "user" ? "دانشجو" : "ادمین"}</span>
          </div>
        </div>

        {/* edit profile */}
        <Button
          as={Link}
          href="/user/profile"
          isIconOnly
          className="bg-white dark:bg-gray-800 size-9 min-w-9 border dark:border-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center rounded-2xl hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-all duration-300"
        >
          <Icon icon="solar:pen-2-broken" width="18" height="18" />
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
