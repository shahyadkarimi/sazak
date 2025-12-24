import { toFarsiNumber } from "@/helper/helper";
import { getUser } from "@/lib/auth";
import { baseURL, siteURL } from "@/services/API";
import { cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import { cookies } from "next/headers";
import Link from "next/link";
import React from "react";
import ProjectsWithCollections from "@/components/user/ProjectsWithCollections";

const Page = async () => {
  const { user } = await getUser();
  const cookieStore = await cookies();
  const token =
    cookieStore.get("impersonation_token")?.value ||
    cookieStore.get("token")?.value;

  const fetchStats = async () => {
    try {
      const userStatsRes = await fetch(`${baseURL}/user/stats`, {
        headers: {
          "x-auth-token": token,
        },
        cache: "no-store",
      });

      const { stats } = await userStatsRes.json();

      return { userStats: stats };
    } catch (error) {
      return { error: true, userStats: null };
    }
  };

  const { userStats } = await fetchStats();

  const fetchProjects = async () => {
    try {
      const myProjectsRes = await fetch(`${baseURL}/project/my-projects`, {
        headers: {
          "x-auth-token": token,
        },
        cache: "no-store",
      });

      const { projects } = await myProjectsRes.json();

      return { myProjects: projects || [] };
    } catch (error) {
      return { error: true, myProjects: [] };
    }
  };

  const fetchCollections = async () => {
    try {
      const collectionsRes = await fetch(`${baseURL}/collections`, {
        headers: {
          "x-auth-token": token,
        },
        cache: "no-store",
      });

      const { collections } = await collectionsRes.json();

      return { collections: collections || [] };
    } catch (error) {
      return { error: true, collections: [] };
    }
  };

  const { myProjects } = await fetchProjects();
  const { collections } = await fetchCollections();
  console.log(user);
  const daysSinceCreated = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const userHistory = [
    {
      title: "سابقه عضویت",
      history:
        daysSinceCreated === 0
          ? "امروز"
          : `${toFarsiNumber(daysSinceCreated)} روز`,
      icon: "solar:calendar-broken",
    },
    {
      title: "پروژه ها",
      history: `${toFarsiNumber(userStats?.projectCount)} عدد`,
      icon: "solar:ruler-cross-pen-broken",
    },
    {
      title: "سازه ها",
      history: `${toFarsiNumber(userStats?.totalObjects)} عدد`,
      icon: "solar:layers-broken",
    },
  ];

  return (
    <div className="flex flex-col gap-4 lg:gap-8">
      {/* user name */}
      <div className="w-full flex items-center justify-between">
        <div className="w-fit text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-2xl shadow-lg shadow-gray-100 dark:shadow-gray-900">
          <p>
            <span className="font-black text-xl ml-2">
              {user?.name} عزیز😍؛
            </span>
            <span>به جمع بچه های سازک خوش آمدی👋🏻</span>
          </p>
        </div>

        <Link
          href={"/design-studio/new-project"}
          className="hidden sm:py-3 sm:px-6 py-2 px-4 text-sm md:flex items-center gap-2 font-bold rounded-2xl bg-primaryThemeColor text-white focus-within:scale-95 transition-all"
        >
          <Icon icon="solar:add-circle-broken" width="24" height="24" />
          <span>ایجاد پروژه جدید</span>
        </Link>
      </div>

      {/* user history */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl lg:text-2xl text-gray-700 dark:text-gray-200 font-black">
          سوابق من
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {userHistory.map((item, index) => (
            <div
              key={index}
              className="w-full h-24 flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-100 dark:shadow-gray-900 hover:shadow-xl hover:shadow-gray-200/90 dark:hover:shadow-gray-900/90 transition-all p-4 lg:p-6"
            >
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
                <span className="text-gray-400 dark:text-gray-300 text-sm">{item.title}</span>
                <span className="text-gray-700 dark:text-gray-200 font-semibold">
                  {item.history}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* user recent projects */}
      <div className="flex flex-col gap-4 border-t border-gray-200/80 dark:border-gray-700/80 pt-4 lg:pt-6">
        <div className="w-full flex items-center justify-between">
          <h2 className="text-xl lg:text-2xl text-gray-700 dark:text-gray-200 font-black">
            آخرین پروژه های من
          </h2>

          <Link
            href={"/user/project/my-projects"}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primaryThemeColor dark:hover:text-primaryThemeColor text-sm font-bold transition-all duration-300"
          >
            <span>مشاهده همه پروژه ها</span>

            <Icon icon="solar:arrow-left-broken" width="20" height="20" />
          </Link>
        </div>

        <ProjectsWithCollections
          initialProjects={myProjects}
          initialCollections={collections}
        />
      </div>
    </div>
  );
};

export default Page;
