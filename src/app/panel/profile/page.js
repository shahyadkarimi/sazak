import EditProfileForm from "@/components/panel/EditProfileForm";
import Image from "next/image";
import React from "react";

const Page = () => {
  return (
    <div className="w-full flex flex-col max-w-lg shadow-lg shadow-gray-100">
      {/* header */}
      <div className="w-full h-28 flex justify-center items-center bg-gradient-to-tl from-primaryThemeColor/5 to-gray-200 rounded-t-2xl">
        <p className="md:text-base text-gray-600 px-2 py-1 rounded-lg bg-white font-bold text-sm">
          خلاقیتتو شکوفا کن !
        </p>
      </div>

      {/* profile form */}
      <div className="w-full flex flex-col gap-4 bg-white rounded-b-2xl p-4 lg:p-6 pt-0 lg:pt-0">
        <EditProfileForm />
      </div>
    </div>
  );
};

export default Page;
