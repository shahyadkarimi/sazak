import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Header from "@/components/user/Header";
import Sidebar from "@/components/user/Sidebar";
import { headers } from "next/headers";
import React from "react";

const Layout = ({ children,  }) => {
  return (
    <ProtectedRoute>
      <div className="w-full min-h-screen flex">
        <Sidebar />

        <div className="w-full flex flex-col">
          <Header />

          <div className="h-[calc(100%-80px)] bg-gray-100/70 rounded-tr-3xl p-4 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Layout;
