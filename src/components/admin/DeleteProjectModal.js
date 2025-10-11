"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";

const DeleteProjectModal = ({ isOpen, onClose, project, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: "DELETE",
        headers: {
          "x-auth-token": token,
        },
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
        toast.success('پروژه با موفقیت حذف شد');
      } else {
        toast.error(data.message || "خطا در حذف پروژه");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("خطا در حذف پروژه");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:trash-bin-minimalistic-line-duotone"
              width="24"
              height="24"
              className="text-red-500"
            />
            <span>حذف پروژه</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Icon
                icon="solar:danger-triangle-line-duotone"
                width="32"
                height="32"
                className="text-red-500"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              آیا مطمئن هستید؟
            </h3>
            <p className="text-gray-600 mb-4">
              آیا می‌خواهید پروژه{" "}
              <span className="font-semibold">{project?.name}</span> را حذف کنید؟
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <Icon
                icon="solar:info-circle-line-duotone"
                width="16"
                height="16"
                className="inline ml-1"
              />
              این عمل قابل بازگشت نیست و تمام اطلاعات پروژه پاک خواهد شد.
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="default"
            variant="light"
            onPress={onClose}
            disabled={loading}
          >
            انصراف
          </Button>
          <Button
            color="danger"
            onPress={handleDelete}
            disabled={loading}
            className="bg-red-600"
          >
            {loading ? (
              <Spinner size="sm" color="white" />
            ) : (
              "حذف پروژه"
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteProjectModal;
