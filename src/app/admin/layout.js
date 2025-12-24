"use client";

import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import { Toaster } from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="w-full flex relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 right-0 z-50 lg:z-auto
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </div>

      {/* Main Content */}
      <div className="w-full flex flex-col lg:mr-0">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="p-4 lg:p-6 bg-gray-50 dark:bg-[#0c1320] min-h-[calc(100vh-64px)]">
          {children}
        </div>
      </div>

      <Toaster />
    </div>
  );
};

export default Layout;
