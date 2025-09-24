import Image from "next/image";
import React from "react";
import LoginForm from "./LoginForm";
import Link from "next/link";
import { Icon } from "@iconify/react";
import AuthSlider from "@/components/auth/AuthSlider";

export const metadata = {
  title: "آموزشگاه رباتیک سازک - ورود به حساب کاربری",
  author: "آموزشگاه رباتیک سازک",
  description: "وارد حساب کاربری خود شوید",

  openGraph: {
    title: "آموزشگاه رباتیک سازک - ورود به حساب کاربری",
    description: "وارد حساب کاربری خود شوید",
    url: `https://sazakacademy.ir/auth`,
    metadataBase: new URL(`https://sazakacademy.ir/auth`),
    siteName: "آموزشگاه رباتیک سازک",
    images: [
      {
        url: `/assets/logo.png`,
        alt: "آموزشگاه رباتیک سازک - صفحه اصلی",
        width: 300,
        hieght: 300,
      },
    ],
    locale: "fa_IR",
    type: "website",
  },
};

const Page = () => {
  return (
    <div className="w-full min-h-screen flex overflow-x-hidden">
      <div className="w-[55%] min-h-full flex justify-center items-center">
        <div className="w-full max-w-[425px]">
          <LoginForm />
        </div>
      </div>

      <div className="w-[45%] min-h-full auth-bg relative p-10 flex flex-col justify-between gap-4">
        <div className="w-full flex items-center justify-between relative">
          {/* logo */}
          <div className="flex items-center gap-4">
            <Image
              src={"/assets/logo.png"}
              width={150}
              height={150}
              className="size-10 rounded-full scale-150"
              alt="sazak logo"
            />

            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-gray-700">آموزشگاه رباتیک</p>
              <h2 className="text-xl font-black text-primaryThemeColor">
                سازک
              </h2>
            </div>
          </div>
          
          {/* go home */}
          <Link
            href={"/"}
            className="text-xs  text-primaryThemeColor font-semibold h-10 rounded-xl bg-primaryThemeColor/5 px-6 flex items-center justify-center gap-2"
          >
            <span>بازگشت به وبسایت</span>

            <Icon icon="solar:arrow-left-linear" width="20" height="20" />
          </Link>
        </div>

        <AuthSlider />
      </div>
    </div>
  );
};

export default Page;
