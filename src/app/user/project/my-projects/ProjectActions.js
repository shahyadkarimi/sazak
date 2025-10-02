"use client";

import { postData } from "@/services/API";
import { Button, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const ProjectActions = ({ id, project }) => {
  const [deleteProject, setDeleteProject] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const deleteProjectHandler = () => {
    setLoading(true);
    postData("/project/delete", { id })
      .then((res) => {
        router.refresh();
        toast.success("پروژه با موفقیت حذف شد");
      })
      .catch((err) => {
        toast.error("خطا هنگام حذف پروژه");
      });
  };

  return (
    <div className="w-full flex justify-center items-center mt-2">
      {deleteProject ? (
        <div className="w-full h-5 flex justify-between items-center gap-2">
          <p className="text-xs text-gray-700">
            مطمئنید میخواهید این پروژه را حذف کنید ؟
          </p>

          <div className="flex items-center gap-4">
            <button
              disabled={loading}
              onClick={deleteProjectHandler}
              className="text-sm text-danger font-semibold"
            >
              {loading ? <Spinner size="sm" color="danger" /> : "حذف پروژه"}
            </button>
            <button
              onClick={() => {
                setDeleteProject(false);
                setLoading(false);
              }}
              className="text-success text-xs"
            >
              لغو
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex items-center gap-3">
          {/* <button
          
          className="flex items-center gap-1 text-danger text-sm font-light"
          >
          <span>حذف پروژه</span>
        </button> */}

          <Button
            as={Link}
            href={`/design-studio/project/${id}`}
            startContent={
              <Icon
                icon="solar:ruler-cross-pen-broken"
                width="20"
                height="20"
              />
            }
            className="w-full bg-primaryThemeColor h-10 font-semibold text-white xl"
          >
            ادامه طراحی
          </Button>

          <Button
            isIconOnly
            onClick={() => setDeleteProject(true)}
            className="min-w-10 size-10 bg-danger/15 text-danger hover:bg-danger hover:!opacity-100 hover:text-white xl"
          >
            <Icon icon="solar:trash-bin-2-broken" width="20" height="20" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectActions;
