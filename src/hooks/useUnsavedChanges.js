"use client";

/**
 * Custom hook to handle unsaved changes detection and warning modal
 *
 * Features:
 * - Detects changes in selectedModels compared to initial project state
 * - Shows warning modal when user tries to navigate away with unsaved changes
 * - Handles browser close/refresh with beforeunload event
 * - Provides save and discard options
 * - Updates initial state after successful save
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import useModelStore from "@/store/useModelStore";
import { postData } from "@/services/API";
import toast from "react-hot-toast";

const useUnsavedChanges = (project) => {
  const [showWarning, setShowWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const router = useRouter();
  const { selectedModels } = useModelStore();
  const initialModelsRef = useRef(null);
  const hasUnsavedChangesRef = useRef(false);

  // Initialize with project data
  useEffect(() => {
    if (project?.objects) {
      initialModelsRef.current = JSON.stringify(project.objects);
      hasUnsavedChangesRef.current = false;
    }
  }, [project?._id]);

  // Update initial state when project objects change (from server)
  useEffect(() => {
    if (project?.objects && initialModelsRef.current) {
      const currentInitial = JSON.stringify(project.objects);
      if (currentInitial !== initialModelsRef.current) {
        initialModelsRef.current = currentInitial;
        hasUnsavedChangesRef.current = false;
      }
    }
  }, [project?.objects]);

  // Check for unsaved changes
  const checkForUnsavedChanges = useCallback(() => {
    if (!initialModelsRef.current) {
      return false;
    }

    const currentModels = JSON.stringify(selectedModels);
    const hasChanges = currentModels !== initialModelsRef.current;
    hasUnsavedChangesRef.current = hasChanges;

    return hasChanges;
  }, [selectedModels]);

  // Save changes function
  const saveChanges = useCallback(async () => {
    if (!project?._id) {
      return false;
    }

    setIsSaving(true);
    try {
      const canvas = document.querySelector(".design-studio canvas");
      let imageBlob = null;

      if (canvas) {
        imageBlob = await new Promise((resolve) =>
          canvas.toBlob((blob) => resolve(blob), "image/png")
        );
      }

      const form = new FormData();
      form.append("projectId", project._id);
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

      // Update the initial state after successful save
      initialModelsRef.current = JSON.stringify(selectedModels);
      hasUnsavedChangesRef.current = false;

      toast.success("تغییرات با موفقیت ذخیره شدند", {
        duration: 2000,
        className: "text-sm rounded-2xl",
      });

      return true;
    } catch (error) {
      console.log("Save error:", error);
      toast.error("خطا هنگام ذخیره تغییرات", {
        duration: 3000,
        className: "text-sm rounded-2xl",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [project, selectedModels]);

  // Handle navigation with warning
  const handleNavigation = useCallback(
    (url) => {
      if (checkForUnsavedChanges()) {
        setPendingNavigation(url);
        setShowWarning(true);
      } else {
        router.push(url);
      }
    },
    [checkForUnsavedChanges, router]
  );

  // Handle save and continue
  const handleSaveAndContinue = useCallback(async () => {
    const saved = await saveChanges();
    if (saved) {
      setShowWarning(false);
      if (pendingNavigation) {
        router.push(pendingNavigation);
        setPendingNavigation(null);
      } else {
        // If no pending navigation, go to user page
        router.push("/user");
      }
    }
  }, [saveChanges, pendingNavigation, router]);

  // Handle discard changes
  const handleDiscardChanges = () => {
    setShowWarning(false);
    router.push("/user");
  };

  // Handle browser close/refresh - show browser dialog
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (checkForUnsavedChanges()) {
        event.preventDefault();
        event.returnValue =
          "تغییرات ذخیره نشده‌ای دارید. آیا مطمئن هستید که می‌خواهید صفحه را ترک کنید؟";
        return event.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [checkForUnsavedChanges]);

  // Handle keyboard and navigation shortcuts (but NOT tab/app switching)
  useEffect(() => {
    // Handle keyboard shortcuts (keep navigation keys, let hard refresh trigger native beforeunload)
    const handleKeyDown = (event) => {
      // Ctrl+W for close tab
      if (event.ctrlKey && event.key === "w") {
        if (checkForUnsavedChanges()) {
          event.preventDefault();
          setShowWarning(true);
        }
      }
      // Alt+Left Arrow for back button
      if (event.altKey && event.key === "ArrowLeft") {
        if (checkForUnsavedChanges()) {
          event.preventDefault();
          setShowWarning(true);
        }
      }
    };

    // Handle mouse back button (browser back button)
    const handleMouseBack = (event) => {
      if (event.button === 3 && checkForUnsavedChanges()) { // Mouse back button
        event.preventDefault();
        setShowWarning(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseBack);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseBack);
    };
  }, [checkForUnsavedChanges]);

  // Handle navigation clicks and router changes
  useEffect(() => {
    const handleLinkClick = (event) => {
      const target = event.target.closest("a[href]");
      if (!target) return;

      const href = target.getAttribute("href");

      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      // Check if it's an internal link
      if (href.startsWith("/") && !href.startsWith("//")) {
        if (checkForUnsavedChanges()) {
          event.preventDefault();
          event.stopPropagation();
          setPendingNavigation(href);
          setShowWarning(true);
          return false;
        }
      }
    };

    // Handle browser back/forward buttons
    const handlePopState = (event) => {
      console.log('Back button pressed, checking for unsaved changes...');
      if (checkForUnsavedChanges()) {
        console.log('Unsaved changes detected, showing modal');
        // Push the current state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
        setShowWarning(true);
      }
    };

    // Add a dummy state to enable popstate detection
    window.history.pushState({ preventBack: true }, "", window.location.href);

    // Override router.push to check for unsaved changes
    const originalPush = router.push;
    router.push = (url, options) => {
      if (checkForUnsavedChanges()) {
        setPendingNavigation(url);
        setShowWarning(true);
        return Promise.resolve();
      }
      return originalPush(url, options);
    };

    // Override router.replace as well
    const originalReplace = router.replace;
    router.replace = (url, options) => {
      if (checkForUnsavedChanges()) {
        setPendingNavigation(url);
        setShowWarning(true);
        return Promise.resolve();
      }
      return originalReplace(url, options);
    };

    document.addEventListener("click", handleLinkClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
      window.removeEventListener("popstate", handlePopState);
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [checkForUnsavedChanges, router]);

  return {
    showWarning,
    setShowWarning,
    isSaving,
    handleSaveAndContinue,
    handleDiscardChanges,
    handleNavigation,
    hasUnsavedChanges: hasUnsavedChangesRef.current,
    setPendingNavigation,
    checkForUnsavedChanges,
  };
};

export default useUnsavedChanges;
