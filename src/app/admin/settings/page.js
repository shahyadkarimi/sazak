"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Switch,
  Button,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import toast from "react-hot-toast";

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    siteName: "",
    siteEmail: "",
    siteDescription: "",
    maintenanceMode: false,
    maintenanceMessage: "",
    logo: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin/settings", {
          headers: { "x-auth-token": token ?? "" },
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error();
        }
        setFormData({
          siteName: data.setting.siteName || "",
          siteEmail: data.setting.siteEmail || "",
          siteDescription: data.setting.siteDescription || "",
          maintenanceMode: Boolean(data.setting.maintenanceMode),
          maintenanceMessage: data.setting.maintenanceMessage || "",
          logo: data.setting.logo || "",
        });
        setLogoPreview(data.setting.logo || "");
      } catch (error) {
        toast.error("خطا در دریافت تنظیمات");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!logoFile) {
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [logoFile]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      let logoUrl = formData.logo;
      if (logoFile) {
        setUploading(true);
        const token = localStorage.getItem("token");
        const body = new FormData();
        body.append("logo", logoFile);
        const uploadRes = await fetch("/api/admin/settings/upload-logo", {
          method: "POST",
          headers: { "x-auth-token": token ?? "" },
          body,
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          throw new Error(uploadData.message || "خطا در آپلود لوگو");
        }
        logoUrl = uploadData.logo;
        setFormData((prev) => ({ ...prev, logo: logoUrl }));
        toast.success("لوگو بروزرسانی شد");
      }
      const token = localStorage.getItem("token");
      const payload = {
        siteName: formData.siteName,
        siteEmail: formData.siteEmail,
        siteDescription: formData.siteDescription,
        maintenanceMode: formData.maintenanceMode,
        maintenanceMessage: formData.maintenanceMessage,
        logo: logoUrl,
      };
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token ?? "",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "خطا در ذخیره تنظیمات");
      }
      setFormData({
        siteName: data.setting.siteName || "",
        siteEmail: data.setting.siteEmail || "",
        siteDescription: data.setting.siteDescription || "",
        maintenanceMode: Boolean(data.setting.maintenanceMode),
        maintenanceMessage: data.setting.maintenanceMessage || "",
        logo: data.setting.logo || "",
      });
      setLogoPreview(data.setting.logo || "");
      setLogoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("تنظیمات ذخیره شد");
    } catch (error) {
      toast.error(error.message || "خطا در بروزرسانی تنظیمات");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleRemoveLogoSelection = () => {
    setLogoFile(null);
    setLogoPreview(formData.logo || "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const logoContent = useMemo(() => {
    if (logoPreview) {
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">
            <Image
              src={
                logoPreview.startsWith("blob:")
                  ? logoPreview
                  : logoPreview || "/assets/logo.png"
              }
              alt="logo preview"
              fill
              className="object-contain p-2"
            />
          </div>
          {logoPreview.startsWith("blob:") && (
            <Button
              color="danger"
              variant="flat"
              onPress={handleRemoveLogoSelection}
              className="rounded-xl"
            >
              حذف انتخاب
            </Button>
          )}
        </div>
      );
    }
    return (
      <div className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
        لوگو انتخاب نشده است
      </div>
    );
  }, [logoPreview, formData.logo]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner
          label="در حال بارگذاری تنظیمات..."
          classNames={{
            circle1: "border-b-primaryThemeColor",
            circle2: "border-b-primaryThemeColor",
          }}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-gray-900">تنظیمات وب‌سایت</h1>
        <p className="text-sm text-gray-600">
          اطلاعات کلی سایت، لوگو و حالت تعمیر را مدیریت کنید
        </p>
      </div>

      <Card className="border !shadow-none hover:!shadow-lg hover:!shadow-gray-200 transition-all">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon
              icon="solar:buildings-line-duotone"
              className="h-6 w-6 text-primaryThemeColor"
            />
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-gray-900">
                اطلاعات عمومی
              </h2>
              <span className="text-xs text-gray-500">
                اطلاعات نمایش داده شده به کاربران
              </span>
            </div>
          </div>
        </CardHeader>
        <div className="border-b border-gray-200" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-right">
            <Input
              label="نام سایت"
              labelPlacement="outside"
              placeholder="نام سایت را وارد کنید"
              value={formData.siteName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, siteName: e.target.value }))
              }
              required
              classNames={{
                input:
                  "text-right placeholder:text-gray-500 focus-visible:ring-0",
                inputWrapper:
                  "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                label: "text-gray-700 font-medium",
              }}
            />
            <Input
              label="ایمیل سایت"
              labelPlacement="outside"
              placeholder="ایمیل رسمی سایت"
              value={formData.siteEmail}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, siteEmail: e.target.value }))
              }
              classNames={{
                input:
                  "text-right placeholder:text-gray-500 focus-visible:ring-0",
                inputWrapper:
                  "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                label: "text-gray-700 font-medium",
              }}
            />
          </div>
          <Textarea
            label="توضیحات سایت"
            labelPlacement="outside"
            placeholder="توضیحات کوتاه درباره سایت را وارد کنید"
            value={formData.siteDescription}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                siteDescription: e.target.value,
              }))
            }
            minRows={3}
            classNames={{
              input:
                "text-right placeholder:text-gray-500 focus-visible:ring-0",
              inputWrapper:
                "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
              label: "text-gray-700 font-medium text-right",
            }}
          />
        </CardBody>
      </Card>

      <Card className="border !shadow-none hover:!shadow-lg hover:!shadow-gray-200 transition-all">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon
              icon="solar:image-bold-duotone"
              className="h-6 w-6 text-primaryThemeColor"
            />
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-gray-900">لوگو</h2>
              <span className="text-xs text-gray-500">
                لوگوی اصلی سایت را بارگذاری کنید
              </span>
            </div>
          </div>
        </CardHeader>
        <div className="border-b border-gray-200" />
        <CardBody className="space-y-4">
          {logoContent}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-600 transition-all hover:border-primaryThemeColor md:w-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setLogoFile(file);
                  }
                }}
              />
              <Icon icon="solar:upload-linear" className="h-5 w-5" />
              انتخاب لوگو جدید
            </label>
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Spinner
                  size="sm"
                  classNames={{
                    circle1: "border-b-primaryThemeColor",
                    circle2: "border-b-primaryThemeColor",
                  }}
                />
                در حال آپلود لوگو
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="border !shadow-none hover:!shadow-lg hover:!shadow-gray-200 transition-all">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon
              icon="solar:shield-warning-line-duotone"
              className="h-6 w-6 text-primaryThemeColor"
            />
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-gray-900">
                حالت تعمیر
              </h2>
              <span className="text-xs text-gray-500">
                نمایش صفحه تعمیر برای کاربران عادی
              </span>
            </div>
          </div>
          <Switch
            isSelected={formData.maintenanceMode}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, maintenanceMode: value }))
            }
            classNames={{
              base: "rounded-full",
              thumb: "bg-white",
            }}
          >
            {formData.maintenanceMode ? "فعال" : "غیرفعال"}
          </Switch>
        </CardHeader>
        <div className="border-b border-gray-200" />
        <CardBody>
          <Textarea
            label="پیام حالت تعمیر"
            labelPlacement="outside"
            placeholder="پیام مورد نظر برای نمایش به کاربران را وارد کنید"
            value={formData.maintenanceMessage}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                maintenanceMessage: e.target.value,
              }))
            }
            minRows={4}
            classNames={{
              input:
                "text-right placeholder:text-gray-500 focus-visible:ring-0",
              inputWrapper:
                "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
              label: "text-gray-700 font-medium text-right",
            }}
          />
        </CardBody>
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
        <Button
          type="button"
          variant="flat"
          className="rounded-xl"
          onPress={() => {
            handleRemoveLogoSelection();
          }}
        >
          انصراف
        </Button>
        <Button
          color="primary"
          type="submit"
          className="rounded-xl bg-primaryThemeColor"
          isLoading={saving}
          spinner={
            <Spinner
              size="sm"
              classNames={{
                circle1: "border-b-white",
                circle2: "border-b-white",
              }}
            />
          }
        >
          ذخیره تنظیمات
        </Button>
      </div>
    </form>
  );
};

export default Page;
