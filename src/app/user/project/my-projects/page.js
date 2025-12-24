import { baseURL } from "@/services/API";
import { Icon } from "@iconify/react";
import { cookies } from "next/headers";
import Link from "next/link";
import React from "react";
import ProjectsWithCollections from "@/components/user/ProjectsWithCollections";

const Page = async () => {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("impersonation_token")?.value ||
    cookieStore.get("token")?.value;

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

  return (
    <div className="w-full flex flex-col gap-4 lg:gap-8">
      <div className="flex flex-col gap-4">
        {/* title */}
        <div className="w-full flex items-center justify-between">
          <h2 className="text-xl lg:text-2xl text-gray-700 dark:text-gray-200 font-black">
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

        <ProjectsWithCollections
          initialProjects={myProjects}
          initialCollections={collections}
        />
      </div>
    </div>
  );
};

export default Page;
