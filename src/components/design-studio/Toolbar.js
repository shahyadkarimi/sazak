"use client";

import { postData } from "@/services/API";
import useModelStore from "@/store/useModelStore";
import { Spinner } from "@heroui/react";
import {
  Button,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";

const AutoSave = ({ project }) => {
  const { selectedModels } = useModelStore();
  const { id } = useParams();

  useEffect(() => {
    if (!project) return;

    const intervalId = setInterval(() => {
      postData("/project/save-changes", {
        projectId: id,
        objects: selectedModels,
      }).catch(() => {
        toast.error("خطا هنگام ذخیره تغییرات", {
          duration: 3500,
          className: "text-sm rounded-2xl",
        });
      });
    }, 30000);

    return () => clearInterval(intervalId);
  }, [id, selectedModels]);

  return null;
};

const Toolbar = ({ project }) => {
  const { selectedModels, setSelectedModels, selectedModelId } =
    useModelStore();
  const [loading, setLoading] = useState(false);
  const [confirmAutoSave, setConfirmAutoSave] = useState(0);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
    },
  });

  const { id } = useParams();

  useEffect(() => {
    setSelectedModels(project?.objects || []);
  }, [project]);

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

  const submitEditHandler = (data) => {
    setEditLoading(true);

    postData("/project/edit", { id, ...data })
      .then(() => {
        toast.success("پروژه با موفقیت ویرایش شد", {
          duration: 3000,
          className: "text-sm rounded-2xl",
        });
        setIsEditOpen(false);
        setEditLoading(false);
        router.refresh();
      })
      .catch((err) => {
        err?.response?.data?.errors?.forEach((e) => {
          setError(e.name, { message: e.message });
        });
        toast.error("خطا هنگام ویرایش پروژه", {
          duration: 3500,
          className: "text-sm rounded-2xl",
        });
        setEditLoading(false);
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
      <AutoSave project={project} />
      
      <Toaster />
      <div className="w-full max-w-[1450px] h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-700 text-lg">{project.name}</h2>

          <button
            onClick={() => {
              reset({
                name: project?.name || "",
                description: project?.description || "",
              });
              setIsEditOpen(true);
            }}
            className="text-gray-700 hover:text-primaryThemeColor transition-all duration-300"
          >
            {/* open edit modal */}
            <i className="fi fi-rr-pencil size-4 block"></i>
          </button>
        </div>

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

      <Modal
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="font-bold">ویرایش پروژه</ModalHeader>
          <ModalBody className="flex flex-col gap-4">
            <Controller
              name="name"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  type="text"
                  placeholder="نام پروژه"
                  variant="bordered"
                  value={value}
                  onBlur={onBlur}
                  onChange={onChange}
                  classNames={{
                    input:
                      "placeholder:font-light text-base placeholder:text-gray-600",
                    inputWrapper:
                      "border h-[50px] !text-sm border-gray-300 text-gray-800 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
                  }}
                  isInvalid={errors?.name ? true : false}
                  errorMessage={errors?.name?.message}
                  {...register("name", {
                    validate: {
                      required: (value) =>
                        value?.length > 0 || "نام پروژه الزامی است",
                    },
                  })}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Textarea
                  placeholder="توضیحات پروژه ( اختیاری )"
                  variant="bordered"
                  value={value}
                  onBlur={onBlur}
                  onChange={onChange}
                  classNames={{
                    input:
                      "placeholder:font-light text-base placeholder:text-gray-600",
                    inputWrapper:
                      "border h-[50px] !text-sm border-gray-300 text-gray-800 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
                  }}
                />
              )}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsEditOpen(false)}>
              انصراف
            </Button>
            <Button
              className="bg-primaryThemeColor text-white"
              isLoading={editLoading}
              onPress={handleSubmit(submitEditHandler)}
            >
              ذخیره تغییرات
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Toolbar;
