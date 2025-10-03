"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Select,
  SelectItem,
  Pagination,
  Chip,
  Spinner,
} from "@heroui/react";
import { toFarsiNumber } from "@/helper/helper";

const columns = [
  { name: "نام", uid: "name" },
  { name: "نام خانوادگی", uid: "familyName" },
  { name: "شماره موبایل", uid: "phoneNumber" },
  { name: "نقش", uid: "role" },
  { name: "وضعیت", uid: "isActive" },
  { name: "تاریخ ثبت‌نام", uid: "createdAt" },
];

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin/users", {
          headers: { "x-auth-token": token ?? "" },
        });
        const data = await res.json();
        if (!data.success) throw new Error();
        setUsers(data.users || []);
        setStats(data.stats || null);
      } catch (e) {
        setError("خطا در دریافت لیست کاربران");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = [...users];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.familyName?.toLowerCase().includes(q) ||
          (u.fullName?.toLowerCase() || "").includes(q) ||
          u.phoneNumber?.toLowerCase().includes(q)
      );
    }
    if (role !== "all") {
      result = result.filter((u) => u.role === role);
    }
    if (status !== "all") {
      const isActive = status === "active";
      result = result.filter((u) => u.isActive === isActive);
    }
    return result;
  }, [users, query, role, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [query, role, status]);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لیست کاربران</h1>
          <p className="text-gray-600">لیست کاربران ثبت شده</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="کل کاربران" value={stats?.totalUsers ?? users.length} />
        <Stat title="کاربران فعال" value={stats?.activeUsers ?? 0} />
        <Stat title="ادمین‌ها" value={stats?.adminUsers ?? 0} />
        <Stat title="کل پروژه‌ها" value={stats?.totalProjects ?? 0} />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <Input
            className="w-64"
            placeholder="جستجو کاربر..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            startContent={<span className="text-gray-500">🔎</span>}
          />
          <Select
            selectedKeys={[role]}
            onChange={(e) => setRole(e.target.value)}
            className="w-40"
            label="نقش"
          >
            <SelectItem key="all" value="all">
              همه نقش‌ها
            </SelectItem>
            <SelectItem key="user" value="user">
              کاربر
            </SelectItem>
            <SelectItem key="admin" value="admin">
              ادمین
            </SelectItem>
          </Select>
          <Select
            selectedKeys={[status]}
            onChange={(e) => setStatus(e.target.value)}
            className="w-40"
            label="وضعیت"
          >
            <SelectItem key="all" value="all">
              همه وضعیت‌ها
            </SelectItem>
            <SelectItem key="active" value="active">
              فعال
            </SelectItem>
            <SelectItem key="inactive" value="inactive">
              غیرفعال
            </SelectItem>
          </Select>
        </div>
      </div>

      <Table aria-label="users table" removeWrapper>
        <TableHeader>
          {columns.map((c) => (
            <TableColumn key={c.uid}>{c.name}</TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent="کاربری یافت نشد" items={paged}>
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.familyName}</TableCell>
              <TableCell className="font-mono">{item.phoneNumber}</TableCell>
              <TableCell>{item.role === "admin" ? "ادمین" : "کاربر"}</TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={item.isActive ? "success" : "default"}
                  variant="flat"
                >
                  {item.isActive ? "فعال" : "غیرفعال"}
                </Chip>
              </TableCell>
              <TableCell>
                {new Date(item.createdAt).toLocaleDateString("fa-IR")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex w-full items-center justify-center">
        <Pagination
          page={page}
          total={pages}
          onChange={setPage}
          showControls
          className="mt-2"
        />
      </div>
    </div>
  );
};

const Stat = ({ title, value }) => (
  <div className="!shadow-none hover:!shadow-lg hover:!shadow-gray-200 border !transition-all p-4 rounded-2xl bg-white">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="mt-2 text-2xl font-bold">{toFarsiNumber(value)}</div>
  </div>
);

export default Page;



