"use client";

import { useUserStore } from "@/store/UserInfo";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Header = () => {
  const { user } = useUserStore();

  return (
    <div className="w-full bg-white flex justify-center items-center">
      <div className="w-full h-20 max-w-[1450px] px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src={user.profilePicture || "/assets/avatar.png"}
            width={150}
            height={150}
            className="size-8 rounded-full scale-150"
            alt="user avatar"
          />

          <div className="flex flex-col gap-0.5">
            <h2 className="font-black text-gray-700">{user.fullName}</h2>
            <p className="text-xs text-gray-700">خوش آمدید</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-primaryThemeColor">
          گــروه آمــوزشـی ســازک
        </h1>

        <Link href={"/user"}>
          <Image
            src={"/assets/logo.png"}
            width={150}
            height={150}
            className="size-8 rounded-full scale-150"
            alt="sazak logo"
          />
        </Link>
      </div>
    </div>
  );
};

export default Header;
