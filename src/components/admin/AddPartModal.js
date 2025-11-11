"use client";

import React, { useState } from "react";
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
} from "@heroui/react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";

const AddPartModal = ({ isOpen, onClose, onSuccess, categories, onCategoryAdded }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    width: "",
    height: "",
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");

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
      if (formData.width) {
        formDataToSend.append("width", formData.width);
      }
      if (formData.height) {
        formDataToSend.append("height", formData.height);
      }
      formDataToSend.append("glbFile", file);

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
          width: "",
          height: "",
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
      width: "",
      height: "",
    });
    setFile(null);
    setFileError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
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
                input: "text-right placeholder:font-light placeholder:text-gray-600",
                inputWrapper:
                  "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                label: "text-gray-700 font-medium",
              }}
            />
            <Select
              label="دسته‌بندی"
              placeholder="دسته‌بندی را انتخاب کنید"
              selectedKeys={formData.category ? new Set([formData.category]) : new Set()}
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
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="عرض (cm)"
                placeholder="عرض قطعه"
                type="number"
                value={formData.width}
                onChange={(e) => handleChange("width", e.target.value)}
                labelPlacement="outside"
                classNames={{
                  input: "text-right placeholder:font-light placeholder:text-gray-600",
                  inputWrapper:
                    "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                  label: "text-gray-700 font-medium",
                }}
              />
              <Input
                label="طول (cm)"
                placeholder="طول قطعه"
                type="number"
                value={formData.height}
                onChange={(e) => handleChange("height", e.target.value)}
                labelPlacement="outside"
                classNames={{
                  input: "text-right placeholder:font-light placeholder:text-gray-600",
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

