"use client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const Home = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/user");
  }, []);

  return <div className="w-full flex flex-col items-center"></div>;
};

export default Home;
