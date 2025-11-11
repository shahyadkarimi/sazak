"use client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useUserStore } from "@/store/UserInfo";

const Home = () => {
  const { user } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (user?.id) {
      router.push("/user");
    } else {
      router.push("/auth");
    }
  }, [user]);

  return <div className="w-full flex flex-col items-center"></div>;
};

export default Home;
