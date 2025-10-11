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
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";

const EditUserModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    familyName: "",
    phoneNumber: "",
    role: "user",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        familyName: user.familyName || "",
        phoneNumber: user.phoneNumber || "",
        role: user.role || "user",
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(data.user);
        onClose();
        toast.success('کاربر با موفقیت به‌روزرسانی شد');
      } else {
        toast.error(data.message || "خطا در به‌روزرسانی کاربر");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("خطا در به‌روزرسانی کاربر");
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
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:user-edit-line-duotone"
                width="24"
                height="24"
                className="text-primaryThemeColor"
              />
              <span>ویرایش کاربر</span>
            </div>
          </ModalHeader>
          <ModalBody className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="نام"
                placeholder="نام کاربر را وارد کنید"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                labelPlacement="outside"
                isRequired
                classNames={{
                  input: "text-right placeholder:font-light placeholder:text-gray-600",
                  inputWrapper: "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                  label: "text-gray-700 font-medium",
                }}
              />
              <Input
                label="نام خانوادگی"
                placeholder="نام خانوادگی کاربر را وارد کنید"
                value={formData.familyName}
                onChange={(e) => handleChange("familyName", e.target.value)}
                labelPlacement="outside"
                isRequired
                classNames={{
                  input: "text-right placeholder:font-light placeholder:text-gray-600",
                  inputWrapper: "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                  label: "text-gray-700 font-medium",
                }}
              />
            </div>

            <Input
              label="شماره موبایل"
              placeholder="شماره موبایل کاربر را وارد کنید"
              value={formData.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              labelPlacement="outside"
              isRequired
              classNames={{
                input: "text-right placeholder:font-light placeholder:text-gray-600",
                inputWrapper: "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                label: "text-gray-700 font-medium",
              }}
            />

            <Select
              label="نقش کاربر"
              selectedKeys={[formData.role]}
              onChange={(e) => handleChange("role", e.target.value)}
              labelPlacement="outside"
              classNames={{
                trigger: "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                label: "text-gray-700 font-medium",
              }}
            >
              <SelectItem key="user" value="user">
                کاربر
              </SelectItem>
              <SelectItem key="admin" value="admin">
                ادمین
              </SelectItem>
            </Select>
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

export default EditUserModal;
