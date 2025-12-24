"use client";

import { greetByTime, toFarsiNumber } from "@/helper/helper";
import { clearImpersonation } from "@/lib/auth";
import { getData } from "@/services/API";
import { useUserStore } from "@/store/UserInfo";
import { useTheme } from "@/lib/ThemeProvider";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

const Header = ({ onOpenSidebar }) => {
  const { user, setUser } = useUserStore();
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();

  const isImpersonating =
    typeof window !== "undefined" &&
    (localStorage.getItem("isImpersonating") === "true" ||
      (document?.cookie || "").includes("impersonated=true"));

  const exitImpersonation = async () => {
    try {
      localStorage.removeItem("impersonation_token");

      clearImpersonation();

      getData("/user/profile").then((res) => {
        setUser(res.data.user);
        router.push("/admin");
      });

    } catch (error) {
      console.error("Failed to exit impersonation:", error);
    }
  };

  return (
    <div className="w-full h-20 bg-white dark:bg-gray-900 flex items-center justify-between px-3 sm:px-4 lg:px-8">
      {/* greeting */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* mobile menu button */}
        <Button
          onPress={onOpenSidebar}
          isIconOnly
          className="lg:hidden bg-white dark:bg-gray-800 size-11 border dark:border-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center rounded-2xl hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-all duration-300"
        >
          <Icon icon="solar:hamburger-menu-broken" width="24" height="24" />
        </Button>

        <div className="flex flex-col gap-0.5">
          <span className="text-base sm:text-xl font-bold text-gray-700 dark:text-gray-200">
            سلام؛ {user.fullName}
          </span>
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
            {greetByTime()}
          </span>
        </div>
      </div>

      {/* buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark mode toggle button */}
        {mounted && (
          <Button
            onPress={toggleTheme}
            isIconOnly
            className="bg-white dark:bg-gray-800 size-11 border dark:border-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center rounded-2xl hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-all duration-300"
            aria-label="Toggle dark mode"
          >
            <Icon
              icon={
                theme === "dark"
                  ? "solar:sun-bold"
                  : "solar:moon-stars-bold"
              }
              width="24"
              height="24"
            />
          </Button>
        )}

        <div className="relative">
          <span className="size-5 text-white rounded-full flex items-center justify-center text-xs pl-0.5 pt-0.5 bg-red-600 absolute -top-1.5 -right-1.5 z-50">
            {toFarsiNumber(0)}
          </span>

          <Button
            isIconOnly
            className="bg-white dark:bg-gray-800 size-11 border dark:border-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center rounded-2xl hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-all duration-300"
          >
            <Icon icon="solar:bell-broken" width="24" height="24" />
          </Button>
        </div>

        <Button
          isIconOnly
          as={Link}
          href="/user"
          className="bg-white dark:bg-gray-800 size-11 border dark:border-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center rounded-2xl hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-all duration-300"
        >
          <Icon icon="solar:user-rounded-broken" width="24" height="24" />
        </Button>

        {isImpersonating ? (
          <Button
            onPress={exitImpersonation}
            className="bg-danger text-white h-11 px-4 rounded-2xl hover:opacity-90 transition-all duration-300"
          >
            <Icon icon="solar:logout-3-bold" width="22" height="22" />
            <span className="text-xs sm:text-sm">خروج از حالت ورود</span>
          </Button>
        ) : (
          user.role === "admin" && (
            <Button
              as={Link}
              href="/admin"
              className="bg-white dark:bg-gray-800 h-11 border dark:border-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center rounded-2xl hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-all duration-300"
            >
              <Icon icon="solar:laptop-2-broken" width="24" height="24" />
              <span className="text-xs">پنل مدیریت </span>
            </Button>
          )
        )}
      </div>
    </div>
  );
};

export default Header;
