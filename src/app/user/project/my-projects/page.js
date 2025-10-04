import { toFarsiNumber } from "@/helper/helper";
import { baseURL, siteURL } from "@/services/API";
import { Icon } from "@iconify/react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import ProjectActions from "./ProjectActions";

const Page = async () => {
  const token = (await cookies()).get("token")?.value;

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
            className="sm:py-3 sm:px-6 py-2 px-4 text-sm flex items-center gap-2 font-bold rounded-2xl bg-primaryThemeColor text-white focus-within:scale-95 transition-all"
          >
            <Icon icon="solar:add-circle-broken" width="24" height="24" />
            <span>ایجاد پروژه جدید</span>
          </Link>
        </div>

        {myProjects.length ? (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    width={600}
                    height={300}
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

                <ProjectActions id={item._id} project={item} />
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
              برای ایجاد اولین پروژه خود کلیک کنید
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
