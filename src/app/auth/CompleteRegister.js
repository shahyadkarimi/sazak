import { toFarsiNumber } from "@/helper/helper";
import { saveSession } from "@/lib/storage";
import { getData, postData } from "@/services/API";
import { useUserStore } from "@/store/UserInfo";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const CompleteRegister = ({ userInfo, setUserInfo, step, setStep }) => {
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

  const { user, setUser } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const helPassword = ["رمز عبور باید حداقل شش رقم باشد", "رمز عبور باید", ""];

  const router = useRouter();

  const completeRegisterHandler = (data) => {
    setLoading(true);

    postData("/user/register", { ...userInfo, ...data })
      .then((res) => {
        // navigate user to dashboard
        toast.success("ثبت نام با موفقیت انجام شد، درحال انتقال...", {
          duration: 3000,
        });

        // save token in cookie
        saveSession(res.data.token);
        localStorage.setItem("token", res.data.token);

        // get user data & save
        getData("/user/profile").then((res) => {
          setUser(res.data);

          router.push("/user");
        });
      })
      .catch((err) => {
        setLoading(false);

        toast.error(err.response.data.message, {
          duration: 3000,
        });
      });
  };

  const showPasswordToggle = () => setShowPassword(!showPassword);

  return (
    <form
      onSubmit={handleSubmit(completeRegisterHandler)}
      className="w-full flex flex-col gap-8"
    >
      <Toaster />

      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-black">اطلاعات کاربری</h1>
        <p className="text-sm font-semibold text-gray-500/90">
          اطلاعات کاربری خود را وارد و ثبت نام خود را تکمیل کنید
        </p>
      </div>

      <Input
        type="text"
        placeholder="نام خود را وارد کنید"
        variant="bordered"
        labelPlacement="outside"
        startContent={
          <Icon
            icon="solar:user-outline"
            className="text-gray-600"
            width="24"
            height="24"
          />
        }
        classNames={{
          input: "placeholder:font-light placeholder:text-gray-600",
          inputWrapper:
            "border h-16 !text-sm border-gray-300 text-gray-600 data-[hover=true]:border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
        }}
        isInvalid={errors.name ? true : false}
        errorMessage="نام اجباری میباشد"
        {...register("name", { required: true })}
      />

      <Input
        type="text"
        placeholder="نام خانوادگی خود را وارد کنید"
        variant="bordered"
        labelPlacement="outside"
        startContent={
          <Icon
            icon="solar:user-id-linear"
            className="text-gray-600"
            width="24"
            height="24"
          />
        }
        classNames={{
          input: "placeholder:font-light placeholder:text-gray-600",
          inputWrapper:
            "border h-16 !text-sm border-gray-300 text-gray-600 data-[hover=true]:border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
        }}
        isInvalid={errors.family_name ? true : false}
        errorMessage="نام خانوادگی اجباری میباشد"
        {...register("family_name", { required: true })}
      />

      <div className="flex flex-col gap-1">
        <Input
          placeholder="رمز عبور خود را وارد کنید"
          variant="bordered"
          labelPlacement="outside"
          classNames={{
            input: "placeholder:font-light placeholder:text-gray-600",
            inputWrapper:
              "border h-16 !text-sm border-gray-300 text-gray-600 data-[hover=true]:border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
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
                value.length > 0 || "رمز عبور اجباری میباشد",
              isSixLength: (value) =>
                value.length > 6 || "رمز عبور باید حداقل شش رقم باشد",
              isLowercase: (value) =>
                /[a-z]/g.test(value) || "رمز عبور شما باید شامل حروف کوچک باشد",
              isUppercase: (value) =>
                /[A-Z]/g.test(value) || "رمز عبور شما باید شامل حروف بزرگ باشد",
            },
          })}
        />

        <p className="text-tiny text-warning">
          رمز عبور باید حداقل شش رقم و شامل اعداد، حروف انگلیسی بزرگ و کوچک
          باشد.
        </p>
      </div>

      <Button
        isLoading={loading}
        type="submit"
        className="bg-primaryThemeColor text-base h-16 font-semibold w-full text-white rounded-2xl"
      >
        تکمیل ثبت نام
      </Button>
    </form>
  );
};

export default CompleteRegister;
