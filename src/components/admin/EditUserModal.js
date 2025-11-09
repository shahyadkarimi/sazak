"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { iranProvinces } from "@/constants/locations";

const EditUserModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    familyName: "",
    phoneNumber: "",
    role: "user",
    email: "",
    address: "",
    province: "",
    city: "",
    birthDate: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      const province = user.province || "";
      setFormData({
        name: user.name || "",
        familyName: user.familyName || "",
        phoneNumber: user.phoneNumber || "",
        role: user.role || "user",
        email: user.email || "",
        address: user.address || "",
        province,
        city: user.city || "",
        birthDate: user.birthDate || "",
        password: "",
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
    setFormData((prev) => {
      if (field === "province") {
        return { ...prev, province: value, city: "" };
      }
      return { ...prev, [field]: value };
    });
  };

  const availableCities = useMemo(() => {
    if (!formData.province) {
      return formData.city ? [formData.city] : [];
    }
    const province = iranProvinces.find((item) => item.name === formData.province);
    const base = province ? [...province.cities] : [];
    if (formData.city && !base.includes(formData.city)) {
      base.push(formData.city);
    }
    return base;
  }, [formData.province, formData.city]);

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
              <Input
                label="ایمیل"
                placeholder="ایمیل کاربر را وارد کنید"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                labelPlacement="outside"
                classNames={{
                  input: "text-right placeholder:font-light placeholder:text-gray-600",
                  inputWrapper: "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                  label: "text-gray-700 font-medium",
                }}
              />
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
                label="استان"
                placeholder="استان را انتخاب کنید"
                selectedKeys={formData.province ? new Set([formData.province]) : new Set()}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] ?? "";
                  handleChange("province", value);
                }}
                labelPlacement="outside"
                classNames={{
                  trigger: "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                  label: "text-gray-700 font-medium",
                }}
              >
                {iranProvinces.map((item) => (
                  <SelectItem key={item.name} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="شهر"
                placeholder="شهر را انتخاب کنید"
                selectedKeys={formData.city ? new Set([formData.city]) : new Set()}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] ?? "";
                  handleChange("city", value);
                }}
                labelPlacement="outside"
                classNames={{
                  trigger: "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                  label: "text-gray-700 font-medium",
                }}
                isDisabled={!formData.province}
              >
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </Select>
              <Input
                label="تاریخ تولد"
                placeholder="تاریخ تولد را وارد کنید"
                type="date"
                value={formData.birthDate || ""}
                onChange={(e) => handleChange("birthDate", e.target.value)}
                labelPlacement="outside"
                classNames={{
                  input: "text-right placeholder:font-light placeholder:text-gray-600",
                  inputWrapper: "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                  label: "text-gray-700 font-medium",
                }}
              />
            </div>
            <Input
              label="آدرس"
              placeholder="آدرس محل سکونت را وارد کنید"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              labelPlacement="outside"
              classNames={{
                input: "text-right placeholder:font-light placeholder:text-gray-600",
                inputWrapper: "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                label: "text-gray-700 font-medium",
              }}
            />
            <Select
              label="نقش کاربر"
              selectedKeys={formData.role ? new Set([formData.role]) : new Set()}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] ?? "user";
                handleChange("role", value);
              }}
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
            <Input
              label="رمز عبور جدید"
              placeholder="رمز عبور جدید (اختیاری)"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              labelPlacement="outside"
              classNames={{
                input: "text-right placeholder:font-light placeholder:text-gray-600",
                inputWrapper: "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                label: "text-gray-700 font-medium",
              }}
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

export default EditUserModal;
