"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import useModelStore from "@/store/useModelStore";

let activeModalOwnerId = null;

const useUnsavedChangesWarning = () => {
  const { unsavedChanges, hasUnsavedChanges } = useModelStore();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isRefreshWarning, setIsRefreshWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const isNavigatingRef = useRef(false);
  const isModalOpeningRef = useRef(false);
  const stateRef = useRef({ hasUnsavedChanges, unsavedChanges });
  const instanceIdRef = useRef(Symbol("unsavedChangesWarningInstance"));
  const historyEntryCountRef = useRef(0);

  useEffect(() => {
    stateRef.current = { hasUnsavedChanges, unsavedChanges };
  }, [hasUnsavedChanges, unsavedChanges]);

  const requestModalOwnership = useCallback(() => {
    if (activeModalOwnerId && activeModalOwnerId !== instanceIdRef.current) {
      return false;
    }
    activeModalOwnerId = instanceIdRef.current;
    return true;
  }, []);

  const releaseModalOwnership = useCallback(() => {
    if (activeModalOwnerId === instanceIdRef.current) {
      activeModalOwnerId = null;
    }
  }, []);

  const incrementHistoryEntryCount = useCallback(() => {
    historyEntryCountRef.current += 1;
  }, []);

  const resetHistoryEntryCount = useCallback(() => {
    historyEntryCountRef.current = 0;
  }, []);

  const checkForUnsavedChanges = useCallback(() => {
    const state = stateRef.current;
    return state.hasUnsavedChanges || (state.unsavedChanges && state.unsavedChanges.length > 0);
  }, []);

  useEffect(() => {
    return () => {
      releaseModalOwnership();
    };
  }, [releaseModalOwnership]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    // Always register popstate listener to catch back button early
    const handlePopState = (event) => {
      // Don't show modal if we're already navigating (user clicked discard)
      if (isNavigatingRef.current) {
        isNavigatingRef.current = false;
        return;
      }
      
      // Don't show modal if it's already opening or showing
      if (isModalOpeningRef.current || showWarningModal) {
        return;
      }
      
      // Get fresh state from store
      const storeState = useModelStore.getState();
      const hasChanges = storeState.hasUnsavedChanges || (storeState.unsavedChanges && storeState.unsavedChanges.length > 0);
      
      // Only show modal if not already showing and there are changes
      if (hasChanges) {
        if (!requestModalOwnership()) {
          return;
        }
        isModalOpeningRef.current = true;
        // Push state to prevent actual navigation
        window.history.pushState({ unsavedChangesWarning: true }, "", window.location.href);
        incrementHistoryEntryCount();
        setShowWarningModal(true);
        setIsRefreshWarning(false);
        setTimeout(() => {
          isModalOpeningRef.current = false;
        }, 100);
      }
    };

    const handleBeforeUnload = (event) => {
      const state = stateRef.current;
      const hasChanges = state.hasUnsavedChanges || (state.unsavedChanges && state.unsavedChanges.length > 0);
      if (hasChanges && !showWarningModal) {
        event.preventDefault();
        event.returnValue =
          "تغییرات ذخیره نشده‌ای دارید. آیا مطمئن هستید که می‌خواهید صفحه را ترک کنید؟";
        return event.returnValue;
      }
    };

    // Register popstate listener immediately
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Update history state when changes occur
    const hasChanges = checkForUnsavedChanges();
    if (hasChanges && !window.history.state?.unsavedChangesWarning) {
      window.history.pushState({ unsavedChangesWarning: true }, "", window.location.href);
      incrementHistoryEntryCount();
    } else if (!hasChanges && window.history.state?.unsavedChangesWarning) {
      // If no changes, remove the warning state without navigating
      window.history.replaceState(null, "", window.location.href);
    }

    const handleKeyDown = (event) => {
      // Get fresh state from store
      const storeState = useModelStore.getState();
      const hasChanges = storeState.hasUnsavedChanges || (storeState.unsavedChanges && storeState.unsavedChanges.length > 0);
      
      const isF5 = event.key === "F5" || event.code === "F5";
      const isCtrlR = (event.ctrlKey || event.metaKey) && (event.key === "r" || event.key === "R" || event.code === "KeyR");
      
      if ((isF5 || isCtrlR) && hasChanges && !isModalOpeningRef.current && !showWarningModal) {
        if (!requestModalOwnership()) {
          return false;
        }
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        isModalOpeningRef.current = true;
        setPendingAction(() => () => window.location.reload());
        setIsRefreshWarning(true);
        setShowWarningModal(true);
        setTimeout(() => {
          isModalOpeningRef.current = false;
        }, 100);
        
        return false;
      }
    };
    
    const options = { capture: true, passive: false };
    window.addEventListener("keydown", handleKeyDown, options);
    document.addEventListener("keydown", handleKeyDown, options);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown, options);
      document.removeEventListener("keydown", handleKeyDown, options);
    };
  }, [showWarningModal, requestModalOwnership, incrementHistoryEntryCount]);

  // Separate effect to update history state when changes occur
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const hasChanges = checkForUnsavedChanges();
    if (hasChanges && !window.history.state?.unsavedChangesWarning) {
      window.history.pushState({ unsavedChangesWarning: true }, "", window.location.href);
    } else if (!hasChanges && window.history.state?.unsavedChangesWarning) {
      // If no changes, remove the warning state without navigating
      window.history.replaceState(null, "", window.location.href);
    }
  }, [hasUnsavedChanges, unsavedChanges, checkForUnsavedChanges, incrementHistoryEntryCount]);

  const handleCancel = useCallback(() => {
    if (isRefreshWarning) {
      return;
    }
    isModalOpeningRef.current = false;
    releaseModalOwnership();
    setShowWarningModal(false);
    setIsRefreshWarning(false);
    setPendingAction(null);
  }, [isRefreshWarning, releaseModalOwnership]);

  const handleSaveAndNavigate = useCallback((navigateFn) => {
    // Set flag to prevent popstate from interfering
    isNavigatingRef.current = true;
    isModalOpeningRef.current = false;
    releaseModalOwnership();
    
    // Close modal
    setShowWarningModal(false);
    setIsRefreshWarning(false);
    setPendingAction(null);
    
    // Navigate after a short delay
    setTimeout(() => {
      if (navigateFn) {
        navigateFn();
      }
    }, 50);
  }, [releaseModalOwnership]);

  const handleDiscard = useCallback(() => {
    isModalOpeningRef.current = false;
    releaseModalOwnership();
    setShowWarningModal(false);
    setIsRefreshWarning(false);
    
    // Set flag to prevent popstate from showing modal again
    isNavigatingRef.current = true;
    
    // Clear unsaved changes before navigation to prevent popstate from triggering again
    const { markChangesAsSaved } = useModelStore.getState();
    markChangesAsSaved();
    
    if (pendingAction) {
      pendingAction();
    } else if (isRefreshWarning) {
      if (window.history.state?.unsavedChangesWarning) {
        window.history.replaceState(null, "", window.location.href);
      }
      window.location.reload();
    } else {
      const steps = historyEntryCountRef.current + 1;
      resetHistoryEntryCount();
      window.history.go(-steps);
    }
    setPendingAction(null);
  }, [pendingAction, isRefreshWarning, releaseModalOwnership, resetHistoryEntryCount]);

  const triggerWarningModal = useCallback((action) => {
    if (checkForUnsavedChanges()) {
      if (isModalOpeningRef.current || showWarningModal) {
        return;
      }
      if (!requestModalOwnership()) {
        return;
      }
      isModalOpeningRef.current = true;
      setIsRefreshWarning(false);
      setPendingAction(() => action);
      setShowWarningModal(true);
      setTimeout(() => {
        isModalOpeningRef.current = false;
      }, 100);
    } else if (action) {
      action();
    }
  }, [checkForUnsavedChanges, showWarningModal, requestModalOwnership]);

  return {
    showWarningModal,
    isRefreshWarning,
    handleCancel,
    handleDiscard,
    triggerWarningModal,
    checkForUnsavedChanges,
    handleSaveAndNavigate,
    setShowWarningModal,
    setIsRefreshWarning,
    setPendingAction,
  };
};

export default useUnsavedChangesWarning;

