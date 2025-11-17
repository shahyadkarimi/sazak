"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import useModelStore from "@/store/useModelStore";

const useBrowserWarning = (project) => {
  const { selectedModels } = useModelStore();
  const initialModelsRef = useRef(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isRefreshWarning, setIsRefreshWarning] = useState(false);
  const pendingNavigationRef = useRef(null);
  const hasPushedStateRef = useRef(false);
  const shouldShowModalRef = useRef(false);

  useEffect(() => {
    if (project?.objects) {
      initialModelsRef.current = JSON.stringify(project.objects);
    }
  }, [project?._id]);

  useEffect(() => {
    if (project?.objects && initialModelsRef.current) {
      const currentInitial = JSON.stringify(project.objects);
      if (currentInitial !== initialModelsRef.current) {
        initialModelsRef.current = currentInitial;
      }
    }
  }, [project?.objects]);

  const checkForUnsavedChanges = useCallback(() => {
    if (!initialModelsRef.current) {
      return false;
    }

    const currentModels = JSON.stringify(selectedModels);
    return currentModels !== initialModelsRef.current;
  }, [selectedModels]);

  const markAsSaved = useCallback(() => {
    initialModelsRef.current = JSON.stringify(selectedModels);
    hasPushedStateRef.current = false;
  }, [selectedModels]);

  useEffect(() => {
    const checkModal = () => {
      if (shouldShowModalRef.current && !showWarningModal) {
        setIsRefreshWarning(true);
        setShowWarningModal(true);
        shouldShowModalRef.current = false;
      }
    };

    const intervalId = setInterval(checkModal, 100);

    return () => clearInterval(intervalId);
  }, [showWarningModal]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldShowModalRef.current && !showWarningModal) {
        setIsRefreshWarning(true);
        setShowWarningModal(true);
        shouldShowModalRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [showWarningModal]);

  useEffect(() => {
    const hasUnsaved = checkForUnsavedChanges();

    const handleBeforeUnload = (event) => {
      if (checkForUnsavedChanges() && !showWarningModal) {
        shouldShowModalRef.current = true;
        event.preventDefault();
        event.returnValue =
          "تغییرات ذخیره نشده‌ای دارید. آیا مطمئن هستید که می‌خواهید صفحه را ترک کنید؟";
        return event.returnValue;
      }
    };

    const handlePopState = (event) => {
      if (checkForUnsavedChanges()) {
        window.history.pushState(null, "", window.location.href);
        setShowWarningModal(true);
      }
    };

    const handleKeyDown = (event) => {
      if (!checkForUnsavedChanges()) return;
      
      const isF5 = event.key === "F5" || event.code === "F5";
      const isCtrlR = (event.ctrlKey || event.metaKey) && (event.key === "r" || event.key === "R" || event.code === "KeyR");
      
      if (isF5 || isCtrlR) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setIsRefreshWarning(true);
        setShowWarningModal(true);
        return false;
      }
    };

    if (hasUnsaved && !hasPushedStateRef.current) {
      window.history.pushState(null, "", window.location.href);
      hasPushedStateRef.current = true;
    } else if (!hasUnsaved) {
      hasPushedStateRef.current = false;
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("keydown", handleKeyDown, { capture: true, passive: false });
    window.addEventListener("keydown", handleKeyDown, { capture: true, passive: false });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [checkForUnsavedChanges, showWarningModal]);

  const handleCancel = useCallback(() => {
    setShowWarningModal(false);
    setIsRefreshWarning(false);
    shouldShowModalRef.current = false;
    pendingNavigationRef.current = null;
  }, []);

  const handleDiscardRefresh = useCallback(() => {
    setShowWarningModal(false);
    setIsRefreshWarning(false);
    window.location.reload();
  }, []);

  return {
    markAsSaved,
    showWarningModal,
    isRefreshWarning,
    handleCancel,
    handleDiscardRefresh,
  };
};

export default useBrowserWarning;

