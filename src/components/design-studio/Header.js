"use client";

import { useUserStore } from "@/store/UserInfo";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useRouter, useParams } from "next/navigation";
import { postData } from "@/services/API";
import useModelStore from "@/store/useModelStore";
import toast, { Toaster } from "react-hot-toast";
import useUnsavedChangesWarning from "@/hooks/useUnsavedChangesWarning";
import UnsavedChangesWarningModal from "./UnsavedChangesWarningModal";
import { useTheme } from "@/lib/ThemeProvider";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

const Header = () => {
  const { user } = useUserStore();
  const { settings } = useSettings();
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const { selectedModels, markChangesAsSaved, unsavedChanges, hasUnsavedChanges } = useModelStore();
  const { theme, toggleTheme, mounted } = useTheme();
  
  const {
    showWarningModal,
    isRefreshWarning,
    handleCancel,
    handleDiscard,
    triggerWarningModal,
    handleSaveAndNavigate,
  } = useUnsavedChangesWarning();

  
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
        const file = new File([imageBlob], `project-${Date.now()}.png`, {
          type: "image/png",
        });
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
  }, [id, selectedModels, markChangesAsSaved]);

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

  return (
    <div className="w-full bg-white dark:bg-gray-900 flex justify-center items-center border-b dark:border-gray-800">
      <Toaster />
      <div className="w-full h-20 max-w-[1450px] px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src={user.profilePicture || "/assets/avatar.png"}
            width={150}
            height={150}
            className="size-6 lg:size-8 text-xs rounded-full scale-150"
            alt="avatar"
          />

          <div className="flex flex-col gap-0.5">
            <h2 className="font-black text-sm md:text-base text-gray-700 dark:text-gray-200">
              {user.fullName}
            </h2>
            <p className="text-xs text-gray-700 dark:text-gray-300">خوش آمدید</p>
          </div>
        </div>

        <h1 className="hidden md:block text-2xl font-semibold text-primaryThemeColor">
          {settings.siteName || "سازک"}
        </h1>

        <div className="flex items-center gap-4">
          {/* Dark mode toggle button */}
          {mounted && (
            <Button
              onPress={toggleTheme}
              isIconOnly
              className="bg-white dark:bg-gray-800 size-10 border dark:border-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center rounded-2xl hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-all duration-300"
              aria-label="Toggle dark mode"
            >
              <Icon
                icon={
                  theme === "dark"
                    ? "solar:sun-bold"
                    : "solar:moon-stars-bold"
                }
                width="20"
                height="20"
              />
            </Button>
          )}

          <button
            onClick={() => {
              triggerWarningModal(() => router.push("/user"));
            }}
          >
            <Image
              src={settings.logo || "/assets/logo.png"}
              width={150}
              height={150}
              className="size-7 lg:size-8 rounded-full scale-150"
              alt={settings.siteName || "site logo"}
            />
          </button>
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
    </div>
  );
};

export default Header;
