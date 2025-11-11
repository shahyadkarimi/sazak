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

const DeleteCategoryModal = ({ isOpen, onClose, category, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/parts/categories/${category.id}`, {
        method: "DELETE",
        headers: {
          "x-auth-token": token,
        },
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
        toast.success("دسته‌بندی با موفقیت حذف شد");
      } else {
        toast.error(data.message || "خطا در حذف دسته‌بندی");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("خطا در حذف دسته‌بندی");
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
              icon="solar:trash-bin-trash-line-duotone"
              width="24"
              height="24"
              className="text-red-600"
            />
            <span>حذف دسته‌بندی</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <p className="text-gray-700">
            آیا از حذف دسته‌بندی <strong>{category?.name}</strong> اطمینان دارید؟
          </p>
          <p className="text-sm text-gray-500 mt-2">
            در صورت وجود قطعات مرتبط، امکان حذف وجود ندارد.
          </p>
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
          >
            {loading ? <Spinner size="sm" color="white" /> : "حذف"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteCategoryModal;

