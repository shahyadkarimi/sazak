"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
  Slider,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import ModelPreview from "./ModelPreview";

const AddPartModal = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
  onCategoryAdded,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    length: "",
    width: "",
    height: "",
    noColor: false,
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const thumbnailRef = useRef(null);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [customColor, setCustomColor] = useState(null);

  useEffect(() => {
    if (formData.noColor) {
      setCustomColor(null);
    } else if (file && customColor === null) {
      const colors = [
        "#3b82f6", "#ef4444", "#22c55e", "#eab308", 
        "#f97316", "#a855f7", "#ec4899", "#06b6d4",
        "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
        "#14b8a6", "#f43f5e", "#6366f1", "#0ea5e9",
        "#84cc16", "#fb923c", "#c026d3", "#06b6d4",
        "#22d3ee", "#a78bfa", "#34d399", "#fbbf24",
        "#60a5fa", "#f472b6", "#4ade80", "#fb7185"
      ];
      setCustomColor(colors[Math.floor(Math.random() * colors.length)]);
    }
  }, [formData.noColor, file]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFileError("");

    if (!file) {
      setFileError("فایل GLB الزامی است");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("نام قطعه الزامی است");
      return;
    }

    if (!formData.category) {
      toast.error("دسته‌بندی الزامی است");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("length", formData.length || "");
      formDataToSend.append("width", formData.width || "");
      formDataToSend.append("height", formData.height || "");
      formDataToSend.append("noColor", formData.noColor ? "true" : "false");
      formDataToSend.append("glbFile", file);

      const thumbnailBlob = await captureThumbnail();
      if (thumbnailBlob) {
        const thumbnailFile = new File([thumbnailBlob], "thumbnail.png", {
          type: "image/png",
        });
        formDataToSend.append("thumbnailFile", thumbnailFile);
      }

      const response = await fetch("/api/admin/parts", {
        method: "POST",
        headers: {
          "x-auth-token": token,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(data.part);
        onClose();
        setFormData({
          name: "",
          category: "",
          length: "",
          width: "",
          height: "",
          noColor: false,
        });
        setFile(null);
        setFileError("");
        toast.success("قطعه با موفقیت اضافه شد");
        // Dispatch event to refresh parts list in design studio
        window.dispatchEvent(new CustomEvent("partsUpdated"));
      } else {
        toast.error(data.message || "خطا در اضافه کردن قطعه");
      }
    } catch (error) {
      console.error("Error adding part:", error);
      toast.error("خطا در اضافه کردن قطعه");
    } finally {
      setLoading(false);
    }
  };

  const captureThumbnail = async () => {
    return new Promise((resolve) => {
      const checkCanvas = (attempts = 0) => {
        const canvas = thumbnailRef.current?.querySelector("canvas");
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          setTimeout(() => {
            canvas.toBlob((blob) => {
              resolve(blob);
            }, "image/png");
          }, 500);
        } else if (attempts < 20) {
          setTimeout(() => checkCanvas(attempts + 1), 200);
        } else {
          resolve(null);
        }
      };
      checkCanvas();
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".glb")) {
        setFileError("فقط فایل‌های GLB مجاز است");
        setFile(null);
        return;
      }
      setFileError("");
      setFile(selectedFile);
      if (!formData.noColor) {
        const colors = [
          "#3b82f6", "#ef4444", "#22c55e", "#eab308", 
          "#f97316", "#a855f7", "#ec4899", "#06b6d4",
          "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
          "#14b8a6", "#f43f5e", "#6366f1", "#0ea5e9",
          "#84cc16", "#fb923c", "#c026d3", "#06b6d4",
          "#22d3ee", "#a78bfa", "#34d399", "#fbbf24",
          "#60a5fa", "#f472b6", "#4ade80", "#fb7185"
        ];
        setCustomColor(colors[Math.floor(Math.random() * colors.length)]);
      } else {
        setCustomColor(null);
      }
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = () => {
    setFormData({
      name: "",
      category: "",
      length: "",
      width: "",
      height: "",
    });
    setFile(null);
    setFileError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      classNames={{
        wrapper: "overflow-hidden",
        body: "max-h-[65vh] overflow-y-auto",
      }}
    >
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:add-circle-line-duotone"
                width="24"
                height="24"
                className="text-primaryThemeColor"
              />
              <span>افزودن قطعه جدید</span>
            </div>
          </ModalHeader>
          <ModalBody className="flex flex-col gap-4">
            <Input
              label="نام قطعه"
              placeholder="نام قطعه را وارد کنید"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              labelPlacement="outside"
              isRequired
              classNames={{
                input:
                  "text-right placeholder:font-light placeholder:text-gray-600",
                inputWrapper:
                  "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                label: "text-gray-700 font-medium",
              }}
            />
            <Select
              label="دسته‌بندی"
              placeholder="دسته‌بندی را انتخاب کنید"
              selectedKeys={
                formData.category ? new Set([formData.category]) : new Set()
              }
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] ?? "";
                handleChange("category", value);
              }}
              labelPlacement="outside"
              isRequired
              classNames={{
                trigger:
                  "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                label: "text-gray-700 font-medium",
              }}
            >
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </Select>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="طول"
                placeholder="طول"
                type="number"
                value={formData.length}
                onChange={(e) => handleChange("length", e.target.value)}
                labelPlacement="outside"
                classNames={{
                  input:
                    "text-right placeholder:font-light placeholder:text-gray-600",
                  inputWrapper:
                    "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                  label: "text-gray-700 font-medium",
                }}
              />
              <Input
                label="عرض"
                placeholder="عرض"
                type="number"
                value={formData.width}
                onChange={(e) => handleChange("width", e.target.value)}
                labelPlacement="outside"
                classNames={{
                  input:
                    "text-right placeholder:font-light placeholder:text-gray-600",
                  inputWrapper:
                    "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                  label: "text-gray-700 font-medium",
                }}
              />
              <Input
                label="ارتفاع"
                placeholder="ارتفاع"
                type="number"
                value={formData.height}
                onChange={(e) => handleChange("height", e.target.value)}
                labelPlacement="outside"
                classNames={{
                  input:
                    "text-right placeholder:font-light placeholder:text-gray-600",
                  inputWrapper:
                    "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                  label: "text-gray-700 font-medium",
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                فایل GLB <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".glb"
                  onChange={handleFileChange}
                  className="hidden"
                  id="glb-file-input"
                />
                <label
                  htmlFor="glb-file-input"
                  className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                >
                  <Icon
                    icon="solar:file-line-duotone"
                    width="20"
                    height="20"
                    className="text-gray-500"
                  />
                  <span className="text-sm text-gray-600">
                    {file ? file.name : "انتخاب فایل GLB"}
                  </span>
                </label>
              </div>
              {fileError && (
                <p className="text-sm text-red-600 mt-1">{fileError}</p>
              )}
              {file && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    تصویر قطعه
                  </label>
                  <div className="mb-2 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">
                          حرکت در محور X: {positionX}
                        </label>
                        <div dir="ltr">
                          <Slider
                            size="sm"
                            step={0.1}
                            minValue={-10}
                            maxValue={10}
                            value={positionX}
                            onChange={(value) => setPositionX(Array.isArray(value) ? value[0] : value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">
                          حرکت در محور Y: {positionY}
                        </label>
                        <div dir="ltr">
                          <Slider
                            size="sm"
                            step={0.1}
                            minValue={-10}
                            maxValue={10}
                            value={positionY}
                            onChange={(value) => setPositionY(Array.isArray(value) ? value[0] : value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">
                          چرخش در محور X: {Math.round((rotationX * 180) / Math.PI)}°
                        </label>
                        <div dir="ltr">
                          <Slider
                            size="sm"
                            step={1}
                            minValue={-90}
                            maxValue={90}
                            value={Math.round((rotationX * 180) / Math.PI)}
                            onChange={(value) => {
                              const val = Array.isArray(value) ? value[0] : value;
                              setRotationX((val * Math.PI) / 180);
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">
                          چرخش در محور Y: {Math.round((rotationY * 180) / Math.PI)}°
                        </label>
                        <div dir="ltr">
                          <Slider
                            size="sm"
                            step={1}
                            minValue={0}
                            maxValue={360}
                            value={Math.round((rotationY * 180) / Math.PI)}
                            onChange={(value) => {
                              const val = Array.isArray(value) ? value[0] : value;
                              setRotationY((val * Math.PI) / 180);
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">
                        زوم: {zoom}x
                      </label>
                      <div dir="ltr">
                        <Slider
                          size="sm"
                          step={0.1}
                          minValue={-3}
                          maxValue={3}
                          value={zoom}
                          onChange={(value) => setZoom(Array.isArray(value) ? value[0] : value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                    {!formData.noColor && (
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">
                          رنگ مدل
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColor || "#3b82f6"}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="w-12 h-8 p-0 border border-gray-300 rounded-lg cursor-pointer"
                            title="انتخاب رنگ"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    ref={thumbnailRef}
                    className="w-full h-48 border border-gray-200 rounded-xl overflow-hidden bg-gray-100"
                  >
                    <ModelPreview
                      file={file}
                      className="w-full h-full"
                      positionX={positionX}
                      positionY={positionY}
                      rotationX={rotationX}
                      rotationY={rotationY}
                      zoom={zoom}
                      customColor={customColor}
                      noColor={formData.noColor}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="noColor"
                checked={formData.noColor}
                onChange={(e) => handleChange("noColor", e.target.checked)}
                className="w-4 h-4 text-primaryThemeColor border-gray-300 rounded focus:ring-primaryThemeColor"
              />
              <label htmlFor="noColor" className="text-sm text-gray-700 cursor-pointer">
                قطعه بدون رنگ
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={handleClose}
              disabled={loading}
            >
              انصراف
            </Button>
            <Button
              color="primary"
              type="submit"
              disabled={loading}
              className="bg-primaryThemeColor"
            >
              {loading ? <Spinner size="sm" color="white" /> : "افزودن"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default AddPartModal;
