import ProtectedRoute from "@/components/auth/ProtectedRoute";
import React from "react";

const Layout = ({ children }) => {
  return (
    <ProtectedRoute>
      <div className="w-full bg-gray-100/70">{children}</div>
    </ProtectedRoute>
  );
};

export default Layout;
