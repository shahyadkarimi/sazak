"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/react";
import toast from "react-hot-toast";
import { useUserStore } from "@/store/UserInfo";

const ImpersonatePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const { setUser } = useUserStore();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setError("توکن ورود یافت نشد");
      return;
    }

    const startImpersonation = async () => {
      try {
        const response = await fetch("/api/auth/impersonate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.message || "خطا در ورود موقت");
          return;
        }

        try {
          const profileResponse = await fetch("/api/user/profile", {
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token,
            },
          });

          const profileData = await profileResponse.json();
          if (profileData?.success && profileData?.user) {
            setUser(profileData.user);
          } else {
            console.warn("Failed to load impersonated user profile");
          }
        } catch (profileError) {
          console.error("Failed to fetch impersonated profile:", profileError);
        }

        toast.success("ورود به حساب کاربر انجام شد");
        router.push("/user");
      } catch (err) {
        console.error("Impersonation error:", err);
        setError("خطا در ورود به حساب کاربر");
      }
    };

    startImpersonation();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white px-8 py-6 shadow-lg">
        <Spinner
          label="در حال ورود به حساب کاربر..."
          classNames={{
            circle1: "border-b-primaryThemeColor",
            circle2: "border-b-primaryThemeColor",
          }}
        />
        <p className="text-sm text-gray-500">لطفاً چند لحظه صبر کنید</p>
      </div>
    </div>
  );
};

export default ImpersonatePage;
