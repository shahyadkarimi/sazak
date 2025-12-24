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
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { toFarsiNumber } from "@/helper/helper";
import { siteURL } from "@/services/API";
import Image from "next/image";
import EditProjectModal from "@/components/admin/EditProjectModal";
import DeleteProjectModal from "@/components/admin/DeleteProjectModal";
import { useRouter } from "next/navigation";

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

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const router = useRouter();

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

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setEditModalOpen(true);
  };

  const handleDeleteProject = (project) => {
    setSelectedProject(project);
    setDeleteModalOpen(true);
  };

  const handleEditSuccess = (updatedProject) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const handleDeleteSuccess = () => {
    setProjects((prevProjects) =>
      prevProjects.filter((p) => p.id !== selectedProject.id)
    );
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
            لیست پروژه‌ها
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            لیست پروژه‌های ثبت شده
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          className="w-full sm:w-72"
          label="جستجو"
          placeholder="جستجو پروژه/کاربر/موبایل..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          startContent={
            <Icon
              icon="solar:minimalistic-magnifer-broken"
              className="text-gray-600 dark:text-gray-400"
              width="20"
              height="20"
            />
          }
          classNames={{
            input: "placeholder:font-light placeholder:text-gray-600 dark:placeholder:text-gray-400 dark:text-gray-200",
            inputWrapper:
              "!shadow-none rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus-within:border-primaryThemeColor bg-white dark:bg-gray-700",
            label: "text-gray-700 dark:text-gray-300 font-medium",
          }}
          labelPlacement="outside"
        />
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
                  <Image
                    src={item.image || "/assets/holder.svg"}
                    alt={item.name}
                    width={200}
                    height={100}
                    className="w-16 h-12 lg:w-20 lg:h-fit rounded-xl bg-gray-100 dark:bg-gray-700"
                  />
                </TableCell>
                <TableCell className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {item.name}
                </TableCell>
                <TableCell className="text-sm text-gray-700 dark:text-gray-300">{item.userName}</TableCell>
                <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                  {toFarsiNumber(item.userPhoneNumber)}
                </TableCell>
                <TableCell className="text-sm text-gray-700 dark:text-gray-300">
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
                <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                  {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 lg:gap-2">
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
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

                    <Button
                      size="sm"
                      variant="light"
                      color="secondary"
                      className="min-w-0 px-1 lg:px-2"
                      onPress={() =>
                        typeof window !== "undefined" &&
                        window.open(
                          `/design-studio/project/${item.id}`,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <Icon
                        icon="solar:ruler-cross-pen-broken"
                        width="16"
                        height="16"
                        className="lg:w-4 lg:h-4"
                      />
                    </Button>

                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      className="min-w-0 px-1 lg:px-2"
                      onPress={() => handleDeleteProject(item)}
                    >
                      <Icon
                        icon="solar:trash-bin-minimalistic-line-duotone"
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

      <div className="flex w-full items-center justify-center">
        {/* <Pagination
          page={page}
          total={pages}
          onChange={setPage}
          showControls
          className="mt-2"
        /> */}
      </div>

      {/* Modals */}
      <EditProjectModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        project={selectedProject}
        onSuccess={handleEditSuccess}
      />

      <DeleteProjectModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        project={selectedProject}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default Page;
