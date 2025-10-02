"use client";

import { greetByTime, toFarsiNumber } from "@/helper/helper";
import { useUserStore } from "@/store/UserInfo";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import React from "react";

const Header = ({ onOpenSidebar }) => {
  const { user } = useUserStore();

  return (
    <div className="w-full h-20 bg-white flex items-center justify-between px-3 sm:px-4 lg:px-8">
      {/* greeting */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* mobile menu button */}
        <Button
          onPress={onOpenSidebar}
          isIconOnly
          className="lg:hidden bg-white size-11 border text-gray-700 flex items-center justify-center rounded-2xl hover:bg-gray-100/60 transition-all duration-300"
        >
          <Icon icon="solar:hamburger-menu-broken" width="24" height="24" />
        </Button>

        <div className="flex flex-col gap-0.5">
          <span className="text-base sm:text-xl font-bold text-gray-700">
            سلام؛ {user.fullName}
          </span>
          <span className="text-sm font-bold text-gray-500">{greetByTime()}</span>
        </div>
      </div>

      {/* buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative">
          <span className="size-5 text-white rounded-full flex items-center justify-center text-xs pl-0.5 pt-0.5 bg-red-600 absolute -top-1.5 -right-1.5 z-50">
            {toFarsiNumber(0)}
          </span>

          <Button
            isIconOnly
            className="bg-white size-11 border text-gray-700 flex items-center justify-center rounded-2xl hover:bg-gray-100/60 transition-all duration-300"
          >
            <Icon icon="solar:bell-broken" width="24" height="24" />
          </Button>
        </div>

        <Button
          isIconOnly
          className="bg-white size-11 border text-gray-700 flex items-center justify-center rounded-2xl hover:bg-gray-100/60 transition-all duration-300"
        >
          <Icon icon="solar:user-rounded-broken" width="24" height="24" />
        </Button>
      </div>
    </div>
  );
};

export default Header;
