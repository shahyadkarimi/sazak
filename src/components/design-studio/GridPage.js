"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import useModelStore from "@/store/useModelStore";
import Model from "./Model";
import ModelPlacer from "./ModelPlacer";
import CustomGrid from "../home/CustomGrid";
import ViewCube from "../home/ViewCube";
import {
  Checkbox,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { postData } from "@/services/API";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { toFarsiNumber } from "@/helper/helper";

const ZoomController = () => {
  const { camera } = useThree();
  const zoomLevel = useModelStore((state) => state.zoomLevel);
  const { zoomIn, zoomOut } = useModelStore();

  useEffect(() => {
    if (!camera) return;
    camera.fov = zoomLevel;
    camera.updateProjectionMatrix();
  }, [camera, zoomLevel]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Check if the target is not an input field
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomIn();
      } else if (event.key === "-") {
        event.preventDefault();
        zoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [zoomIn, zoomOut]);

  return null;
};

const KeyboardController = ({ onShowHelp }) => {
  const selectedModelId = useModelStore((state) => state.selectedModelId);
  const selectedModels = useModelStore((state) => state.selectedModels);
  const setSelectedModelId = useModelStore((state) => state.setSelectedModelId);
  const setSelectedModels = useModelStore((state) => state.setSelectedModels);
  const clipboardModel = useModelStore((state) => state.clipboardModel);
  const setClipboardModel = useModelStore((state) => state.setClipboardModel);
  const isPasteMode = useModelStore((state) => state.isPasteMode);
  const setIsPasteMode = useModelStore((state) => state.setIsPasteMode);
  const pushHistory = useModelStore((state) => state.pushHistory);
  const undo = useModelStore((state) => state.undo);
  const redo = useModelStore((state) => state.redo);

  // Copy selected model
  const copyModel = () => {
    if (!selectedModelId) return;

    // Resolve a single model to copy from current selection (supports 'ALL' and arrays)
    let targetId = null;
    if (selectedModelId === 'ALL') {
      targetId = selectedModels[0]?.id || null;
    } else if (Array.isArray(selectedModelId)) {
      targetId = selectedModelId[0] || null;
    } else {
      targetId = selectedModelId;
    }

    const selectedModel = targetId
      ? selectedModels.find((model) => model.id === targetId)
      : null;
    if (selectedModel) {
      // Snapshot even though copy doesn't mutate models, as requested
      pushHistory();
      setClipboardModel({ ...selectedModel, action: "copy" });
      toast.success("مدل کپی شد", {
        duration: 2000,
        className: "text-sm rounded-2xl",
      });
    }
  };

  // Cut selected model
  const cutModel = () => {
    if (!selectedModelId) return;

    // Determine IDs to cut and the clipboard source
    let idsToCut = [];
    if (selectedModelId === 'ALL') {
      idsToCut = selectedModels.map((m) => m.id);
    } else if (Array.isArray(selectedModelId)) {
      idsToCut = [...selectedModelId];
    } else {
      idsToCut = [selectedModelId];
    }

    const clipboardSourceId = idsToCut[0] || null;
    const clipboardSource = clipboardSourceId
      ? selectedModels.find((m) => m.id === clipboardSourceId)
      : null;
    if (clipboardSource) {
      setClipboardModel({ ...clipboardSource, action: "cut" });
    }

    pushHistory();
    setSelectedModels(selectedModels.filter((model) => !idsToCut.includes(model.id)));
    setSelectedModelId(null);
    toast.success("انتخاب حذف و در کلیپ‌بورد قرار گرفت", {
      duration: 2000,
      className: "text-sm rounded-2xl",
    });
  };

  // Toggle paste mode
  const togglePasteMode = () => {
    if (!clipboardModel) return;

    setIsPasteMode(!isPasteMode);
    if (!isPasteMode) {
      toast.success("حالت پیست فعال شد. روی محل مورد نظر کلیک کنید", {
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

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Check if the target is not an input field
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Ctrl+C - Copy selected model (use code for layout-agnostic)
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyC") {
        event.preventDefault();
        copyModel();
      }

      // Ctrl+X - Cut selected model
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyX") {
        event.preventDefault();
        cutModel();
      }

      // Ctrl+V - Toggle paste mode
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyV") {
        event.preventDefault();
        togglePasteMode();
      }

      // Delete key - delete selected model(s)
      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedModelId) {
          event.preventDefault();
          pushHistory();
          if (selectedModelId === 'ALL') {
            setSelectedModels([]);
            setSelectedModelId(null);
          } else if (Array.isArray(selectedModelId)) {
            setSelectedModels(
              selectedModels.filter((model) => !selectedModelId.includes(model.id))
            );
            setSelectedModelId(null);
          } else {
            setSelectedModels(
              selectedModels.filter((model) => model.id !== selectedModelId)
            );
            setSelectedModelId(null);
          }
        }
      }

      // Ctrl+A - select all models (prevent browser Select All)
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyA") {
        event.preventDefault();
        event.stopPropagation();
        if (selectedModels.length > 0) {
          setSelectedModelId('ALL');
        }
        return;
      }

      // Ctrl+D - Duplicate selected model
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyD") {
        event.preventDefault();
        if (selectedModelId) {
          const selectedModel = selectedModels.find(
            (model) => model.id === selectedModelId
          );
          if (selectedModel) {
            const newModel = {
              ...selectedModel,
              id: Date.now().toString(),
              position: [
                selectedModel.position[0] + 1,
                selectedModel.position[1],
                selectedModel.position[2] + 1,
              ],
            };
            pushHistory();
            setSelectedModels([...selectedModels, newModel]);
            setSelectedModelId(newModel.id);
            toast.success("مدل تکثیر شد (Ctrl+D)", {
              duration: 2000,
              className: "text-sm rounded-2xl",
            });
          }
        }
      }

      // Ctrl+Z - Undo
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyZ" && !event.shiftKey) {
        event.preventDefault();
        undo();
      }

      // Ctrl+Shift+Z - Redo
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyZ" && event.shiftKey) {
        event.preventDefault();
        redo();
      }

      // Space - Toggle orbit controls (placeholder)
      if (event.key === " ") {
        event.preventDefault();
        toast.info("قابلیت کنترل دوربین به زودی اضافه خواهد شد", {
          duration: 2000,
          className: "text-sm rounded-2xl",
        });
      }

      // Arrow keys - Move selected model(s)
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        if (selectedModelId) {
          event.preventDefault();
          pushHistory();
          const moveStep = event.shiftKey ? 0.5 : 1; // Shift for smaller steps
          const applyDelta = (pos) => {
            const np = [...pos];
            switch (event.key) {
              case "ArrowUp":
                np[2] -= moveStep;
                break;
              case "ArrowDown":
                np[2] += moveStep;
                break;
              case "ArrowLeft":
                np[0] -= moveStep;
                break;
              case "ArrowRight":
                np[0] += moveStep;
                break;
            }
            return np;
          };

          if (selectedModelId === 'ALL') {
            setSelectedModels(
              selectedModels.map((model) => ({ ...model, position: applyDelta(model.position) }))
            );
          } else if (Array.isArray(selectedModelId)) {
            setSelectedModels(
              selectedModels.map((model) =>
                selectedModelId.includes(model.id)
                  ? { ...model, position: applyDelta(model.position) }
                  : model
              )
            );
          } else {
            const selectedModel = selectedModels.find(
              (model) => model.id === selectedModelId
            );
            if (selectedModel) {
              const newPosition = applyDelta(selectedModel.position);
              setSelectedModels(
                selectedModels.map((model) =>
                  model.id === selectedModelId
                    ? { ...model, position: newPosition }
                    : model
                )
              );
            }
          }
        }
      }

      // F1 - Show help modal
      if (event.key === "F1") {
        event.preventDefault();
        onShowHelp(true);
      }

      // Escape - deselect all and exit paste mode
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedModelId(null);
        if (isPasteMode) {
          setIsPasteMode(false);
          toast.success("حالت پیست غیرفعال شد", {
            duration: 2000,
            className: "text-sm rounded-2xl",
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    selectedModelId,
    selectedModels,
    setSelectedModelId,
    setSelectedModels,
    clipboardModel,
    setClipboardModel,
    isPasteMode,
    setIsPasteMode,
    onShowHelp,
  ]);

  return null;
};

const PasteHandler = () => {
  const { camera, gl } = useThree();
  const isPasteMode = useModelStore((state) => state.isPasteMode);
  const setIsPasteMode = useModelStore((state) => state.setIsPasteMode);
  const clipboardModel = useModelStore((state) => state.clipboardModel);
  const setSelectedModels = useModelStore((state) => state.setSelectedModels);
  const setSelectedModelId = useModelStore((state) => state.setSelectedModelId);
  const selectedModels = useModelStore((state) => state.selectedModels);
  const pushHistory = useModelStore((state) => state.pushHistory);

  const handlePaste = (event) => {
    if (!isPasteMode || !clipboardModel) return;

    // Get intersection point on the ground plane
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Get mouse position relative to canvas
    const rect = gl.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Intersect with ground plane (y = 0)
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectionPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersectionPoint);

    if (intersectionPoint) {
      // Create new model at clicked position
      const newModel = {
        ...clipboardModel,
        id: Date.now().toString(),
        position: [intersectionPoint.x, 0, intersectionPoint.z],
      };

      pushHistory();
      setSelectedModels([...selectedModels, newModel]);
      setSelectedModelId(newModel.id);
      setIsPasteMode(false);

      toast.success("مدل در موقعیت جدید قرار گرفت", {
        duration: 2000,
        className: "text-sm rounded-2xl",
      });
    }
  };

  useEffect(() => {
    if (!isPasteMode) return;

    const handleClick = (event) => {
      handlePaste(event);
    };

    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [
    isPasteMode,
    clipboardModel,
    camera,
    gl,
    selectedModels,
    setSelectedModels,
    setSelectedModelId,
    setIsPasteMode,
  ]);

  return null;
};

const CameraAnimator = ({ targetView, controlsRef, durationMs = 450 }) => {
  const { camera } = useThree();
  const startRef = useRef(null);
  const endRef = useRef(null);
  const startTimeRef = useRef(0);
  const animatingRef = useRef(false);

  useEffect(() => {
    if (!targetView || !camera) return;
    if (!Array.isArray(targetView.camera)) return;

    // Immediate set (used for drag on view cube)
    if (targetView.immediate) {
      camera.position.set(
        targetView.camera[0],
        targetView.camera[1],
        targetView.camera[2]
      );
      if (targetView.fov) {
        camera.fov = targetView.fov;
        camera.updateProjectionMatrix();
      }
      camera.lookAt(0, 0, 0);
      if (controlsRef && controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
      animatingRef.current = false;
      return;
    }

    // Animated transition for clicks
    startRef.current = camera.position.clone();
    endRef.current = new THREE.Vector3(
      targetView.camera[0],
      targetView.camera[1],
      targetView.camera[2]
    );
    startTimeRef.current = performance.now();
    animatingRef.current = true;

    if (targetView.fov) {
      camera.fov = targetView.fov;
      camera.updateProjectionMatrix();
    }
  }, [targetView, camera, controlsRef]);

  useFrame(() => {
    if (!animatingRef.current || !startRef.current || !endRef.current) return;
    const now = performance.now();
    const t = Math.min(1, (now - startTimeRef.current) / durationMs);
    // easeInOutCubic
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const next = new THREE.Vector3().lerpVectors(
      startRef.current,
      endRef.current,
      ease
    );
    camera.position.copy(next);
    camera.lookAt(0, 0, 0);
    if (controlsRef && controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
    if (t === 1) {
      animatingRef.current = false;
    }
  });

  return null;
};

const GridPage = ({ project }) => {
  const selectedModels = useModelStore((state) => state.selectedModels);
  const isAdjustingHeight = useModelStore((state) => state.isAdjustingHeight);
  const setSelectedModelId = useModelStore((state) => state.setSelectedModelId);
  const isPasteMode = useModelStore((state) => state.isPasteMode);
  const modelOptions = useModelStore((state) => state.modelOptions);
  const setModelOptions = useModelStore((state) => state.setModelOptions);
  const [showHelp, setShowHelp] = useState(false);
  const [cameraView, setCameraView] = useState(null);
  const [showSnapGrid, setShowSnapGrid] = useState(false);
  const controlsRef = useRef();

  const router = useRouter();

  const gridSnapSize = ['free', 0.1, 0.25, 0.5, 1, 2, 5];

  const changeSnapSizeHandler = (size) => {
    setModelOptions({ snapSize: size });
  };

  useEffect(() => {
    const onReset = () => {
      setCameraView({ camera: [10, 25, 10], fov: 50, immediate: false });
    };
    if (typeof window !== "undefined") {
      window.addEventListener("designStudio:resetView", onReset);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("designStudio:resetView", onReset);
      }
    };
  }, []);

  // Close snap grid dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSnapGrid && !event.target.closest('.snap-grid-dropdown')) {
        setShowSnapGrid(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSnapGrid]);

  return (
    <div className="w-full h-full relative">
      <Toaster />
      <div className="absolute flex justify-center items-center top-4 right-4 bg-white p-2 px-3 rounded-xl shadow-lg shadow-gray-100 gap-1 z-50">
        <button
          onClick={(e) => setShowHelp(true)}
          className="text-gray-700 flex items-center gap-2 text-sm hover:text-primaryThemeColor transition-all duration-300 p-1"
          title="راهنمای شورت کات‌ها"
        >
          <i className="fi fi-rr-interrogation block size-4"></i>
          <span>راهنمای شورت کات‌ها</span>
        </button>
      </div>

      {/* Paste mode indicator */}
      {isPasteMode && (
        <div className="absolute top-4 left-4 bg-primaryThemeColor text-white px-4 py-2 rounded-xl shadow-lg">
          <div className="flex items-center gap-2">
            <i className="fi fi-rr-paste size-4"></i>
            <span className="text-sm font-medium">
              حالت پیست فعال - روی محل مورد نظر کلیک کنید
            </span>
          </div>
        </div>
      )}

      <Canvas
        className={`design-studio ${isPasteMode ? "cursor-crosshair" : ""} bg-gray-100/70`}
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [10, 25, 10], fov: 40 }}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
        onClick={(event) => {
          // Only deselect if clicking on empty space (not on a model)
          if (event.object === event.scene) {
            setSelectedModelId(null);
          }
        }}
      >
        <CameraAnimator targetView={cameraView} controlsRef={controlsRef} />
        <ZoomController />
        <KeyboardController onShowHelp={setShowHelp} />
        <PasteHandler />
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />

        {selectedModels.map((model) => (
          <Model
            key={model.id}
            id={model.id}
            path={model.path}
            position={model.position}
            rotation={model.rotation}
          />
        ))}

        <ModelPlacer />

        <CustomGrid />

        <OrbitControls
          ref={controlsRef}
          enableRotate={!isAdjustingHeight}
          enablePan={!isAdjustingHeight}
          mouseButtons={{
            LEFT: undefined,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
        />

      </Canvas>

      {/* Help Modal */}
      <Modal
        isOpen={showHelp}
        onOpenChange={setShowHelp}
        placement="center"
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="font-bold text-center">
            راهنمای شورت کات‌های کیبورد
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Operations */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 border-b pb-2">
                  عملیات پایه
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>کپی مدل</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Ctrl+C
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>کات مدل</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Ctrl+X
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>پیست مدل</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Ctrl+V
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>تکثیر مدل</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Ctrl+D
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>حذف مدل</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Delete
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Selection & Movement */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 border-b pb-2">
                  انتخاب و حرکت
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>انتخاب همه</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Ctrl+A
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>انتخاب/لغو انتخاب چندتایی</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + Right Click</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>لغو انتخاب</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Escape
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>حرکت بالا</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      ↑
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>حرکت پایین</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      ↓
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>حرکت چپ</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      ←
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>حرکت راست</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      →
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>حرکت دقیق (با Shift)</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Shift + ↑↓←→
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Camera Controls */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 border-b pb-2">
                  کنترل دوربین
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>زوم این</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      +
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>زوم اوت</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      -
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>کنترل دوربین</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Space
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Future Features */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 border-b pb-2">
                  ویرایش‌ها
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Undo</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Ctrl+Z
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Redo</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
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

      <ViewCube activeView={cameraView} onViewChange={setCameraView} />

      {/* Snap Grid Dropdown */}
      <div className="absolute bottom-4 right-4 z-50 snap-grid-dropdown">
        <div className="relative">
          <button
            onClick={() => setShowSnapGrid(!showSnapGrid)}
            className="bg-white p-3 rounded-xl shadow-lg shadow-gray-100 hover:shadow-gray-200 transition-all duration-300 flex items-center gap-2 text-gray-700 hover:text-primaryThemeColor"
            title="تنظیمات Snap Grid"
          >
            <i className="fi fi-rr-grid size-4"></i>
            <span className="text-sm">
              {modelOptions.snapSize === 'free' ? 'آزاد' : `${toFarsiNumber(modelOptions.snapSize)} میلی متر`}
            </span>
            <i className={`fi fi-rr-angle-small-down size-3 transition-transform duration-200 ${showSnapGrid ? 'rotate-180' : ''}`}></i>
          </button>

          {showSnapGrid && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-lg shadow-gray-100 border border-gray-100 overflow-hidden">
              <div className="p-3">
                <div className="text-sm text-gray-700 mb-3 text-center">
                  اندازه جا به جایی
                </div>
                <div className="space-y-2">
                  {gridSnapSize.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        changeSnapSizeHandler(size);
                        setShowSnapGrid(false);
                      }}
                      className={`w-full text-right px-3 py-1.5 rounded-lg text-xs transition-all duration-200 hover:bg-gray-50 ${
                        modelOptions.snapSize === size
                          ? "bg-primaryThemeColor/10 text-primaryThemeColor"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      {size === 'free' ? 'آزاد' : `${toFarsiNumber(size)} میلی متر`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GridPage;
