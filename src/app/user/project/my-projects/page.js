import { Icon } from "@iconify/react";
import Link from "next/link";
import React from "react";

const Page = () => {
  return (
    <div className="w-full flex flex-col gap-4 lg:gap-8">
      <div className="flex flex-col gap-4">
        {/* title */}
        <div className="w-full flex items-center justify-between">
          <h2 className="text-xl lg:text-2xl text-gray-700 font-black">
            پروژه های من
          </h2>

          <Link
            href={"/design-studio/new-project"}
            className="py-3 px-6 text-sm flex items-center gap-2 font-bold rounded-2xl bg-primaryThemeColor text-white focus-within:scale-95 transition-all"
          >
            <Icon icon="solar:add-circle-broken" width="24" height="24" />
            <span>ایجاد پروژه جدید</span>
          </Link>
        </div>

        <div className="flex flex-col items-center mt-8 gap-4">
          <h2 className="text-gray-600 text-lg">
            شما هنوز پروژه ای نساخته اید !
          </h2>
          <Link
            href={"/design-studio/new-project"}
            className="text-primaryThemeColor font-bold"
          >
            برای ایجاد اولین پروژه خود کلیک کنید
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Page;
