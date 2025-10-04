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
  Tooltip,
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

    const takeCanvasBlob = () =>
      new Promise((resolve) => {
        const canvas = document.querySelector(".design-studio canvas");
        if (!canvas) return resolve(null);
        canvas.toBlob((blob) => resolve(blob), "image/png");
      });

    const intervalId = setInterval(() => {
      (async () => {
        try {
          const imageBlob = await takeCanvasBlob();
          const form = new FormData();
          form.append("projectId", id);
          form.append("objects", JSON.stringify(selectedModels));
          if (imageBlob) {
            const file = new File(
              [imageBlob],
              `${project?.name || "project"}-${Date.now()}.png`,
              { type: "image/png" }
            );
            form.append("image", file);
          }

          await postData("/project/save-changes", form, undefined, "multipart");
        } catch (e) {
          toast.error("خطا هنگام ذخیره تغییرات", {
            duration: 3500,
            className: "text-sm rounded-2xl",
          });
        }
      })();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [id, selectedModels]);

  return null;
};

const Toolbar = ({ project }) => {
  const {
    selectedModels,
    setSelectedModels,
    selectedModelId,
    setSelectedModelId,
    isPasteMode,
    setIsPasteMode,
    clipboardModels,
    setClipboardModels,
    undo,
    redo,
  } = useModelStore();
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
    if (project?.objects) {
      setSelectedModels(project.objects);
    }
  }, [project?.id]); // Only run when project ID changes (initial load)

  const saveChangeHandler = async () => {
    setLoading(true);

    try {
      const canvas = document.querySelector(".design-studio canvas");
      let imageBlob = null;
      if (canvas) {
        imageBlob = await new Promise((resolve) =>
          canvas.toBlob((blob) => resolve(blob), "image/png")
        );
      }

      const form = new FormData();
      form.append("projectId", id);
      form.append("objects", JSON.stringify(selectedModels));
      if (imageBlob) {
        const file = new File(
          [imageBlob],
          `${project?.name || "project"}-${Date.now()}.png`,
          { type: "image/png" }
        );
        form.append("image", file);
      }

      await postData("/project/save-changes", form, undefined, "multipart");

      setLoading(false);
      toast.success("تغییرات با موفقیت ذخیره شدند", {
        duration: 3500,
        className: "text-sm rounded-2xl",
      });
    } catch (err) {
      toast.error("خطا هنگام ذخیره تغییرات", {
        duration: 3500,
        className: "text-sm rounded-2xl",
      });
      setLoading(false);
    }
  };

  const editProjectHandler = (data) => {
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

    // snapshot for undo
    const { pushHistory } = useModelStore.getState();
    pushHistory();
    setSelectedModels(newData);
  };

  // Copy selected model(s)
  const copyModelHandler = () => {
    if (!selectedModelId) return;

    // Get models to copy based on selection
    let modelsToCopy = [];
    if (selectedModelId === 'ALL') {
      modelsToCopy = selectedModels.map(model => ({ ...model, action: "copy" }));
    } else if (Array.isArray(selectedModelId)) {
      modelsToCopy = selectedModels
        .filter(model => selectedModelId.includes(model.id))
        .map(model => ({ ...model, action: "copy" }));
    } else {
      const selectedModel = selectedModels.find(model => model.id === selectedModelId);
      if (selectedModel) {
        modelsToCopy = [{ ...selectedModel, action: "copy" }];
      }
    }

    if (modelsToCopy.length > 0) {
      const { pushHistory } = useModelStore.getState();
      pushHistory();
      setClipboardModels(modelsToCopy);
      toast.success(`${modelsToCopy.length} مدل کپی شد`, {
        duration: 2000,
        className: "text-sm rounded-2xl",
      });
    }
  };

  // Cut selected model(s)
  const cutModelHandler = () => {
    if (!selectedModelId) return;

    // Get models to cut based on selection
    let idsToCut = [];
    let modelsToCut = [];
    
    if (selectedModelId === 'ALL') {
      idsToCut = selectedModels.map((m) => m.id);
      modelsToCut = selectedModels.map(model => ({ ...model, action: "cut" }));
    } else if (Array.isArray(selectedModelId)) {
      idsToCut = [...selectedModelId];
      modelsToCut = selectedModels
        .filter(model => selectedModelId.includes(model.id))
        .map(model => ({ ...model, action: "cut" }));
    } else {
      idsToCut = [selectedModelId];
      const selectedModel = selectedModels.find(model => model.id === selectedModelId);
      if (selectedModel) {
        modelsToCut = [{ ...selectedModel, action: "cut" }];
      }
    }

    if (modelsToCut.length > 0) {
      setClipboardModels(modelsToCut);
      const { pushHistory } = useModelStore.getState();
      pushHistory();
      setSelectedModels(selectedModels.filter((model) => !idsToCut.includes(model.id)));
      setSelectedModelId(null);
      toast.success(`${modelsToCut.length} مدل بریده شد`, {
        duration: 2000,
        className: "text-sm rounded-2xl",
      });
    }
  };

  // Toggle paste mode
  const togglePasteMode = () => {
    if (!clipboardModels || clipboardModels.length === 0) return;

    setIsPasteMode(!isPasteMode);
    if (!isPasteMode) {
      toast.success(`حالت پیست فعال شد. ${clipboardModels.length} مدل آماده پیست است. روی محل مورد نظر کلیک کنید`, {
        duration: 3000,
        className: "text-sm rounded-2xl",
      });
    } else {
      toast.success("حالت پیست غیرفعال شد", {
        duration: 2000,
        className: "text-sm rounded-2xl",
      });
    }
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

  const exportProjectHandler = () => {
    const jsonStr = JSON.stringify(selectedModels, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${project.name}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importProjectHandler = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setSelectedModels(json);
      } catch (err) {
        toast.error("خطا هنگام بارگذاری پروژه");
      }
    };

    reader.readAsText(file);
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
          <div className="flex flex-col items-center gap-1">
            <Tooltip content="بارگذاری پروژه" placement="bottom" size="sm">
              <div
                className="bg-gray-200/90 relative flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
              >
                <i className="fi fi-rr-add-document size-4 block"></i>

                <input
                  type="file"
                  accept=".json"
                  className="cursor-pointer absolute opacity-0 left-0 w-full"
                  onChange={importProjectHandler}
                />
              </div>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="خروجی پروژه" placement="bottom" size="sm">
              <button
                onClick={exportProjectHandler}
                className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
              >
                <i className="fi fi-rr-file-export size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="برش" placement="bottom" size="sm">
              <button
                onClick={cutModelHandler}
                disabled={!selectedModelId}
                className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fi fi-rr-scissors size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="کپی" placement="bottom" size="sm">
              <button
                onClick={copyModelHandler}
                disabled={!selectedModelId}
                className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fi fi-rr-copy size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="چسباندن" placement="bottom" size="sm">
              <button
                title="چسباندن"
                onClick={togglePasteMode}
                disabled={!clipboardModels || clipboardModels.length === 0}
                className={`flex justify-center items-center size-9 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isPasteMode
                    ? "bg-primaryThemeColor text-white"
                    : "bg-gray-200/90 text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor"
                }`}
              >
                <i className="fi fi-rr-paste size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="ذخیره" placement="bottom" size="sm">
              <button
                title="ذخیره"
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
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="واگرد" placement="bottom" size="sm">
              <button
                onClick={undo}
                className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
              >
                <i className="fi fi fi fi-rr-undo-alt size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="از نو" placement="bottom" size="sm">
              <button
                onClick={redo}
                className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
              >
                <i className="fi fi-rr-redo-alt size-4 block"></i>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* other tools */}
        <div className="flex items-end gap-3">
          <div className="flex flex-col items-center gap-1">
            <Tooltip content="یادداشت" placement="bottom" size="sm">
              <button className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
                <i className="fi fi-rr-journal-alt size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="اسکرین شات" placement="bottom" size="sm">
              <button
                onClick={getScreenShotHandler}
                className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
              >
                <i className="fi fi-sr-mode-landscape size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="اشتراک" placement="bottom" size="sm">
              <button className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
                <i className="fi fi-rr-share-square size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="حذف" placement="bottom" size="sm">
              <button
                onClick={deleteModelHandler}
                className="bg-gray-200/90 flex justify-center items-center size-9 rounded-xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
              >
                <i className="fi fi-rr-trash size-4 block"></i>
              </button>
            </Tooltip>
          </div>
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
              onPress={handleSubmit(editProjectHandler)}
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
