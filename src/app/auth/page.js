import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import AuthContent from "./AuthContent";
import connectDB from "@/lib/db";
import Setting from "@/models/Setting";

export async function generateMetadata() {
  await connectDB();
  const setting = await Setting.findOne().lean();
  const siteName = setting?.siteName || "آموزشگاه رباتیک سازک";
  const description = setting?.siteDescription || "وارد حساب کاربری خود شوید";
  const title = `${siteName} - ورود به حساب کاربری`;
  const logo = setting?.logo || "/assets/logo.png";
  const url = "https://sazakacademy.ir/auth";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName,
      images: [
        {
          url: logo,
          alt: title,
          width: 300,
          height: 300,
        },
      ],
      locale: "fa_IR",
      type: "website",
    },
  };
}

const getSettings = async () => {
  await connectDB();
  const setting = await Setting.findOne().lean();
  return {
    siteName: setting?.siteName || "سازک",
    siteDescription: setting?.siteDescription || "آموزشگاه رباتیک",
    logo: setting?.logo || "/assets/logo.png",
  };
};

const Page = async () => {
  const settings = await getSettings();

  return (
    <div className="w-full min-h-screen flex justify-center items-center overflow-x-hidden relative p-6">
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Image
            src={settings.logo}
            width={150}
            height={150}
            className="size-10 rounded-full scale-150"
            alt={settings.siteName}
            unoptimized
          />

          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-gray-700">{settings.siteDescription}</p>
            <h2 className="text-xl font-black text-primaryThemeColor">
              {settings.siteName}
            </h2>
          </div>
        </div>

        <Link
          href={"/"}
          className="text-xs text-primaryThemeColor font-semibold h-10 rounded-xl bg-primaryThemeColor/5 px-6 flex items-center justify-center gap-2"
        >
          <span>بازگشت به وبسایت</span>

          <Icon icon="solar:arrow-left-linear" width="20" height="20" />
        </Link>
      </div>

      <div className="w-full max-w-[425px]">
        <AuthContent />
      </div>
    </div>
  );
};

export default Page;
