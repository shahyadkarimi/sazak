"use client";

import { postData } from "@/services/API";
import { useUserStore } from "@/store/UserInfo";
import { Button, cn, Input, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";

const EditProfileForm = () => {
  const { user, setUser } = useUserStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(
    user.profilePicture || "/assets/avatar.png"
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    reset,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
    defaultValues: {
      name: "",
      familyName: "",
      password: "",
    },
  });

  useEffect(() => {
    setValue("name", user.name);
    setValue("familyName", user.familyName);
    setProfilePicture(user.profilePicture || "/assets/avatar.png");
  }, [user]);

  const showPasswordToggle = () => setShowPassword(!showPassword);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("فرمت فایل پشتیبانی نمی‌شود. فقط JPG, PNG و WebP مجاز است");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("حجم فایل نباید بیشتر از ۵ مگابایت باشد");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await fetch("/api/user/upload-profile-picture", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setProfilePicture(result.user.profilePicture);
        setUser(result.user);
        toast.success("عکس پروفایل با موفقیت آپلود شد");
      } else {
        toast.error(result.message || "خطا هنگام آپلود عکس");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("خطا هنگام آپلود عکس");
    } finally {
      setUploadingImage(false);
    }
  };

  const editProfileHandler = (data) => {
    setLoading(true);
    postData("/user/edit-profile", { ...data })
      .then((res) => {
        setLoading(false);
        setUser(res.data.user);
        toast.success("ویرایش پروفایل با موفقیت انجام شد");
      })
      .catch((err) => {
        setLoading(false);
        toast.error("خطا هنگام ویرایش پروفایل");

        err?.response?.data?.errors?.map((error) => {
          setError(error.name, { message: error.message });
        });
      });
  };

  return (
    <>
      <Toaster />

      {/* avatar */}
      <div className="flex items-end -translate-y-14 gap-2">
        <div className="relative border-8 border-white rounded-full group">
          <Image
            src={profilePicture}
            width={100}
            height={100}
            className="size-28 rounded-full border-2 shadow-lg shadow-gray-100"
            alt="user avatar"
          />

          {/* Upload overlay */}
          <div
            className={cn(
              "absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer",
              uploadingImage && "opacity-100"
            )}
          >
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadingImage}
            />
            {uploadingImage ? (
              <Spinner color="white" />
            ) : (
              <Icon
                icon="solar:camera-add-linear"
                className="text-white"
                width="24"
                height="24"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-0.5 pb-4">
          <span className="text-xl text-gray-600 font-black">
            {user.fullName}
          </span>
          <span className="text-sm text-gray-500">دانشجو</span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-4 lg:gap-6">
        <Controller
          name="name"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              type="text"
              placeholder="نام خود را وارد کنید"
              variant="bordered"
              labelPlacement="outside"
              value={value}
              onBlur={onBlur}
              onChange={onChange}
              startContent={
                <Icon
                  icon="solar:user-outline"
                  className="text-gray-600"
                  width="24"
                  height="24"
                />
              }
              classNames={{
                input:
                  "placeholder:font-light text-base placeholder:text-gray-600",
                inputWrapper:
                  "border h-[50px] !text-sm border-gray-300 text-gray-600 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
              }}
              isInvalid={errors.name ? true : false}
              errorMessage="نام الزامی است"
              {...register("name", { required: true })}
            />
          )}
        />

        <Controller
          name="familyName"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              type="text"
              placeholder="نام خانوادگی خود را وارد کنید"
              variant="bordered"
              labelPlacement="outside"
              value={value}
              onBlur={onBlur}
              onChange={onChange}
              startContent={
                <Icon
                  icon="solar:user-id-linear"
                  className="text-gray-600"
                  width="24"
                  height="24"
                />
              }
              classNames={{
                input:
                  "placeholder:font-light text-base placeholder:text-gray-600",
                inputWrapper:
                  "border h-[50px] !text-sm border-gray-300 text-gray-600 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
              }}
              isInvalid={errors.familyName ? true : false}
              errorMessage="نام خانوادگی الزامی است"
              {...register("familyName", { required: true })}
            />
          )}
        />

        <Input
          placeholder="رمز عبور جدید ( اختیاری )"
          variant="bordered"
          labelPlacement="outside"
          classNames={{
            input: "placeholder:font-light placeholder:text-gray-600",
            inputWrapper:
              "border h-[50px] !text-sm border-gray-300 text-gray-600 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
          }}
          startContent={
            <Icon
              icon="solar:lock-password-linear"
              className="text-gray-600"
              width="24"
              height="24"
            />
          }
          endContent={
            <button
              className="focus:outline-none"
              type="button"
              onClick={showPasswordToggle}
              aria-label="toggle password visibility"
            >
              {showPassword ? (
                <Icon icon="solar:eye-closed-bold" width="20" height="20" />
              ) : (
                <Icon icon="solar:eye-linear" width="20" height="20" />
              )}
            </button>
          }
          type={showPassword ? "text" : "password"}
          isInvalid={errors.password ? true : false}
          errorMessage={errors?.password?.message}
          {...register("password", {
            validate: {
              isRequired: (value) =>
                !value || value.length > 0 || "رمز عبور الزامی است",
              isSixLength: (value) =>
                !value ||
                value.length >= 6 ||
                "رمز عبور باید حداقل ۶ کاراکتر باشد",
              isLetterExist: (value) =>
                !value ||
                /[A-Za-z]/.test(value) ||
                "رمز عبور باید حداقل شامل یک حرف باشد",
            },
          })}
        />

        <Button
          isLoading={loading}
          onClick={handleSubmit(editProfileHandler)}
          className="bg-primaryThemeColor text-base h-[50px] font-semibold w-full text-white rounded-2xl"
        >
          ویرایش پروفایل
        </Button>
      </div>
    </>
  );
};

export default EditProfileForm;
