import { toFarsiNumber } from "@/helper/helper";
import { postData } from "@/services/API";
import { Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";

const PasswordRecovery = ({ userInfo, setUserInfo, step, setStep }) => {
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
    mode: "onSubmit",
    defaultValues: {
      phone_number: userInfo?.phone_number || "",
    },
  });
  const [loading, setLoading] = useState(false);

  const enterPhoneNumberHandler = (data) => {
    setLoading(true);

    postData("/user/change-password", { ...data })
      .then((res) => {
        setLoading(false);

        // set user phone number for next step of password recovery
        setUserInfo(data);

        // go to next step after phone number was correct
        setStep("passwordRecoverySubmit");
      })
      .catch((err) => {
        setLoading(false);

        toast.error(err.response.data.message, {
          duration: 3000,
        });
      });
  };

  return (
    <form
      onSubmit={handleSubmit(enterPhoneNumberHandler)}
      className="w-full flex flex-col gap-8"
    >
      <Toaster />

      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-black">بازیابی رمز عبور</h1>
        <p className="text-sm font-semibold text-gray-500/90">
          شماره موبایل خود را وارد کنید تا کد تائید برایتان ارسال شود
        </p>
      </div>

      <Toaster />

      <Input
        id="phoneNumber"
        type="text"
        placeholder="شماره موبایل شما"
        variant="bordered"
        labelPlacement="outside"
        startContent={
          <Icon
            icon="solar:phone-linear"
            width="24"
            height="24"
            className="text-gray-600"
          />
        }
        classNames={{
          input: "placeholder:font-light placeholder:text-gray-600",
          inputWrapper:
            "border h-16 !text-sm border-gray-300 text-gray-600 data-[hover=true]:border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
        }}
        isInvalid={errors.phoneNumber ? true : false}
        errorMessage={errors?.phoneNumber?.message}
        {...register("phoneNumber", {
          validate: {
            isRequired: (value) =>
              value.length > 0 || "شماره تلفن اجباری میباشد",
            isNumber: (value) =>
              /^[0-9\b]+$/.test(value) || "فرمت شماره تلفن صحیح نمیباشد",
          },
        })}
      />

      <Button
        isLoading={loading}
        className="bg-primaryThemeColor text-base h-16 font-semibold w-full text-white rounded-2xl"
        type="submit"
      >
        ارسال کد تائید
      </Button>

      <button
        onClick={() => setStep("phone")}
        className="text-right w-full flex justify-center items-center h-16 bg-gray-100 border border-primaryThemeColor/10 text-sm text-gray-500 font-semibold rounded-2xl"
      >
        ورود به حساب کاربری
      </button>
    </form>
  );
};

export default PasswordRecovery;
