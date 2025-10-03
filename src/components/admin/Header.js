"use client";

import { Icon } from "@iconify/react";
import { useUserStore } from "@/store/UserInfo";
import Link from "next/link";

import React from "react";

const Header = () => {
  const { user } = useUserStore();
  return (
    <header className="z-10 flex w-full h-16 justify-between items-center gap-4 border-b bg-white px-4 lg:p-6">
      <button
        // onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 w-7 -ml-1 md:hidden bg-transparent hover:bg-gray-100"
        aria-label="Toggle Sidebar"
      >
        <Icon icon="solar:window-frame-line-duotone" width="16" height="16" />{" "}
      </button>

      <Link
        href="/user"
        className="w-fit px-4 text-xs h-10 bg-primaryThemeColor/15 text-primaryThemeColor rounded-2xl flex items-center gap-1 transition-all"
      >
        <Icon icon="solar:user-circle-line-duotone" width="18" height="18" />
        بازگشت به پنل کاربری
      </Link>

      <div className="flex items-center gap-4">
        <button
          className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-800 transition-all"
          aria-label="Notifications"
        >
          <Icon icon="solar:bell-line-duotone" width="20" height="20" />
        </button>

        <div className="flex items-center gap-2 border-r pr-6">
          <img
            src="/assets/avatar.png"
            alt="آواتار کاربر"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="text-sm font-semibold text-gray-700">
            {user.fullName}
          </span>
          <Icon
            icon="solar:alt-arrow-down-line-duotone"
            width="16"
            height="16"
          />
        </div>

        {/* <button className="w-fit px-4 h-10 bg-black text-white rounded-2xl  flex items-center gap-2">
          بازگشت به سایت
        </button> */}
      </div>
    </header>
  );
};

export default Header;
