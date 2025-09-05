"use client";

import { postData } from "@/services/API";
import { Button, Input, Textarea } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";

const NewProjectForm = () => {
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createNewProjectHandler = (data) => {
    setLoading(true);

    postData("/project/new-project", { ...data })
      .then((res) => {
        setLoading(false);
        toast.success("با موفقیت انجام شد درحال انتقال شما...");

        router.push(`/design-studio/project/${res?.data?.project?._id}`);
      })
      .catch((err) => {
        err?.response?.data?.errors?.map((error) => {
          setError(error.name, { message: error.message });
        });
        toast.error("خطا هنگام ایجاد پروژه جدید");
        setLoading(false);
      });
  };

  return (
    <form
      onSubmit={handleSubmit(createNewProjectHandler)}
      className="flex flex-col gap-4 lg:gap-6"
    >
      <Toaster />

      <p className="-mt-4 text-sm text-gray-600 self-center">
        پروژه جدید خود را ایجاد کنید و خلاقیت خود را شکوفا کنید
      </p>

      <Controller
        name="name"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            type="text"
            placeholder="نام پروژه را وارد کنید"
            variant="bordered"
            labelPlacement="outside"
            value={value}
            onBlur={onBlur}
            onChange={onChange}
            startContent={
              <Icon
                icon="solar:ruler-cross-pen-broken"
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
            isInvalid={errors?.name ? true : false}
            errorMessage={errors?.name?.message}
            {...register("name", {
              validate: {
                required: (value) => value.length > 0 || "نام پروژه الزامی است",
              },
            })}
          />
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <Textarea
            type="text"
            placeholder="توضیحات پروژه ( اختیاری )"
            variant="bordered"
            labelPlacement="outside"
            value={value}
            onBlur={onBlur}
            onChange={onChange}
            startContent={
              <Icon
                icon="solar:ruler-cross-pen-broken"
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
            {...register("description")}
          />
        )}
      />

      <Button
        isLoading={loading}
        type="submit"
        className="bg-primaryThemeColor text-base h-[50px] font-semibold w-full text-white rounded-2xl"
      >
        ایجاد پروژه
      </Button>
    </form>
  );
};

export default NewProjectForm;
