"use client";

import { useUserStore } from "@/store/UserInfo";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const ProtectedRoute = ({ children, fallback }) => {
  const { user, loading } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user?._id) {
        router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Spinner
          label="لطفا صبر کنید..."
          classNames={{
            circle1: "border-b-primaryThemeColor",
            circle2: "border-b-primaryThemeColor",
          }}
        />
      </div>
    );
  }

  if (!user?._id) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
