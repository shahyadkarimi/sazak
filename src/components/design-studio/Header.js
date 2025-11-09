"use client";

import { useUserStore } from "@/store/UserInfo";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useSettings } from "@/hooks/useSettings";

const Header = () => {
  const { user } = useUserStore();
  const { settings } = useSettings();

  return (
    <div className="w-full bg-white flex justify-center items-center">
      <div className="w-full h-20 max-w-[1450px] px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src={user.profilePicture || "/assets/avatar.png"}
            width={150}
            height={150}
            className="size-6 lg:size-8 text-xs rounded-full scale-150"
            alt="avatar"
          />

          <div className="flex flex-col gap-0.5">
            <h2 className="font-black text-sm md:text-base text-gray-700">{user.fullName}</h2>
            <p className="text-xs text-gray-700">خوش آمدید</p>
          </div>
        </div>

        <h1 className="hidden md:block text-2xl font-semibold text-primaryThemeColor">
          {settings.siteName || "سازک"}
        </h1>

        <Link href={"/user"}>
          <Image
            src={settings.logo || "/assets/logo.png"}
            width={150}
            height={150}
            className="size-7 lg:size-8 rounded-full scale-150"
            alt={settings.siteName || "site logo"}
          />
        </Link>
      </div>
    </div>
  );
};

export default Header;
