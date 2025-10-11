import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import { Toaster } from "react-hot-toast";
import React from "react";

const Layout = ({ children }) => {
  return (
    <div className="w-full flex">
      <Sidebar />

      <div className="w-full flex flex-col">
        <Header />

        <div className="p-4 lg:p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
          {children}
        </div>
      </div>

      <Toaster />
    </div>
  );
};

export default Layout;
