"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Switch,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";

const EditProjectModal = ({ isOpen, onClose, project, onSuccess, apiPath = "/api/admin/projects" }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    isPublic: false,
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        isPublic: project.isPublic || false,
      });
    }
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiPath}/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess({ ...project, ...formData });
        onClose();
        toast.success('پروژه با موفقیت به‌روزرسانی شد');
      } else {
        toast.error(data.message || "خطا در به‌روزرسانی پروژه");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("خطا در به‌روزرسانی پروژه");
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent className="bg-white dark:bg-gray-800">
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1 text-gray-900 dark:text-gray-100">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:folder-with-files-line-duotone"
                width="24"
                height="24"
                className="text-primaryThemeColor"
              />
              <span>ویرایش پروژه</span>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="نام پروژه"
              placeholder="نام پروژه را وارد کنید"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              isRequired
              classNames={{
                input: "text-right placeholder:font-light placeholder:text-gray-600 dark:placeholder:text-gray-400 dark:text-gray-200",
                inputWrapper: "!shadow-none rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus-within:border-primaryThemeColor bg-white dark:bg-gray-700",
                label: "text-gray-700 dark:text-gray-300 font-medium",
              }}
              labelPlacement="outside"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={onClose}
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
              {loading ? (
                <Spinner size="sm" color="white" />
              ) : (
                "ذخیره تغییرات"
              )}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default EditProjectModal;
