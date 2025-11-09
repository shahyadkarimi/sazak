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

      const project = await projectRes.json();

      return project.project;
    } catch (error) {
      console.log(error);
      return "error";
    }
  };

  const project = await fetchData();

  if (project === "error") {
    return <p className="text-danger">خطا هنگام پردازش پروژه</p>;
  }

  return (
    <div className="w-full flex flex-col">
      <Header />
      <Toolbar project={project} />
      <DesignPanel project={project} />
    </div>
  );
};

export default Page;
