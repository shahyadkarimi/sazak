"use client";

import React, { useEffect, useState } from "react";
import { Spinner, Card, CardBody, CardHeader } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useUserStore } from "@/store/UserInfo";
import { toFarsiNumber } from "@/helper/helper";

const Page = () => {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [statsRes, usersRes] = await Promise.all([
          fetch("/api/admin/stats", {
            headers: { "x-auth-token": token ?? "" },
          }),
          fetch("/api/admin/users", {
            headers: { "x-auth-token": token ?? "" },
          }),
        ]);

        const statsData = await statsRes.json();
        const usersData = await usersRes.json();

        if (!statsData.success || !usersData.success) {
          throw new Error("خطا در دریافت اطلاعات");
        }

        setStats(statsData.stats);
        setUsers(usersData.users);
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
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">داشبورد ادمین</h1>
          <p className="text-sm lg:text-base text-gray-600">خلاصه‌ای از وضعیت سیستم و کاربران</p>
        </div>
        <div className="text-xs lg:text-sm text-gray-500">
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
        <Card className="!shadow-none hover:!shadow-lg hover:!shadow-gray-200 border !transition-all">
          <CardHeader>
            <h3 className="text-lg font-semibold">آمار این ماه</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">کاربران جدید</span>
                <span className="font-bold text-lg">{toFarsiNumber(stats?.usersThisMonth ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">پروژه‌های جدید</span>
                <span className="font-bold text-lg">{toFarsiNumber(stats?.projectsThisMonth ?? 0)}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="!shadow-none hover:!shadow-lg hover:!shadow-gray-200 border !transition-all">
          <CardHeader>
            <h3 className="text-lg font-semibold">نرخ رشد</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">رشد کاربران</span>
                <span dir="ltr" className={`font-bold ${stats?.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats?.userGrowth >= 0 ? '+' : ''}{toFarsiNumber(stats?.userGrowth ?? 0)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">رشد پروژه‌ها</span>
                <span dir="ltr" className={`font-bold ${stats?.projectGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats?.projectGrowth >= 0 ? '+' : ''}{toFarsiNumber(stats?.projectGrowth ?? 0)}%
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 7-Day Activity Chart */}
      <Card className="!shadow-none hover:!shadow-lg hover:!shadow-gray-200 border !transition-all">
        <CardHeader>
          <h3 className="text-lg font-semibold">فعالیت ۷ روز گذشته</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
            {stats?.last7Days?.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-500 mb-2">{toFarsiNumber(day.date)}</div>
                <div className="bg-blue-100 rounded-lg p-1 lg:p-2 mb-1">
                  <div className="text-xs lg:text-sm font-semibold text-blue-700">{toFarsiNumber(day.count)}</div>
                  <div className="text-xs text-blue-600">کاربر</div>
                </div>
                <div className="bg-green-100 rounded-lg p-1 lg:p-2">
                  <div className="text-xs lg:text-sm font-semibold text-green-700">
                    {toFarsiNumber(stats?.last7DaysProjects?.[index]?.count || 0)}
                  </div>
                  <div className="text-xs text-green-600">پروژه</div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="!shadow-none hover:!shadow-lg hover:!shadow-gray-200 border !transition-all">
          <CardHeader>
            <h3 className="text-lg font-semibold">کاربران اخیر</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {stats?.recentUsers?.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-right text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-right text-gray-400">#{toFarsiNumber(index + 1)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="!shadow-none hover:!shadow-lg hover:!shadow-gray-200 border !transition-all">
          <CardHeader>
            <h3 className="text-lg font-semibold">پروژه‌های اخیر</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {stats?.recentProjects?.map((project, index) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Icon icon="solar:folder-line-duotone" className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-right font-medium">{project.name}</p>
                      <p className="text-sm text-right text-gray-500">{project.user}</p>
                    </div>
                  </div>
                  <span className="text-xs text-right text-gray-400">
                    {new Date(project.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>


    </div>
  );
};

const StatCard = ({ title, value, icon, trend, trendLabel, percentage }) => (
  <Card className="!shadow-none hover:!shadow-lg hover:!shadow-gray-200 border !transition-all">
    <CardBody className="p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            {icon && <span className="text-xl lg:text-2xl flex items-center">{icon}</span>}
            <p className="text-xs lg:text-sm text-right text-gray-500">{title}</p>
          </div>
          <p className="text-right text-2xl lg:text-3xl font-bold text-gray-900">{toFarsiNumber(value)}</p>
          {percentage && (
            <p className="text-xs lg:text-sm text-right text-gray-600 mt-1">{toFarsiNumber(percentage)}% از کل</p>
          )}
        </div>
        {trend !== undefined && (
          <div className="text-right lg:text-left">
            <div dir="ltr" className={`text-xs lg:text-sm font-medium ${
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend >= 0 ? '+' : ''}{toFarsiNumber(trend)}%
            </div>
            <div className="text-xs text-gray-500">{trendLabel}</div>
          </div>
        )}
      </div>
    </CardBody>
  </Card>
);

export default Page;
