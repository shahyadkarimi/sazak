import ProtectedRoute from "@/components/auth/ProtectedRoute";
import React from "react";

const Layout = ({ children }) => {
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

export default Layout;
