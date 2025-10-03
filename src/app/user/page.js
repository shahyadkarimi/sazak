import { toFarsiNumber } from "@/helper/helper";
import { getUser } from "@/lib/auth";
import { baseURL, siteURL } from "@/services/API";
import { cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import ProjectActions from "./project/my-projects/ProjectActions";

const Page = async () => {
  const { user } = await getUser();
  const token = (await cookies()).get("token")?.value;

  const fetchStats = async () => {
    try {
      const userStatsRes = await fetch(`${baseURL}/user/stats`, {
        headers: {
          "x-auth-token": token,
        },
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
      });

      const { projects } = await myProjectsRes.json();

      return { myProjects: projects };
    } catch (error) {
      return { error: true, myProjects: null };
    }
  };

  const { myProjects } = await fetchProjects();

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
      history: `${toFarsiNumber(userStats?.projectCount)} عدد`,
      icon: "solar:ruler-cross-pen-broken",
    },
    {
      title: "سازه ها",
      history: `${toFarsiNumber(userStats?.totalObjects)} عدد`,
      icon: "solar:layers-broken",
    },
  ];
{console.log(myProjects)}
  return (
    <div className="flex flex-col gap-4 lg:gap-8">
      {/* username */}
      <div className="w-fit text-gray-700 bg-white p-4 lg:p-6 rounded-2xl shadow-lg shadow-gray-100">
        <p>
          <span className="font-black text-xl ml-2">{user?.name} عزیز😍؛</span>
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
            <div
              key={index}
              className="w-full h-24 flex items-center gap-3 bg-white rounded-2xl shadow-lg shadow-gray-100 hover:shadow-xl hover:shadow-gray-200/90 transition-all p-4 lg:p-6"
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
                <span className="text-gray-400 text-sm">{item.title}</span>
                <span className="text-gray-700 font-semibold">
                  {item.history}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* user recent projects */}
      <div className="flex flex-col gap-4 border-t border-gray-200/80 pt-4 lg:pt-6">
        <div className="w-full flex items-center justify-between">
          <h2 className="text-xl lg:text-2xl text-gray-700 font-black">
            آخرین پروژه های من
          </h2>

          <Link
            href={"/user/project/my-projects"}
            className="flex items-center gap-2 text-gray-500 hover:text-primaryThemeColor text-sm font-bold transition-all duration-300"
          >
            <span>مشاهده همه پروژه ها</span>

            <Icon icon="solar:arrow-left-broken" width="20" height="20" />
          </Link>
        </div>

        {myProjects.length ? (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-8 gap-4">
            {myProjects.map((item) => (
              <div
                key={item._id}
                className="w-full group flex flex-col gap-3 bg-white p-4 lg:p-4 rounded-2xl shadow-lg shadow-gray-100 hover:shadow-xl hover:shadow-gray-200/90 transition-all"
              >
                <Link
                  href={`/design-studio/project/${item._id}`}
                  className="overflow-hidden rounded-2xl"
                >
                  <Image
                    src={item.image ? `${siteURL}${item.image}` : "/assets/holder.svg"}
                    width={400}
                    height={200}
                    className="aspect-video rounded-xl group-hover:scale-105 transition-all"
                    alt={item.name}
                  />
                </Link>

                <Link
                  href={`/design-studio/project/${item._id}`}
                  className="text-lg text-gray-700 group-hover:text-primaryThemeColor font-extrabold transition-all"
                >
                  {item.name}
                </Link>

                <p className="text-sm font-light -mt-1 text-gray-700 line-clamp-2 h-10">
                  {item.description}
                </p>

                <div className="w-full flex justify-between items-center">
                  <div className="flex items-center text-gray-600 text-[13px] gap-1">
                    <Icon icon="solar:layers-broken" width="20" height="20" />

                    <span>
                      سازه ها: {`${toFarsiNumber(item.objects.length)} عدد`}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-500 text-xs gap-1">
                    <span>
                      آخرین ویرایش{" "}
                      {new Intl.DateTimeFormat("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "2-digit",
                      }).format(new Date(item.updatedAt))}
                    </span>
                  </div>
                </div>

                <ProjectActions id={item._id} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center mt-8 gap-4">
            <h2 className="text-gray-600 text-lg">
              شما هنوز پروژه ای نساخته اید !
            </h2>
            <Link
              href={"/design-studio/new-project"}
              className="text-primaryThemeColor font-bold"
            >
              میخواهید اولین پروژه خود را ایجاد کنید ؟
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
