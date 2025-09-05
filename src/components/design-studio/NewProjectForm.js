"use client";

import { Button, Input, Textarea } from "@heroui/react";
import { Icon } from "@iconify/react";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";

const NewProjectForm = () => {
  const [loading, setLoading] = useState(false);

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
      description: "",
    },
  });

  const createNewProjectHandler = () => {};

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
        <p className="-mt-4 text-sm text-gray-600 self-center">پروژه جدید خود را ایجاد کنید و خلاقیت خود را شکوفا کنید</p>

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
            isInvalid={errors.name ? true : false}
            errorMessage="نام پروژه الزامی است"
            {...register("name", { required: true })}
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
        onClick={handleSubmit(createNewProjectHandler)}
        className="bg-primaryThemeColor text-base h-[50px] font-semibold w-full text-white rounded-2xl"
      >
        ایجاد پروژه
      </Button>
    </div>
  );
};

export default NewProjectForm;
