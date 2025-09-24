"use client";

import { postData } from "@/services/API";
import useModelStore from "@/store/useModelStore";
import { Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const Toolbar = ({ project }) => {
  const { selectedModels, setSelectedModels, selectedModelId } =
    useModelStore();
  const [loading, setLoading] = useState(false);
  const [confirmAutoSave, setConfirmAutoSave] = useState(0);

  const { id } = useParams();

  useEffect(() => {
    setSelectedModels(project?.objects || []);
    setConfirmAutoSave((prev) => prev + 1);
  }, [project]);

  useEffect(() => {
    if (!project || !project.autoSave || confirmAutoSave !== 1) return;

    const saveData = async () => {
      postData("/project/save-changes", {
        projectId: id,
        objects: selectedModels,
      })
        .then((res) => {
          setLoading(false);
        })
        .catch((err) => {
          toast.error("خطا هنگام ذخیره تغییرات", {
            duration: 3500,
            className: "text-sm rounded-2xl",
          });
          setLoading(false);
        });
    };

    saveData();
  }, [selectedModels]);

  const saveChangeHandler = () => {
    setLoading(true);

    postData("/project/save-changes", {
      projectId: id,
      objects: selectedModels,
    })
      .then((res) => {
        setLoading(false);
        toast.success("تغییرات با موفقیت ذخیره شدند", {
          duration: 3500,
          className: "text-sm rounded-2xl",
        });
      })
      .catch((err) => {
        toast.error("خطا هنگام ذخیره تغییرات", {
          duration: 3500,
          className: "text-sm rounded-2xl",
        });
        setLoading(false);
      });
  };

  const deleteModelHandler = () => {
    if (!selectedModelId) return;

    const newData = selectedModels.filter(
      (item) => item.id !== selectedModelId
    );

    setSelectedModels(newData);
  };

  const getScreenShotHandler = () => {
    const canvas = document.querySelector(".design-studio canvas");

    if (!canvas) {
      console.error("Canvas not found with selector");
      return;
    }

    const dataURL = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `${project.name}-${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex items-center justify-center bg-gray-200/40">
      <Toaster />
      <div className="w-full max-w-[1450px] h-16 px-4 flex items-center justify-between">
        <h2 className="font-bold text-gray-700 text-lg">{project.name}</h2>

        {/* tools */}
        <div className="flex flex-row-reverse items-center gap-3">
          <button className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
            <i className="fi fi-rr-add-document size-4 block"></i>
          </button>

          <button className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
            <i className="fi fi-rr-scissors size-4 block"></i>
          </button>

          <button className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
            <i className="fi fi-rr-copy size-4 block"></i>
          </button>

          <button className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
            <i className="fi fi-rr-paste size-4 block"></i>
          </button>

          <button
            onClick={saveChangeHandler}
            disabled={loading}
            className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
          >
            {loading ? (
              <Spinner
                size="sm"
                classNames={{
                  circle1: "border-b-primaryThemeColor",
                  circle2: "border-b-primaryThemeColor",
                }}
              />
            ) : (
              <i className="fi fi-rr-disk size-4 block"></i>
            )}
          </button>

          <button className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
            <i className="fi fi fi-rr-floppy-disk-pen size-4 block"></i>
          </button>

          <button className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
            <i className="fi fi fi fi-rr-undo-alt size-4 block"></i>
          </button>

          <button className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
            <i className="fi fi-rr-redo-alt size-4 block"></i>
          </button>
        </div>

        {/* other tools */}
        <div className="flex items-center gap-3">
          <button className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
            <i className="fi fi-rr-journal-alt size-4 block"></i>
          </button>

          <button
            onClick={getScreenShotHandler}
            className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
          >
            <i className="fi fi-sr-mode-landscape size-4 block"></i>
          </button>

          <button className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
            <i className="fi fi-rr-share-square size-4 block"></i>
          </button>

          <button
            onClick={deleteModelHandler}
            className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
          >
            <i className="fi fi-rr-trash size-4 block"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
