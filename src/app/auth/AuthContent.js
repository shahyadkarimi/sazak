"use client";

import React, { useState } from "react";
import LoginForm from "./LoginForm";
import { Icon } from "@iconify/react";

const AuthContent = () => {
  const [showLogin, setShowLogin] = useState(false);

  if (!showLogin) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-8 py-12">
        <div className="w-full flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            خوش آمدید
          </h1>
          <p className="text-lg text-gray-600 max-w-md">
            به آموزشگاه رباتیک سازک خوش آمدید
            <br />
            برای شروع طراحی و استفاده از امکانات، وارد حساب کاربری خود شوید
          </p>
        </div>

        <button
          onClick={() => setShowLogin(true)}
          className="w-full max-w-xs h-14 bg-primaryThemeColor text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-primaryThemeColor/90 transition-colors shadow-lg hover:shadow-xl"
        >
          <span>شروع طراحی</span>
          <Icon icon="solar:arrow-right-linear" width="24" height="24" className="rotate-180" />
        </button>
      </div>
    );
  }

  return <LoginForm />;
};

export default AuthContent;

