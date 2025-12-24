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
import React, { useEffect, useState, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import useUnsavedChangesWarning from "@/hooks/useUnsavedChangesWarning";
import UnsavedChangesWarningModal from "./UnsavedChangesWarningModal";

const AutoSave = ({ project, onSaveSuccess }) => {
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
          if (onSaveSuccess) {
            onSaveSuccess();
          }
        } catch (e) {
          const errorMessage =
            e?.response?.data?.message || "خطا هنگام ذخیره تغییرات";
          toast.error(errorMessage, {
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
    constrainToGrid,
    setConstrainToGrid,
    showColorPanel,
    setShowColorPanel,
    markChangesAsSaved,
    groupMode,
    setGroupMode,
  } = useModelStore();
  const [loading, setLoading] = useState(false);
  const [confirmAutoSave, setConfirmAutoSave] = useState(0);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const router = useRouter();

  const {
    showWarningModal,
    isRefreshWarning,
    handleCancel,
    handleDiscard,
    triggerWarningModal,
    checkForUnsavedChanges,
    handleSaveAndNavigate,
  } = useUnsavedChangesWarning();

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
      const { setProjectContext } = useModelStore.getState();
      setProjectContext(project?.id || id, project.objects);
    }
  }, [project?.id, id]); // Only run when project ID changes (initial load)

  const saveChangeHandler = useCallback(async () => {
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

      markChangesAsSaved();

      setLoading(false);
      toast.success("تغییرات با موفقیت ذخیره شدند", {
        duration: 3500,
        className: "text-sm rounded-2xl",
      });
      return true;
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || "خطا هنگام ذخیره تغییرات";
      toast.error(errorMessage, {
        duration: 3500,
        className: "text-sm rounded-2xl",
      });
      setLoading(false);
      return false;
    }
  }, [id, selectedModels, project?.name, markChangesAsSaved]);

  const handleSaveAndExit = useCallback(async () => {
    const saved = await saveChangeHandler();
    if (saved) {
      // Use handleSaveAndNavigate to properly handle navigation
      handleSaveAndNavigate(() => {
        if (isRefreshWarning) {
          window.location.reload();
        } else {
          router.push("/user");
        }
      });
    }
  }, [saveChangeHandler, handleSaveAndNavigate, isRefreshWarning, router]);

  // Keyboard shortcut for Ctrl+S
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if Ctrl+S is pressed (both Windows and Mac)
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.shiftKey &&
        (event.key === "s" || event.key === "S" || event.code === "KeyS")
      ) {
        // Prevent browser's default save dialog
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // Only save if not already saving
        if (!loading) {
          saveChangeHandler();
        }

        return false;
      }
    };

    // Add event listener with capture phase and passive false
    document.addEventListener("keydown", handleKeyDown, {
      capture: true,
      passive: false,
    });

    // Also add to window for extra coverage
    window.addEventListener("keydown", handleKeyDown, {
      capture: true,
      passive: false,
    });

    // Cleanup event listeners on component unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown, {
        capture: true,
        passive: false,
      });
      window.removeEventListener("keydown", handleKeyDown, {
        capture: true,
        passive: false,
      });
    };
  }, [loading, saveChangeHandler]); // Include saveChangeHandler in dependencies

  // Keyboard shortcut for G key - Toggle group mode
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if the target is not an input field
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Check if G key is pressed (without Ctrl, Meta, or Shift)
      if (
        (event.key === "g" || event.key === "G" || event.code === "KeyG") &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        // Check if there's a valid selection for group mode
        const hasMultipleSelection =
          selectedModelId === "ALL" ||
          (Array.isArray(selectedModelId) && selectedModelId.length > 1);

        if (hasMultipleSelection) {
          event.preventDefault();
          event.stopPropagation();
          setGroupMode(!groupMode);
        }
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown, {
      capture: true,
      passive: false,
    });

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown, {
        capture: true,
        passive: false,
      });
    };
  }, [selectedModelId, groupMode, setGroupMode]);

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
    if (selectedModelId === "ALL") {
      modelsToCopy = selectedModels.map((model) => ({
        ...model,
        action: "copy",
      }));
    } else if (Array.isArray(selectedModelId)) {
      modelsToCopy = selectedModels
        .filter((model) => selectedModelId.includes(model.id))
        .map((model) => ({ ...model, action: "copy" }));
    } else {
      const selectedModel = selectedModels.find(
        (model) => model.id === selectedModelId
      );
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

    if (selectedModelId === "ALL") {
      idsToCut = selectedModels.map((m) => m.id);
      modelsToCut = selectedModels.map((model) => ({
        ...model,
        action: "cut",
      }));
    } else if (Array.isArray(selectedModelId)) {
      idsToCut = [...selectedModelId];
      modelsToCut = selectedModels
        .filter((model) => selectedModelId.includes(model.id))
        .map((model) => ({ ...model, action: "cut" }));
    } else {
      idsToCut = [selectedModelId];
      const selectedModel = selectedModels.find(
        (model) => model.id === selectedModelId
      );
      if (selectedModel) {
        modelsToCut = [{ ...selectedModel, action: "cut" }];
      }
    }

    if (modelsToCut.length > 0) {
      setClipboardModels(modelsToCut);
      const { pushHistory } = useModelStore.getState();
      pushHistory();
      setSelectedModels(
        selectedModels.filter((model) => !idsToCut.includes(model.id))
      );
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
      toast.success(
        `حالت پیست فعال شد. ${clipboardModels.length} مدل آماده پیست است. روی محل مورد نظر کلیک کنید`,
        {
          duration: 3000,
          className: "text-sm rounded-2xl",
        }
      );
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
    <div className="w-full flex items-center justify-center bg-gray-200/40 dark:bg-gray-800/40">
      <AutoSave project={project} />

      <Toaster />

      <div className="w-full max-w-[1450px] h-16 px-4 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              reset({
                name: project?.name || "",
                description: project?.description || "",
              });
              setIsEditOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <h2 className="font-bold text-gray-700 dark:text-gray-200 text-lg">{project.name}</h2>
          </button>
        </div>

        {/* tools */}
        <div className="flex flex-row-reverse items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <Tooltip content="بارگذاری پروژه" placement="bottom" size="sm">
              <div className="bg-gray-200/90 dark:bg-gray-700/90 relative flex justify-center items-center size-9 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
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
                className="bg-gray-200/90 dark:bg-gray-700/90 flex justify-center items-center size-9 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
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
                className="bg-gray-200/90 dark:bg-gray-700/90 flex justify-center items-center size-9 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="bg-gray-200/90 dark:bg-gray-700/90 flex justify-center items-center size-9 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    : "bg-gray-200/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor"
                }`}
              >
                <i className="fi fi-rr-paste size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="ذخیره (Ctrl+S)" placement="bottom" size="sm">
              <button
                title="ذخیره (Ctrl+S)"
                onClick={saveChangeHandler}
                disabled={loading}
                className="bg-gray-200/90 dark:bg-gray-700/90 flex justify-center items-center size-9 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
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
            <Tooltip content="راهنما" placement="bottom" size="sm">
              <button
                onClick={(e) => setShowHelp(true)}
                className="bg-gray-200/90 dark:bg-gray-700/90 flex justify-center items-center size-9 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
              >
                <i className="fi fi-rr-interrogation block size-4"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="واگرد" placement="bottom" size="sm">
              <button
                onClick={undo}
                className="bg-gray-200/90 dark:bg-gray-700/90 flex justify-center items-center size-9 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
              >
                <i className="fi fi fi fi-rr-undo-alt size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="از نو" placement="bottom" size="sm">
              <button
                onClick={redo}
                className="bg-gray-200/90 dark:bg-gray-700/90 flex justify-center items-center size-9 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
              >
                <i className="fi fi-rr-redo-alt size-4 block"></i>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* other tools */}
        <div className="flex items-end gap-3">
          {/* Color Picker Button */}
          <div className="flex flex-col items-center gap-1">
            <Tooltip content="انتخاب رنگ مدل" placement="bottom" size="sm">
              <button
                onClick={() => setShowColorPanel(!showColorPanel)}
                disabled={!selectedModelId}
                className={`flex justify-center items-center size-9 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  showColorPanel && selectedModelId
                    ? "bg-primaryThemeColor text-white"
                    : "bg-gray-200/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor"
                }`}
              >
                <i className="fi fi-rr-palette size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip
              content="عدم خروج مدل‌ها از صفحه"
              placement="bottom"
              size="sm"
            >
              <button
                onClick={() => setConstrainToGrid(!constrainToGrid)}
                className={`flex justify-center items-center size-9 rounded-xl transition-all duration-300 ${
                  constrainToGrid
                    ? "bg-primaryThemeColor text-white"
                    : "bg-gray-200/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor"
                }`}
              >
                <i className="fi fi-rr-square-l -scale-y-100 size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="حالت گروهی (G)" placement="bottom" size="sm">
              <button
                onClick={() => setGroupMode(!groupMode)}
                disabled={!selectedModelId || (selectedModelId !== 'ALL' && (!Array.isArray(selectedModelId) || selectedModelId.length < 2))}
                className={`flex justify-center items-center size-9 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  groupMode
                    ? "bg-primaryThemeColor text-white"
                    : "bg-gray-200/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor"
                }`}
              >
                <i className="fi fi-rr-users size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="یادداشت" placement="bottom" size="sm">
              <button className="bg-gray-200/90 dark:bg-gray-700/90 flex justify-center items-center size-9 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
                <i className="fi fi-rr-journal-alt size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="اسکرین شات" placement="bottom" size="sm">
              <button
                onClick={getScreenShotHandler}
                className="bg-gray-200/90 dark:bg-gray-700/90 flex justify-center items-center size-9 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
              >
                <i className="fi fi-sr-mode-landscape size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="اشتراک" placement="bottom" size="sm">
              <button className="bg-gray-200/90 dark:bg-gray-700/90 flex justify-center items-center size-9 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
                <i className="fi fi-rr-share-square size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="حذف" placement="bottom" size="sm">
              <button
                onClick={deleteModelHandler}
                className="bg-gray-200/90 dark:bg-gray-700/90 flex justify-center items-center size-9 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300"
              >
                <i className="fi fi-rr-trash size-4 block"></i>
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Tooltip content="خروج از استودیو" placement="bottom" size="sm">
              <button
                onClick={() => {
                  triggerWarningModal(() => router.push("/user"));
                }}
                className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex justify-center items-center size-9 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-300"
              >
                <i className="fi fi-rr-exit size-4 block"></i>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      <UnsavedChangesWarningModal
        isOpen={showWarningModal}
        onClose={handleCancel}
        onDiscard={handleDiscard}
        onSave={handleSaveAndExit}
        isLoading={loading}
        isRefreshWarning={isRefreshWarning}
      />

      {/* Help Modal */}
      <Modal
        isOpen={showHelp}
        onOpenChange={setShowHelp}
        placement="center"
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="font-bold text-center text-gray-900 dark:text-gray-100">
            راهنمای شورت کات‌های کیبورد
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Operations */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2">
                  عملیات پایه
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>ذخیره پروژه</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Ctrl+S
                    </kbd>
                  </div>
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>کپی مدل</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Ctrl+C
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>کات مدل</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Ctrl+X
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>پیست مدل</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Ctrl+V
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>تکثیر مدل</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Ctrl+D
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>حذف مدل</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Delete
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Selection & Movement */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2">
                  انتخاب و حرکت
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>انتخاب مدل</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Left Click
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>انتخاب همه</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Ctrl+A
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>انتخاب/لغو انتخاب چندتایی</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Ctrl + Left Click
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>کشیدن مدل</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Left Click + Drag
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>لغو انتخاب</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Escape
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>حالت گروهی</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      G
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>حرکت بالا</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      ↑
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>حرکت پایین</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      ↓
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>حرکت چپ</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      ←
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>حرکت راست</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      →
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>حرکت دقیق (با Shift)</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Shift + ↑↓←→
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Camera Controls */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2">
                  کنترل دوربین
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>زوم این</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      +
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>زوم اوت</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      -
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>کنترل دوربین</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Space
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Future Features */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2">
                  ویرایش‌ها
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Undo</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Ctrl+Z
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Redo</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
                      Ctrl+Shift+Z
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowHelp(false)}>
              بستن
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="font-bold text-gray-900 dark:text-gray-100">ویرایش پروژه</ModalHeader>
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
