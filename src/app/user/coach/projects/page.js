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
  Spinner,
  Button,
  Chip,
  Select,
  SelectItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { toFarsiNumber } from "@/helper/helper";
import { siteURL } from "@/services/API";
import Image from "next/image";
import EditProjectModal from "@/components/admin/EditProjectModal";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const columns = [
  { name: "تصویر پروژه", uid: "image" },
  { name: "نام پروژه", uid: "name" },
  { name: "کاربر", uid: "userName" },
  { name: "شماره موبایل", uid: "userPhoneNumber" },
  { name: "تعداد آبجکت‌ها", uid: "objectsCount" },
  { name: "وضعیت", uid: "isPublic" },
  { name: "تاریخ ایجاد", uid: "createdAt" },
  { name: "عملیات", uid: "actions" },
];

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/coach/projects", {
          headers: { "x-auth-token": token ?? "" },
        });
        const data = await res.json();
        if (!data.success) {
          if (data.message?.includes("دسترسی")) {
            router.push("/user");
            return;
          }
          throw new Error();
        }
        setProjects(data.projects || []);
        setUsers(data.users || []);
      } catch (e) {
        setError("خطا در دریافت لیست پروژه‌ها");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const filtered = useMemo(() => {
    let result = [...projects];
    
    // Filter by user
    if (selectedUser !== "all") {
      result = result.filter((p) => p.userId === selectedUser);
    }
    
    // Filter by search query
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          (p.userName || "").toLowerCase().includes(q) ||
          (p.userPhoneNumber || "").toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [projects, query, selectedUser]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [query, selectedUser]);

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setEditModalOpen(true);
  };

  const handleEditSuccess = (updatedProject) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const handleViewProject = (projectId) => {
    window.open(`${siteURL}/design-studio/project/${projectId}`, "_blank");
  };

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
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
            پروژه‌های کاربران
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            مدیریت و ویرایش پروژه‌های کاربران تحت نظارت شما
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <Input
            className="w-full sm:w-64"
            label="جستجو"
            placeholder="جستجو پروژه..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            startContent={
              <Icon icon="solar:minimalistic-magnifer-broken" width="20" height="20" />
            }
            classNames={{
              input: "placeholder:font-light placeholder:text-gray-600 dark:placeholder:text-gray-400 dark:text-gray-200",
              inputWrapper: "!shadow-none rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus-within:border-primaryThemeColor bg-white dark:bg-gray-700",
              label: "text-gray-700 dark:text-gray-300 font-medium",
            }}
            labelPlacement="outside"
          />
          {users.length > 0 && (
            <Select
              label="فیلتر بر اساس کاربر"
              placeholder="همه کاربران"
              selectedKeys={selectedUser ? new Set([selectedUser]) : new Set(["all"])}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                setSelectedUser(value === "all" ? "all" : value);
              }}
              className="w-full sm:w-48"
              labelPlacement="outside"
              classNames={{
                trigger: "!shadow-none rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus-within:border-primaryThemeColor bg-white dark:bg-gray-700",
                label: "text-gray-700 dark:text-gray-300 font-medium",
              }}
            >
              <SelectItem key="all" value="all">
                همه کاربران
              </SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.fullName}
                </SelectItem>
              ))}
            </Select>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
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
                  {item.image ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Icon
                        icon="solar:folder-with-files-line-duotone"
                        width="24"
                        height="24"
                        className="text-gray-400"
                      />
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-900 dark:text-gray-100">
                  {item.name}
                </TableCell>
                <TableCell className="text-sm text-gray-900 dark:text-gray-100">
                  {item.userName}
                </TableCell>
                <TableCell className="text-sm text-gray-900 dark:text-gray-100">
                  {toFarsiNumber(item.userPhoneNumber)}
                </TableCell>
                <TableCell className="text-sm text-gray-900 dark:text-gray-100">
                  {toFarsiNumber(item.objectsCount)}
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    color={item.isPublic ? "success" : "default"}
                    variant="flat"
                  >
                    {item.isPublic ? "عمومی" : "خصوصی"}
                  </Chip>
                </TableCell>
                <TableCell className="text-sm text-gray-900 dark:text-gray-100">
                  {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 lg:gap-2">
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      onPress={() => handleViewProject(item.id)}
                      className="min-w-0 px-1 lg:px-2"
                    >
                      <Icon
                        icon="solar:eye-line-duotone"
                        width="14"
                        height="14"
                        className="lg:w-4 lg:h-4"
                      />
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      color="secondary"
                      onPress={() => handleEditProject(item)}
                      className="min-w-0 px-1 lg:px-2"
                    >
                      <Icon
                        icon="solar:pen-2-line-duotone"
                        width="14"
                        height="14"
                        className="lg:w-4 lg:h-4"
                      />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      <EditProjectModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        project={selectedProject}
        onSuccess={handleEditSuccess}
        apiPath="/api/coach/projects"
      />
    </div>
  );
};

export default Page;

