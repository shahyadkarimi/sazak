"use client";

import { postData } from "@/services/API";
import { useUserStore } from "@/store/UserInfo";
import { Button, cn, Input, Spinner, Select, SelectItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { iranProvinces } from "@/constants/locations";

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
      email: "",
      address: "",
      province: "",
      city: "",
      birthDate: "",
      password: "",
    },
  });

  useEffect(() => {
    setValue("name", user.name);
    setValue("familyName", user.familyName);
    setValue("email", user.email || "");
    setValue("address", user.address || "");
    setValue("province", user.province || "");
    setValue("city", user.city || "");
    setValue("birthDate", user.birthDate || "");
    setProfilePicture(user.profilePicture || "/assets/avatar.png");
  }, [user]);

  const selectedProvince = watch("province");
  const selectedCity = watch("city");
  const availableCities = useMemo(() => {
    if (!selectedProvince) {
      return selectedCity ? [selectedCity] : [];
    }
    const province = iranProvinces.find((item) => item.name === selectedProvince);
    const base = province ? [...province.cities] : [];
    if (selectedCity && !base.includes(selectedCity)) {
      base.push(selectedCity);
    }
    return base;
  }, [selectedProvince, selectedCity]);

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
        <div className="relative border-8 border-white dark:border-gray-800 rounded-full group">
          <Image
            src={profilePicture}
            width={100}
            height={100}
            className="size-28 rounded-full border-2 shadow-lg shadow-gray-100 dark:shadow-gray-900"
            alt="user avatar"
          />

          {/* Upload overlay */}
          <div
            className={cn(
              "absolute inset-0 bg-black/50 dark:bg-gray-900/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer",
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
              <Spinner color="white dark:text-gray-200" />
            ) : (
              <Icon
                icon="solar:camera-add-linear"
                className="text-white dark:text-gray-200"
                width="24"
                height="24"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-0.5 pb-4">
          <span className="text-xl text-gray-600 dark:text-gray-200 font-black">
            {user.fullName}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">دانشجو</span>
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
                  className="text-gray-600 dark:text-gray-300"
                  width="24"
                  height="24"
                />
              }
              classNames={{
                input:
                  "placeholder:font-light text-base placeholder:text-gray-600 dark:placeholder:text-gray-400",
                inputWrapper:
                  "border h-[50px] !text-sm border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
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
                  className="text-gray-600 dark:text-gray-300"
                  width="24"
                  height="24"
                />
              }
              classNames={{
                input:
                  "placeholder:font-light text-base placeholder:text-gray-600 dark:placeholder:text-gray-400",
                inputWrapper:
                  "border h-[50px] !text-sm border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
              }}
              isInvalid={errors.familyName ? true : false}
              errorMessage="نام خانوادگی الزامی است"
              {...register("familyName", { required: true })}
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              type="email"
              placeholder="ایمیل خود را وارد کنید"
              variant="bordered"
              labelPlacement="outside"
              value={value || ""}
              onBlur={onBlur}
              onChange={onChange}
              startContent={
                <Icon
                  icon="solar:letter-linear"
                  className="text-gray-600 dark:text-gray-300"
                  width="24"
                  height="24"
                />
              }
              classNames={{
                input:
                  "placeholder:font-light text-base placeholder:text-gray-600 dark:placeholder:text-gray-400",
                inputWrapper:
                  "border h-[50px] !text-sm border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
              }}
              isInvalid={errors.email ? true : false}
              errorMessage={errors?.email?.message}
            />
          )}
        />

        <Controller
          name="address"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              type="text"
              placeholder="آدرس محل سکونت را وارد کنید"
              variant="bordered"
              labelPlacement="outside"
              value={value || ""}
              onBlur={onBlur}
              onChange={onChange}
              startContent={
                <Icon
                  icon="solar:home-2-linear"
                  className="text-gray-600 dark:text-gray-300"
                  width="24"
                  height="24"
                />
              }
              classNames={{
                input:
                  "placeholder:font-light text-base placeholder:text-gray-600 dark:placeholder:text-gray-400",
                inputWrapper:
                  "border h-[50px] !text-sm border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
              }}
              isInvalid={errors.address ? true : false}
              errorMessage={errors?.address?.message}
            />
          )}
        />

        <Controller
          name="province"
          control={control}
          render={({ field: { value } }) => (
            <Select
              placeholder="استان محل سکونت را انتخاب کنید"
              selectedKeys={value ? new Set([value]) : new Set()}
              onSelectionChange={(keys) => {
                const selectedValue = Array.from(keys)[0] ?? "";
                setValue("province", selectedValue, { shouldValidate: true });
                setValue("city", "", { shouldValidate: true });
                clearErrors(["province", "city"]);
              }}
              labelPlacement="outside"
              variant="bordered"
              classNames={{
                trigger:
                  "border h-[50px] !text-sm border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
              }}
              isInvalid={errors.province ? true : false}
              errorMessage={errors?.province?.message}
            >
              {iranProvinces.map((item) => (
                <SelectItem key={item.name} value={item.name}>
                  {item.name}
                </SelectItem>
              ))}
            </Select>
          )}
        />

        <Controller
          name="city"
          control={control}
          render={({ field: { value } }) => (
            <Select
              placeholder="شهر محل سکونت را انتخاب کنید"
              selectedKeys={value ? new Set([value]) : new Set()}
              onSelectionChange={(keys) => {
                const selectedValue = Array.from(keys)[0] ?? "";
                setValue("city", selectedValue, { shouldValidate: true });
                clearErrors("city");
              }}
              labelPlacement="outside"
              variant="bordered"
              classNames={{
                trigger:
                  "border h-[50px] !text-sm border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
              }}
              isDisabled={!selectedProvince}
              isInvalid={errors.city ? true : false}
              errorMessage={errors?.city?.message}
            >
              {availableCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </Select>
          )}
        />

        <Controller
          name="birthDate"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              type="date"
              placeholder="تاریخ تولد"
              variant="bordered"
              labelPlacement="outside"
              value={value || ""}
              onBlur={onBlur}
              onChange={onChange}
              startContent={
                <Icon
                  icon="solar:calendar-linear"
                  className="text-gray-600 dark:text-gray-300"
                  width="24"
                  height="24"
                />
              }
              classNames={{
                input:
                  "placeholder:font-light text-base placeholder:text-gray-600 dark:placeholder:text-gray-400",
                inputWrapper:
                  "border h-[50px] !text-sm border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
              }}
              isInvalid={errors.birthDate ? true : false}
              errorMessage={errors?.birthDate?.message}
            />
          )}
        />

        <Input
          placeholder="رمز عبور جدید ( اختیاری )"
          variant="bordered"
          labelPlacement="outside"
          classNames={{
            input: "placeholder:font-light placeholder:text-gray-600 dark:placeholder:text-gray-400",
            inputWrapper:
              "border h-[50px] !text-sm border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
          }}
          startContent={
            <Icon
              icon="solar:lock-password-linear"
              className="text-gray-600 dark:text-gray-300"
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
