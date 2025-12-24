"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Pagination,
  Spinner,
  Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { LogActionLabels } from "@/constants/logActions";
import { toFarsiNumber } from "@/helper/helper";

const columns = [
  { name: "عملیات", uid: "action" },
  { name: "انجام‌دهنده", uid: "performedBy" },
  { name: "هدف", uid: "target" },
  { name: "اطلاعات تکمیلی", uid: "metadata" },
  { name: "آی‌پی / مرورگر", uid: "context" },
  { name: "زمان", uid: "createdAt" },
];

const PAGE_SIZE = 20;

const roleLabels = {
  admin: "ادمین",
  user: "کاربر",
};

const targetTypeLabels = {
  user: "کاربر",
  project: "پروژه",
  auth: "احراز هویت",
};

const getPhoneNumberFromLog = (log) =>
  log?.target?.phoneNumber ||
  log?.target?.ownerPhone ||
  log?.performedBy?.phoneNumber ||
  log?.metadata?.phoneNumber ||
  "";

const Page = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadLogs = async () => {
      try {
        setLoading(true);
        setError("");
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("impersonation_token") ||
              localStorage.getItem("token")
            : "";

        const response = await fetch(
          `/api/admin/logs?page=${page}&limit=${PAGE_SIZE}`,
          {
            headers: {
              "x-auth-token": token ?? "",
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "خطا در دریافت فعالیت‌ها");
        }

        setLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotalItems(data.pagination?.total ?? 0);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("خطا در دریافت فعالیت‌ها");
        }
      } finally {
        setLoading(false);
      }
    };

    loadLogs();

    return () => controller.abort();
  }, [page]);

  const renderPerformedBy = (performedBy) => {
    if (!performedBy) return "-";
    const name = [performedBy.name, performedBy.familyName]
      .filter(Boolean)
      .join(" ");
    const role = roleLabels[performedBy.role] || "";
    const phone = performedBy.phoneNumber ? toFarsiNumber(performedBy.phoneNumber) : "";

    return (
      <div className="flex flex-col gap-1 text-right">
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {name || toFarsiNumber(performedBy.userId) || "کاربر"}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {role}
          {role && phone ? " / " : ""}
          {phone}
        </span>
      </div>
    );
  };

  const renderTarget = (target) => {
    if (!target) return "-";

    const typeLabel = targetTypeLabels[target.type] || "اطلاعات";
    const name =
      target.name ||
      target.userName ||
      target.ownerName ||
      (target.firstName && `${target.firstName} ${target.lastName}`) ||
      "";

    return (
      <div className="flex flex-col gap-1 text-right">
        <Chip radius="sm" size="sm" className="self-start" color="secondary">
          {typeLabel}
        </Chip>
        {name && <span className="text-xs text-gray-600 dark:text-gray-400">نام: {name}</span>}
      </div>
    );
  };

  const renderMetadata = (log) => {
    const phone = getPhoneNumberFromLog(log);

    if (!phone) {
      return <span className="text-xs text-gray-500 dark:text-gray-400">بدون اطلاعات اضافی</span>;
    }

    return (
      <span className="text-xs text-gray-600 dark:text-gray-400">
        شماره تلفن: {toFarsiNumber(phone)}
      </span>
    );
  };

  const renderContext = (context) => {
    if (!context) return "-";
    return (
      <div className="flex flex-col gap-1 text-right">
        {context.ip && (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            <Icon
              icon="solar:map-point-wave-line-duotone"
              className="inline-block h-4 w-4 text-gray-500 dark:text-gray-400 ml-1 align-middle"
            />
            IP: {context.ip}
          </span>
        )}
        {context.userAgent && (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            <Icon
              icon="solar:monitor-line-duotone"
              className="inline-block h-4 w-4 text-gray-500 dark:text-gray-400 ml-1 align-middle"
            />
            {context.userAgent}
          </span>
        )}
      </div>
    );
  };

  const renderCreatedAt = (createdAt) => {
    if (!createdAt) return "-";
    return new Date(createdAt).toLocaleString("fa-IR");
  };

  const getActionLabel = (action) =>
    LogActionLabels[action] || action || "بدون عنوان";

  const tableContent = useMemo(() => {
    if (loading) {
      return (
        <TableBody
          emptyContent={
            <div className="flex items-center justify-center py-10">
              <Spinner
                label="در حال بارگذاری..."
                classNames={{
                  circle1: "border-b-primaryThemeColor",
                  circle2: "border-b-primaryThemeColor",
                }}
              />
            </div>
          }
        />
      );
    }

    if (error) {
      return (
        <TableBody
          emptyContent={
            <div className="py-10 text-center text-red-600">{error}</div>
          }
        />
      );
    }

    if (!logs.length) {
      return (
        <TableBody
          emptyContent={
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              فعالیتی برای نمایش وجود ندارد.
            </div>
          }
        />
      );
    }

    return (
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>
              <div className="flex flex-col gap-1 text-right">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {getActionLabel(log.action)}
                </span>
              </div>
            </TableCell>
            <TableCell>{renderPerformedBy(log.performedBy)}</TableCell>
            <TableCell>{renderTarget(log.target)}</TableCell>
            <TableCell>{renderMetadata(log)}</TableCell>
            <TableCell>{renderContext(log.context)}</TableCell>
            <TableCell>{renderCreatedAt(log.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  }, [logs, loading, error]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
            فعالیت‌های اخیر
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            نظارت بر فعالیت‌های کلیدی کاربران و ادمین‌ها
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs lg:text-sm text-gray-500 dark:text-gray-400">
          <Chip color="secondary" variant="flat">
            مجموع فعالیت‌ها: {toFarsiNumber(totalItems)}
          </Chip>
          <Chip variant="flat">
            صفحه {toFarsiNumber(page)} از {toFarsiNumber(totalPages)}
          </Chip>
        </div>
      </div>

      <Card className="!shadow-none border dark:border-gray-700 hover:!shadow-lg hover:!shadow-gray-200 dark:hover:!shadow-gray-800 transition-all bg-white dark:bg-gray-800">
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              لیست فعالیت‌ها
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              آخرین فعالیت‌ها به ترتیب زمان
            </p>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <Table aria-label="لیست فعالیت‌ها" removeWrapper>
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.uid} className="text-right">
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            {tableContent}
          </Table>
        </CardBody>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            dir="ltr"
            showControls
            page={page}
            total={totalPages}
            onChange={setPage}
            initialPage={1}
            color="primary"
          />
        </div>
      )}
    </div>
  );
};

export default Page;

