import { Icon } from "@iconify/react";

import React from "react";

const Header = () => {
  return (
    <header className="z-10 flex w-full h-16 justify-between items-center gap-4 border-b bg-white px-4 lg:p-6">
      <button
        // onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 w-7 -ml-1 md:hidden bg-transparent hover:bg-gray-100"
        aria-label="Toggle Sidebar"
      >
        <Icon icon="solar:window-frame-line-duotone" width="16" height="16" />{" "}
      </button>

      <h2 className="text-2xl font-bold text-gray-700">داشبورد</h2>

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
          <span className="font-medium text-sm font-semibold text-gray-700">شهیاد کریمی</span>
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
