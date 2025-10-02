"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Header from "@/components/user/Header";
import Sidebar from "@/components/user/Sidebar";
import React, { useState } from "react";

const Layout = ({ children,  }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const openSidebar = () => {
    setIsSidebarOpen(true);
    setTimeout(() => setIsDrawerVisible(true), 20);
  };

  const closeSidebar = () => {
    setIsDrawerVisible(false);
    setTimeout(() => setIsSidebarOpen(false), 300);
  };

  return (
    <ProtectedRoute>
      <div className="w-full min-h-screen flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile sidebar drawer */}
        {isSidebarOpen && (
          <div className="lg:hidden">
            <div
              className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
                isDrawerVisible ? "opacity-100" : "opacity-0"
              }`}
              onClick={closeSidebar}
            />
            <div
              className={`fixed top-0 right-0 z-50 h-full w-72 max-w-[80vw] transform transition-transform duration-300 ease-in-out ${
                isDrawerVisible ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <Sidebar />
            </div>
          </div>
        )}

        <div className="w-full flex flex-col">
          <Header onOpenSidebar={openSidebar} />

          <div className="h-[calc(100%-80px)] bg-gray-100/70 rounded-tr-3xl p-4 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Layout;
