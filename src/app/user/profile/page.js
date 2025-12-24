import EditProfileForm from "@/components/user/EditProfileForm";
import Image from "next/image";
import React from "react";

const Page = () => {
  return (
    <div className="w-full flex flex-col max-w-lg shadow-lg shadow-gray-100 dark:shadow-gray-900">
      {/* header */}
      <div className="w-full h-28 flex justify-center items-center bg-gradient-to-tl from-primaryThemeColor/5 to-gray-200 dark:from-primaryThemeColor/10 dark:to-gray-800 rounded-t-2xl">
        <p className="md:text-base text-gray-600 dark:text-gray-200 px-2 py-1 rounded-lg bg-white dark:bg-gray-800 font-bold text-sm">
          خلاقیتتو شکوفا کن !
        </p>
      </div>

      {/* profile form */}
      <div className="w-full flex flex-col gap-4 bg-white dark:bg-gray-800 rounded-b-2xl p-4 lg:p-6 pt-0 lg:pt-0">
        <EditProfileForm />
      </div>
    </div>
  );
};

export default Page;
