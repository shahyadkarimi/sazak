import { toFarsiNumber } from "@/helper/helper";
import { saveSession } from "@/lib/auth";
import { getData, postData } from "@/services/API";
import { useUserStore } from "@/store/UserInfo";
import { Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { TbEditCircle } from "react-icons/tb";

const EnterPassword = ({ userInfo, setStep }) => {
  const { user, setUser } = useUserStore();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
    defaultValues: {
      password: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const backPhoneStepHandler = () => {
    setStep("phone");
  };

  const EnterPasswordHandler = (data) => {
    setLoading(true);

    postData("/auth/login", { ...data, ...userInfo })
      .then((res) => {
        // navigate user to dashboard
        toast.success("ورود با موفقیت انجام شد، درحال انتقال...", {
          duration: 3000,
        });

        // save token in cookie
        saveSession(res.data.token);
        localStorage.setItem("token", res.data.token);

        // get user data & save
        setUser(res.data.user);
        setTimeout(() => {
          router.push("/user");
        }, 500);
      })
      .catch((err) => {
        setLoading(false);

        err?.response?.data?.errors?.forEach((error) => {
          setError("password", {
            message: error.message,
          });
        });

        toast.error(err?.response?.data?.message || "خطا هنگام ورود", {
          duration: 3000,
        });
      });
  };

  const showPasswordToggle = () => setShowPassword(!showPassword);

  return (
    <form
      onSubmit={handleSubmit(EnterPasswordHandler)}
      className="w-full flex flex-col gap-8"
    >
      <Toaster />

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">ورورد به حساب کاربری</h1>

        <div className="flex items-center gap-2">
          <p className="text-sm sm:text-base font-semibold text-gray-500/90 dark:text-gray-400">
            ورود به حساب با شماره موبایل {toFarsiNumber(userInfo.phoneNumber)}
          </p>

          <div onClick={backPhoneStepHandler}>
            <TbEditCircle className="cursor-pointer size-5 text-primaryThemeColor" />
          </div>
        </div>
      </div>

      <Input
        placeholder="رمز عبور خود را وارد کنید"
        variant="bordered"
        labelPlacement="outside"
        classNames={{
          input: "placeholder:font-light placeholder:text-gray-600 dark:placeholder:text-gray-400",
          inputWrapper:
            "border h-16 !text-sm border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
        }}
        startContent={
          <Icon
            icon="solar:lock-password-linear"
            className="text-gray-600 dark:text-gray-400"
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
            isRequired: (value) => value.length > 0 || "رمز عبور الزامی است",
          },
        })}
      />

      <Button
        isLoading={loading}
        className="bg-primaryThemeColor text-base h-14 sm:h-16 font-semibold w-full text-white rounded-2xl"
        type="submit"
      >
        تایید و ورود
      </Button>

      <button
        type="button"
        onClick={() => setStep("passwordRecovery")}
        className="text-right w-full flex justify-center items-center h-14 sm:h-16 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 border-primaryThemeColor/10 text-sm text-gray-500 dark:text-gray-400 font-semibold rounded-2xl"
      >
        آیا رمز عبور خود را فراموش کرده اید ؟
      </button>
    </form>
  );
};

export default EnterPassword;
