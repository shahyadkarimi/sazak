"use client";

import { toFarsiNumber } from "@/helper/helper";
import { postData } from "@/services/API";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const ResendTimer = ({ userInfo, min, sec, url }) => {
  const [minutes, setMinutes] = useState(min);
  const [seconds, setSeconds] = useState(sec);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let myInterval = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
      }
      if (seconds === 0) {
        if (minutes === 0) {
          clearInterval(myInterval);
        } else {
          setMinutes(minutes - 1);
          setSeconds(59);
        }
      }
    }, 1000);
    return () => {
      clearInterval(myInterval);
    };
  });

  const resendVerficationCode = () => {
    setLoading(true);

    postData(url || "/auth/phone-number", { phoneNumber: userInfo.phoneNumber })
      .then((res) => {
        setLoading(false);

        setMinutes(2);
        setSeconds(30);
      })
      .catch((err) => {
        setLoading(false);

        toast.error(err.response.data.message || "خطا هنگام دریافت مجدد کد تایید", {
          duration: 3000,
        });
      });
  };

  console.log(minutes);

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <Toaster />

      {minutes === 0o0 && seconds === 0o0 ? (
        <div
          onClick={resendVerficationCode}
          className="text-sm font-semibold text-gray-500 cursor-pointer flex items-center gap-2"
        >
          <i
            className={`fi fi-rr-refresh text-base h-4 ${
              loading ? "animate-spinner-ease-spin" : ""
            }`}
          ></i>

          <span>ارسال مجدد کد تایید</span>
        </div>
      ) : (
        <span className="text-sm font-semibold text-gray-500">
          {minutes < 10
            ? `${toFarsiNumber(0)}${toFarsiNumber(minutes)}`
            : toFarsiNumber(minutes)}
          :
          {seconds < 10
            ? `${toFarsiNumber(0)}${toFarsiNumber(seconds)}`
            : toFarsiNumber(seconds)}{" "}
          تا ارسال مجدد کد تایید
        </span>
      )}
    </div>
  );
};

export default ResendTimer;
