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
  Textarea,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";

const AddCategoryModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/parts/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(data.category);
        onClose();
        setFormData({
          name: "",
          description: "",
        });
        toast.success("دسته‌بندی با موفقیت اضافه شد");
      } else {
        toast.error(data.message || "خطا در اضافه کردن دسته‌بندی");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("خطا در اضافه کردن دسته‌بندی");
    } finally {
      setLoading(false);
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
      description: "",
    });
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
              <span>افزودن دسته‌بندی جدید</span>
            </div>
          </ModalHeader>
          <ModalBody className="flex flex-col gap-4">
            <Input
              label="نام دسته‌بندی"
              placeholder="نام دسته‌بندی را وارد کنید"
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
            <Textarea
              label="توضیحات"
              placeholder="توضیحات دسته‌بندی را وارد کنید"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              labelPlacement="outside"
              classNames={{
                input: "text-right placeholder:font-light placeholder:text-gray-600",
                inputWrapper:
                  "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                label: "text-gray-700 font-medium",
              }}
            />
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

export default AddCategoryModal;

