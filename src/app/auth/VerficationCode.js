import { toFarsiNumber } from "@/helper/helper";
import { postData } from "@/services/API";
import { Button, Input, InputOtp } from "@heroui/react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { TbEditCircle } from "react-icons/tb";
import ResendTimer from "./ResendTimer";
import { Icon } from "@iconify/react";

const VeficationCode = ({ userInfo, setUserInfo, step, setStep }) => {
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
      vcode: "",
    },
  });

  const [loading, setLoading] = useState(false);

  const code = watch("vcode");

  const backPhoneStepHandler = () => {
    setStep("phone");
  };

  const enterVerficationCodeHandler = (data) => {
    setLoading(true);

    postData("/user/check-code", {
      ...data,
      vcode: code,
      phone_number: userInfo.phone_number,
    })
      .then((res) => {
        setLoading(false);

        // set user phone number for next step
        setUserInfo((prev) => ({ ...prev, ...data, vcode: code }));

        // go to next step after verify code was correct
        setStep("completeRegister");
      })
      .catch((err) => {
        setLoading(false);

        toast.error(
          err.response.data.message || "خطا هنگام تایید شماره موبایل",
          {
            duration: 3000,
          }
        );
      });
  };

  useEffect(() => {
    if (code.length === 5) {
      enterVerficationCodeHandler();
    }
  }, [code]);

  return (
    <div className="w-full flex flex-col gap-8">
      <Toaster />

      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-black">تایید شماره موبایل</h1>
        <p className="text-sm font-semibold text-gray-500/90">
          کد ۵ رقمی پیامک شده به شماره{" "}
          {toFarsiNumber(userInfo.phoneNumber || "9120000000")} را در کادر زیر
          وارد نمایید
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
              "border w-full h-16 !text-sm border-gray-300 text-gray-600 data-[hover=true]:border-primaryThemeColor focus-within:ring-4 ring-primaryThemeColor/15 !shadow-none rounded-2xl !transition-all",
            errorMessage: "font-normal",
          }}
          isInvalid={errors.vcode ? true : false}
          errorMessage="کد تائید اجباری میباشد"
          {...register("vcode", { required: true })}
          autoComplete="one-time-code"
        />

        <div className="w-full flex items-center justify-between -mt-1">
          <ResendTimer min={1} sec={30} userInfo={userInfo} />

          <button
            onClick={backPhoneStepHandler}
            className="text-sm font-semibold text-primaryThemeColor"
          >
            تغییر شماره موبایل{" "}
          </button>
        </div>
      </div>

      <div className="w-full flex items-center gap-2">
        <Button
          isLoading={loading}
          onClick={handleSubmit(enterVerficationCodeHandler)}
          className="bg-primaryThemeColor text-base h-16 font-semibold w-3/4 text-white rounded-2xl"
        >
          تائید و ادامه
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
    </div>
  );
};

export default VeficationCode;
