"use client";

import { redirect } from "next/navigation";
import React from "react";
import { usePathname } from "next/navigation";

const CheckMaintenance = ({ maintenanceMode }) => {
  const pathname = usePathname();

  if (
    maintenanceMode &&
    pathname !== "/maintenance" &&
    !pathname?.startsWith("/admin")
  ) {
    redirect("/maintenance");
  }

  return null;
};

export default CheckMaintenance;
