import DesignPanel from "@/components/design-studio/DesignPanel";
import Header from "@/components/design-studio/Header";
import Toolbar from "@/components/design-studio/Toolbar";
import { baseURL } from "@/services/API";
import { cookies } from "next/headers";
import React from "react";

const Page = async ({ params }) => {
  const { id } = await params;
  const cookieStore = await cookies();
  const token =
    cookieStore.get("impersonation_token")?.value ||
    cookieStore.get("token")?.value;

  const fetchData = async () => {
    try {
      const projectRes = await fetch(`${baseURL}/project/get/${id}`, {
        headers: {
          "x-auth-token": token,
        },
        cache: "no-store",
      });

      const data = await projectRes.json();

      if (!data.success || !data.project) {
        return { error: true, message: data.message || "پروژه یافت نشد" };
      }

      return { error: false, project: data.project };
    } catch (error) {
      console.log(error);
      return { error: true, message: "خطا هنگام دریافت پروژه" };
    }
  };

  const result = await fetchData();

  if (result.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-danger text-lg font-bold">{result.message}</p>
          <p className="text-gray-600 dark:text-gray-400 mt-2">لطفاً دوباره تلاش کنید</p>
        </div>
      </div>
    );
  }

  const project = result.project;

  console.log(project);

  return (
    <div className="w-full flex flex-col">
      <Header />
      <Toolbar project={project} />
      <DesignPanel project={project} />
    </div>
  );
};

export default Page;
