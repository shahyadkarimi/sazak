"use client";

import { Icon } from "@iconify/react";
import { useUserStore } from "@/store/UserInfo";
import { useTheme } from "@/lib/ThemeProvider";
import { Button } from "@heroui/react";
import Link from "next/link";

import React from "react";

const Header = ({ onMenuClick }) => {
  const { user } = useUserStore();
  const { theme, toggleTheme, mounted } = useTheme();
  return (
    <header className="z-10 flex w-full h-16 justify-between items-center gap-4 border-b dark:border-gray-800 bg-white dark:bg-gray-900 px-4 lg:p-6">
      <button
        onClick={onMenuClick}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 size-10 -ml-1 lg:hidden bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200"
        aria-label="Toggle Sidebar"
      >
        <Icon icon="solar:hamburger-menu-line-duotone" width="24" height="24" />
      </button>

      <div className="hidden lg:block"></div>

      <div className="flex items-center gap-4">
        {/* Dark mode toggle button */}
        {mounted && (
          <Button
            onPress={toggleTheme}
            isIconOnly
            className="bg-white dark:bg-gray-800 size-10 border dark:border-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center rounded-full hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-all duration-300"
            aria-label="Toggle dark mode"
          >
            <Icon
              icon={
                theme === "dark"
                  ? "solar:sun-bold"
                  : "solar:moon-stars-bold"
              }
              width="20"
              height="20"
            />
          </Button>
        )}

        <button
          className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-all"
          aria-label="Notifications"
        >
          <Icon icon="solar:bell-line-duotone" width="20" height="20" />
        </button>

        <div className="flex items-center gap-2 border-r dark:border-gray-700 pr-6">
          <img
            src={user.profilePicture || "/assets/avatar.png"}
            alt="آواتار کاربر"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {user.fullName}
          </span>
          <Icon
            icon="solar:alt-arrow-down-line-duotone"
            width="16"
            height="16"
            className="text-gray-700 dark:text-gray-200"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
