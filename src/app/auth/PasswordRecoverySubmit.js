import { toFarsiNumber } from "@/helper/helper";
import { saveSession } from "@/lib/auth";
import { postData } from "@/services/API";
import { useUserStore } from "@/store/UserInfo";
import { Button, Input, InputOtp } from "@heroui/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { TbEditCircle } from "react-icons/tb";
import ResendTimer from "./ResendTimer";
import { Icon } from "@iconify/react";

const PasswordRecoverySubmit = ({ userInfo, setUserInfo, step, setStep }) => {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      vcode: "",
      password: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, setUser } = useUserStore();
  const router = useRouter();

  const backPhoneStepHandler = () => {
    setStep("passwordRecovery");
  };

  const passwordRecoverySubmitHandler = (data) => {
    setLoading(true);

    postData("/user/reset-password", { ...data, ...userInfo })
      .then((res) => {
        // setLoading(false);

        // navigate user to dashboard
        toast.success("تغییر رمز عبور با موفقیت انجام شد، درحال انتقال...", {
          duration: 3000,
        });

        // save token in cookie
        saveSession(res.data.token);

        localStorage.setItem("token", res.data.token);

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
      onSubmit={handleSubmit(passwordRecoverySubmitHandler)}
      className="w-full flex flex-col gap-8"
    >
      <Toaster />

      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-black">رمز عبور جدید</h1>
        <p className="text-sm text-center font-semibold text-gray-500/90">
          کد ۵ رقمی پیامک شده به شماره{" "}
          {toFarsiNumber(userInfo.phoneNumber || "9120000000")} را در کادر زیر
          وارد نمایید، سپس رمز عبور جدید خود را ثبت کنید
        </p>
      </div>

      <div className="w-full flex flex-col gap-0">
        <InputOtp
          length={5}
          size="lg"
          variant="bordered"
          radius="lg"
          classNames={{
            base: "w-full",
            wrapper: "w-full",
            segmentWrapper: "w-full flex-row-reverse gap-4 pt-0 pb-2",
            segment:
              "border w-full h-16 !text-sm border-gray-300 text-gray-600 data-[active=true]:border-primaryThemeColor data-[active=true]:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
            errorMessage: "font-normal",
          }}
          isInvalid={errors.vcode ? true : false}
          errorMessage="کد تایید الزامی است"
          {...register("vcode", { required: true })}
          autoComplete="one-time-code"
        />

        <div className="w-full flex items-center justify-between -mt-1">
          <ResendTimer
            min={1}
            sec={30}
            userInfo={userInfo}
            url={"/user/change-password"}
          />

          <button
            onClick={backPhoneStepHandler}
            className="text-sm font-semibold text-primaryThemeColor"
          >
            تغییر شماره موبایل
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Input
          placeholder="رمز عبور خود را وارد کنید"
          variant="bordered"
          labelPlacement="outside"
          classNames={{
            input: "placeholder:font-light placeholder:text-gray-600",
            inputWrapper:
              "border h-16 !text-sm border-gray-300 text-gray-600 data-[hover=true]:border-primaryThemeColor focus-within:!border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
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
                value.length > 0 || "رمز عبور الزامی است",
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

      <div className="w-full flex items-center gap-2">
        <Button
          isLoading={loading}
          type="submit"
          className="bg-primaryThemeColor text-base h-16 font-semibold w-3/4 text-white rounded-2xl"
        >
          تایید و ورود
        </Button>

        <button
          onClick={backPhoneStepHandler}
          className="text-right w-1/4 flex justify-center items-center gap-2 h-16 bg-white border border-primaryThemeColor/10 text-sm text-gray-500 font-semibold rounded-2xl"
        >
          <span>بازگشت</span>
          <Icon
            icon="solar:arrow-left-linear"
            width="20"
            height="20"
            className="text-primaryThemeColor"
          />
        </button>
      </div>
    </form>
  );
};

export default PasswordRecoverySubmit;
