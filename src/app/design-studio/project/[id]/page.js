import DesignPanel from "@/components/design-studio/DesignPanel";
import Header from "@/components/design-studio/Header";
import Navbar from "@/components/design-studio/Navbar";
import Toolbar from "@/components/design-studio/Toolbar";
import { baseURL } from "@/services/API";
import { cookies } from "next/headers";
import React from "react";

const Page = async ({ params }) => {
  const { id } = await params;
  const token = (await cookies()).get("token")?.value;

  const fetchData = async () => {
    try {
      const projectRes = await fetch(`${baseURL}/project/get/${id}`, {
        headers: {
          "x-auth-token": token,
        },
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
      <Navbar project={project} />
      <Header />
      <Toolbar project={project} />
      <DesignPanel project={project} />
    </div>
  );
};

export default Page;
