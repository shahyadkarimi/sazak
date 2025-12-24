import NewProjectForm from "../../../components/design-studio/NewProjectForm";
import Link from "next/link";
import { Icon } from "@iconify/react";

const Page = async () => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100/70 dark:bg-gray-900">
      <div className="w-full max-w-lg h-auto flex flex-col gap-4 lg:gap-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-100 dark:shadow-gray-900 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-black text-gray-700 dark:text-gray-200">
            ایجاد پروژه جدید
          </h1>

          <Link
            href={"/user/project/my-projects"}
            className="flex items-center gap-2 rounded-2xl text-sm hover:text-red-600 transition-all"
          >
            <span>بازگشت</span>
            <Icon icon="solar:arrow-left-broken" width="20" height="20" />
          </Link>
        </div>

        <NewProjectForm />
      </div>
    </div>
  );
};

export default Page;
