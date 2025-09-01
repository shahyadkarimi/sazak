"use client";
import React, { createContext, useEffect, useState } from "react";

export const UserContext = createContext();

const UserProvider = ({ children, userData, token }) => {
  const [user, setUser] = useState(userData)

  useEffect(() => {
    localStorage.setItem("token", token);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>
  );
};

export default UserProvider;
