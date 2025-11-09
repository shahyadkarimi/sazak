"use client";

import { useCallback, useEffect, useState } from "react";

const initialState = {
  siteName: "سازک",
  siteEmail: "",
  siteDescription: "آموزشگاه رباتیک سازک",
  logo: "/assets/logo.png",
  maintenanceMode: false,
  maintenanceMessage: "",
};

export const useSettings = () => {
  const [settings, setSettings] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setSettings({
          siteName: data.setting.siteName || initialState.siteName,
          siteEmail: data.setting.siteEmail || "",
          siteDescription: data.setting.siteDescription || initialState.siteDescription,
          logo: data.setting.logo || initialState.logo,
          maintenanceMode: Boolean(data.setting.maintenanceMode),
          maintenanceMessage: data.setting.maintenanceMessage || "",
        });
        setError("");
      } else {
        setError(data.message || "خطا در دریافت تنظیمات");
      }
    } catch (err) {
      setError("خطا در دریافت تنظیمات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { settings, loading, error, reload: load };
};

