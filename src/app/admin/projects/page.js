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
  Pagination,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { toFarsiNumber } from "@/helper/helper";
import { siteURL } from "@/services/API";
import Image from "next/image";

const columns = [
  { name: "تصویر پروژه", uid: "image" },
  { name: "نام پروژه", uid: "name" },
  { name: "کاربر", uid: "userName" },
  { name: "شماره موبایل", uid: "userPhoneNumber" },
  { name: "تعداد آبجکت‌ها", uid: "objectsCount" },
  { name: "تاریخ ایجاد", uid: "createdAt" },
];

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin/projects", {
          headers: { "x-auth-token": token ?? "" },
        });
        const data = await res.json();
        if (!data.success) throw new Error();
        setProjects(data.projects || []);
      } catch (e) {
        setError("خطا در دریافت لیست پروژه‌ها");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return projects;
    const q = query.trim().toLowerCase();
    return projects.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        (p.userName || "").toLowerCase().includes(q) ||
        (p.userPhoneNumber || "").toLowerCase().includes(q)
    );
  }, [projects, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [query]);

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
          <h1 className="text-2xl font-bold text-gray-900">لیست پروژه‌ها</h1>
          <p className="text-gray-600">لیست پروژه‌های ثبت شده</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          className="w-72"
          placeholder="جستجو پروژه/کاربر/موبایل..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          startContent={
            <Icon
              icon="solar:minimalistic-magnifer-broken"
              className="text-gray-600"
              width="24"
              height="24"
            />
          }
          classNames={{
            input: "placeholder:font-light placeholder:text-gray-600",
            inputWrapper: "!shadow-none rounded-2xl",
          }}
        />
      </div>

      <Table aria-label="projects table" removeWrapper>
        <TableHeader>
          {columns.map((c) => (
            <TableColumn key={c.uid}>{c.name}</TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent="پروژه‌ای یافت نشد" items={paged}>
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Image
                  src={
                    item.image
                      ? `${siteURL}${item.image}`
                      : "/assets/holder.svg"
                  }
                  alt={item.name}
                  width={200}
                  height={100}
                  className="w-20 h-fit rounded-xl bg-gray-100 "
                />
              </TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.userName}</TableCell>
              <TableCell>{toFarsiNumber(item.userPhoneNumber)}</TableCell>
              <TableCell>{toFarsiNumber(item.objectsCount)}</TableCell>
              <TableCell>
                {new Date(item.createdAt).toLocaleDateString("fa-IR")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* <div className="flex w-full items-center justify-center">
        <Pagination
          page={page}
          total={pages}
          onChange={setPage}
          showControls
          className="mt-2"
        />
      </div> */}
    </div>
  );
};

export default Page;
