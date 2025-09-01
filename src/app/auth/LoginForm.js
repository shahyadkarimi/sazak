"use client";

import React, { useState } from "react";
import PhoneNumber from "./PhoneNumber";
import VeficationCode from "./VerficationCode";
import CompleteRegister from "./CompleteRegister";
import EnterPassword from "./EnterPassword";
import PasswordRecovery from "./PasswordRecovery";
import PasswordRecoverySubmit from "./PasswordRecoverySubmit";

const LoginForm = () => {
  const [step, setStep] = useState("phone");
  const [userInfo, setUserInfo] = useState({});

  return (
    <div className="w-full">
      {step === "phone" ? (
        <PhoneNumber
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          setStep={setStep}
        />
      ) : step === "code" ? (
        <VeficationCode
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          setStep={setStep}
        />
      ) : step === "completeRegister" ? (
        <CompleteRegister
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          setStep={setStep}
        />
      ) : step === "password" ? (
        <EnterPassword userInfo={userInfo} setStep={setStep} />
      ) : step === "passwordRecovery" ? (
        <PasswordRecovery
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          setStep={setStep}
        />
      ) : step === "passwordRecoverySubmit" ? (
        <PasswordRecoverySubmit
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          setStep={setStep}
        />
      ) : (
        ""
      )}
    </div>
  );
};

export default LoginForm;
