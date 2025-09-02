"use client";

import { useUserStore } from "@/store/UserInfo";
import { useEffect, useState } from "react";

export const AuthProvider = ({ userData }) => {
  const { setUser, setLoading } = useUserStore();

  useEffect(() => {
    if (userData.success) {
      setUser(userData.user);
      setLoading(false);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [userData]);

  return null;
};
