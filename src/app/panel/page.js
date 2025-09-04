import { getUser } from "@/lib/auth";
import { cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import React from "react";

const Page = async () => {
  const { user } = await getUser();

  const userHistory = [
    {
      title: "تاریخ عضویت",
      history: new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }).format(new Date(user.createdAt)),
      icon: "solar:calendar-broken",
    },
    {
      title: "پروژه ها",
      history: `۰ عدد`,
      icon: "solar:ruler-cross-pen-broken",
    },
    { title: "سازه ها", history: `۰ عدد`, icon: "solar:layers-broken" },
  ];

  return (
    <div className="flex flex-col gap-4 lg:gap-8">
      {/* username */}
      <div className="w-fit text-gray-700 bg-white p-4 lg:p-6 rounded-2xl shadow-lg shadow-gray-100">
        <p>
          <span class="font-black text-xl ml-2">{user?.fullName}😍؛</span>
          <span>به جمع بچه های سازک خوش آمدی👋🏻</span>
        </p>
      </div>

      {/* user history */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl lg:text-2xl text-gray-700 font-black">
          سوابق من
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {userHistory.map((item, index) => (
            <div className="w-full h-24 flex items-center gap-3 bg-white rounded-2xl shadow-lg shadow-gray-100 hover:shadow-xl hover:shadow-gray-200/90 transition-all p-4 lg:p-6">
              <div
                className={cn(
                  "size-11 rounded-2xl flex justify-center items-center text-white",
                  index === 0 && "bg-purple-400",
                  index === 1 && "bg-emerald-400",
                  index === 2 && "bg-cyan-400"
                )}
              >
                <Icon icon={item.icon} width="24" height="24" />
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-gray-400 text-sm">{item.title}</span>
                <span className="text-gray-700 font-semibold">
                  {item.history}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-gray-200/80 pt-4 lg:pt-6">
        <div className="w-full flex items-center justify-between">
          <h2 className="text-xl lg:text-2xl text-gray-700 font-black">
            آخرین پروژه های من
          </h2>

          <Link
            href={"#"}
            className="flex items-center gap-2 text-gray-500 hover:text-primaryThemeColor text-sm font-bold transition-all duration-300"
          >
            <span>مشاهده همه پروژه ها</span>

            <Icon icon="solar:arrow-left-broken" width="20" height="20" />
          </Link>
        </div>

        <div className="flex flex-col items-center mt-8 gap-4">
          <h2 className="text-gray-600 text-lg">
            شما هنوز پروژه ای نساخته اید !
          </h2>
          <h2 className="text-primaryThemeColor font-bold">
            میخواهید اولین پروژه خود را ایجاد کنید ؟
          </h2>
        </div>
      </div>
    </div>
  );
};

export default Page;
