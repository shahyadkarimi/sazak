"use client";

import React, { useEffect, useState } from "react";
import { Spinner, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useUserStore } from "@/store/UserInfo";
import { toFarsiNumber } from "@/helper/helper";
import { LogActionLabels } from "@/constants/logActions";

const targetTypeLabels = {
  user: "کاربر",
  project: "پروژه",
  auth: "احراز هویت",
};

const Page = () => {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [statsRes, usersRes, logsRes] = await Promise.all([
          fetch("/api/admin/stats", {
            headers: { "x-auth-token": token ?? "" },
          }),
          fetch("/api/admin/users", {
            headers: { "x-auth-token": token ?? "" },
          }),
          fetch("/api/admin/logs?page=1&limit=6", {
            headers: { "x-auth-token": token ?? "" },
          }),
        ]);

        const statsData = await statsRes.json();
        const usersData = await usersRes.json();
        const logsData = await logsRes.json();

        if (!statsData.success || !usersData.success || !logsData.success) {
          throw new Error("خطا در دریافت اطلاعات");
        }

        setStats(statsData.stats);
        setUsers(usersData.users);
        setLogs(logsData.logs || []);
      } catch (err) {
        setError("خطا در بارگذاری اطلاعات");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Spinner
          label="در حال بارگذاری..."
          classNames={{
            circle1: "border-b-primaryThemeColor",
            circle2: "border-b-primaryThemeColor",
          }}
        />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">داشبورد ادمین</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">خلاصه‌ای از وضعیت سیستم و کاربران</p>
        </div>
        <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
          آخرین بروزرسانی: {new Date().toLocaleDateString("fa-IR")}
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="کل کاربران" 
          value={stats?.totalUsers ?? 0} 
          icon={<Icon icon="solar:users-group-rounded-line-duotone" className="w-6 h-6 text-blue-600" />}
          trend={stats?.userGrowth}
          trendLabel="این ماه"
        />
        <StatCard 
          title="کاربران فعال" 
          value={stats?.activeUsers ?? 0} 
          icon={<Icon icon="solar:check-circle-line-duotone" className="w-6 h-6 text-green-600" />}
          percentage={stats?.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}
        />
        <StatCard 
          title="کل پروژه‌ها" 
          value={stats?.totalProjects ?? 0} 
          icon={<Icon icon="solar:folder-line-duotone" className="w-6 h-6 text-yellow-600" />}
          trend={stats?.projectGrowth}
          trendLabel="این ماه"
        />
        <StatCard 
          title="ادمین‌ها" 
          value={stats?.adminUsers ?? 0} 
          icon={<Icon icon="solar:crown-line-duotone" className="w-6 h-6 text-purple-600" />}
        />
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="!shadow-none hover:!shadow-lg hover:!shadow-gray-200 dark:hover:!shadow-gray-800 border dark:border-gray-700 !transition-all bg-white dark:bg-gray-800">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">آمار این ماه</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">کاربران جدید</span>
                <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{toFarsiNumber(stats?.usersThisMonth ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">پروژه‌های جدید</span>
                <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{toFarsiNumber(stats?.projectsThisMonth ?? 0)}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="!shadow-none hover:!shadow-lg hover:!shadow-gray-200 dark:hover:!shadow-gray-800 border dark:border-gray-700 !transition-all bg-white dark:bg-gray-800">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">نرخ رشد</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">رشد کاربران</span>
                <span dir="ltr" className={`font-bold ${stats?.userGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stats?.userGrowth >= 0 ? '+' : ''}{toFarsiNumber(stats?.userGrowth ?? 0)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">رشد پروژه‌ها</span>
                <span dir="ltr" className={`font-bold ${stats?.projectGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stats?.projectGrowth >= 0 ? '+' : ''}{toFarsiNumber(stats?.projectGrowth ?? 0)}%
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 7-Day Activity Chart */}
      <Card className="!shadow-none hover:!shadow-lg hover:!shadow-gray-200 dark:hover:!shadow-gray-800 border dark:border-gray-700 !transition-all bg-white dark:bg-gray-800">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">فعالیت ۷ روز گذشته</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
            {stats?.last7Days?.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{toFarsiNumber(day.date)}</div>
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-1 lg:p-2 mb-1">
                  <div className="text-xs lg:text-sm font-semibold text-blue-700 dark:text-blue-300">{toFarsiNumber(day.count)}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">کاربر</div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-1 lg:p-2">
                  <div className="text-xs lg:text-sm font-semibold text-green-700 dark:text-green-300">
                    {toFarsiNumber(stats?.last7DaysProjects?.[index]?.count || 0)}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">پروژه</div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="!shadow-none hover:!shadow-lg hover:!shadow-gray-200 dark:hover:!shadow-gray-800 border dark:border-gray-700 !transition-all bg-white dark:bg-gray-800">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">کاربران اخیر</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {stats?.recentUsers?.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-300 font-semibold text-sm">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                      <p className="text-sm text-right text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-right text-gray-400 dark:text-gray-500">#{toFarsiNumber(index + 1)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="!shadow-none hover:!shadow-lg hover:!shadow-gray-200 dark:hover:!shadow-gray-800 border dark:border-gray-700 !transition-all bg-white dark:bg-gray-800">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">پروژه‌های اخیر</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {stats?.recentProjects?.map((project, index) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Icon icon="solar:folder-line-duotone" className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-right font-medium text-gray-900 dark:text-gray-100">{project.name}</p>
                      <p className="text-sm text-right text-gray-500 dark:text-gray-400">{project.user}</p>
                    </div>
                  </div>
                  <span className="text-xs text-right text-gray-400 dark:text-gray-500">
                    {new Date(project.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="!shadow-none hover:!shadow-lg hover:!shadow-gray-200 dark:hover:!shadow-gray-800 border dark:border-gray-700 !transition-all bg-white dark:bg-gray-800">
        <CardHeader>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">فعالیت‌های اخیر سیستم</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              آخرین فعالیت‌های مهم برای پایش سریع
            </p>
          </div>
        </CardHeader>
        <CardBody>
          {logs.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              فعالیتی برای نمایش وجود ندارد.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const label = LogActionLabels[log.action] || log.action;
                const actorName = log.performedBy
                  ? [log.performedBy.name, log.performedBy.familyName].filter(Boolean).join(" ") ||
                    log.performedBy.username ||
                    log.performedBy.userName ||
                    log.performedBy.fullName ||
                    ""
                  : "";
                const actor = actorName || (log.performedBy ? "کاربر" : "سیستم");
                const targetName = log.target
                  ? log.target.name ||
                    log.target.userName ||
                    log.target.ownerName ||
                    (log.target.firstName && log.target.lastName
                      ? `${log.target.firstName} ${log.target.lastName}`
                      : log.target.firstName || log.target.lastName) ||
                    log.target.fullName ||
                    ""
                  : "";
                const targetType = log.target?.type;
                const targetLabel = targetType ? targetTypeLabels[targetType] || targetType : "";
                const target = targetName || targetLabel;

                return (
                  <div
                    key={log.id}
                    className="flex items-start justify-between rounded-lg border dark:border-gray-700 border-gray-100 bg-gray-50 dark:bg-gray-700/50 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primaryThemeColor/10 dark:bg-primaryThemeColor/20 text-primaryThemeColor">
                        <Icon icon="solar:history-line-duotone" className="h-5 w-5" />
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{label}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            توسط {actor}
                            {target ? ` — ${target}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(log.createdAt).toLocaleString("fa-IR")}</span>
                      {log.context?.ip && (
                        <Chip size="sm" variant="flat" className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          IP: {log.context.ip}
                        </Chip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>


    </div>
  );
};

const StatCard = ({ title, value, icon, trend, trendLabel, percentage }) => (
  <Card className="!shadow-none hover:!shadow-lg hover:!shadow-gray-200 dark:hover:!shadow-gray-800 border dark:border-gray-700 !transition-all bg-white dark:bg-gray-800">
    <CardBody className="p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            {icon && <span className="text-xl lg:text-2xl flex items-center">{icon}</span>}
            <p className="text-xs lg:text-sm text-right text-gray-500 dark:text-gray-400">{title}</p>
          </div>
          <p className="text-right text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{toFarsiNumber(value)}</p>
          {percentage && (
            <p className="text-xs lg:text-sm text-right text-gray-600 dark:text-gray-400 mt-1">{toFarsiNumber(percentage)}% از کل</p>
          )}
        </div>
        {trend !== undefined && (
          <div className="text-right lg:text-left">
            <div dir="ltr" className={`text-xs lg:text-sm font-medium ${
              trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {trend >= 0 ? '+' : ''}{toFarsiNumber(trend)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{trendLabel}</div>
          </div>
        )}
      </div>
    </CardBody>
  </Card>
);

export default Page;
