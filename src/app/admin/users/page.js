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
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { toFarsiNumber } from "@/helper/helper";
import EditUserModal from "@/components/admin/EditUserModal";
import DeleteUserModal from "@/components/admin/DeleteUserModal";
import AddUserModal from "@/components/admin/AddUserModal";
import toast from "react-hot-toast";
import { useUserStore } from "@/store/UserInfo";

const columns = [
  { name: "نام", uid: "name" },
  { name: "نام خانوادگی", uid: "familyName" },
  { name: "شماره موبایل", uid: "phoneNumber" },
  { name: "نقش", uid: "role" },
  { name: "وضعیت", uid: "isActive" },
  { name: "تاریخ ثبت‌نام", uid: "createdAt" },
  { name: "عملیات", uid: "actions" },
];

const Page = () => {
  const { setUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [impersonatingId, setImpersonatingId] = useState(null);

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

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleToggleStatus = async (user) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/admin/users/${user.id}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({ isActive: !user.isActive }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update the user in the local state
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === user.id ? { ...u, isActive: !u.isActive } : u
          )
        );
        toast.success(data.message);
      } else {
        toast.error(data.message || "خطا در تغییر وضعیت کاربر");
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("خطا در تغییر وضعیت کاربر");
    }
  };

  const getStoredToken = () => {
    if (typeof window === "undefined") return "";

    try {
      const localToken =
        localStorage.getItem("impersonation_token") ||
        localStorage.getItem("token");

      if (localToken) {
        return localToken;
      }

      const cookieString = document.cookie || "";
      const cookies = cookieString.split(";").map((cookie) => cookie.trim());
      const impersonationCookie = cookies.find((cookie) =>
        cookie.startsWith("impersonation_token=")
      );

      if (impersonationCookie) {
        const [, value] = impersonationCookie.split("=");
        try {
          return decodeURIComponent(value);
        } catch (error) {
          return value;
        }
      }

      return "";
    } catch (error) {
      return "";
    }
  };

  const handleImpersonateUser = async (user) => {
    const token = getStoredToken();

    setImpersonatingId(user.id);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/impersonate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "خطا هنگام ورود به حساب کاربر");
        return;
      }

      localStorage.setItem("impersonation_token", data.token);
      setUser({})

      toast.success("ورود به حساب کاربر انجام شد؛ در حال تازه‌سازی...");
      window.location.href = "/auth/impersonate?token=" + encodeURIComponent(data.token);
    } catch (error) {
      console.error("Impersonation error:", error);
      toast.error("خطا هنگام ورود به حساب کاربر");
    } finally {
      setImpersonatingId(null);
    }
  };

  const handleEditSuccess = (updatedUser) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
  };

  const handleDeleteSuccess = () => {
    setUsers((prevUsers) => prevUsers.filter((u) => u.id !== selectedUser.id));
  };

  const handleAddSuccess = (newUser) => {
    setUsers((prevUsers) => [newUser, ...prevUsers]);
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
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">لیست کاربران</h1>
          <p className="text-sm lg:text-base text-gray-600">لیست کاربران ثبت شده</p>
        </div>
        <Button
          color="primary"
          className="bg-primaryThemeColor w-full lg:w-auto"
          startContent={<Icon icon="solar:user-plus-line-duotone" width="20" height="20" />}
          onPress={() => setAddModalOpen(true)}
        >
          افزودن کاربر
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="کل کاربران" value={stats?.totalUsers ?? users.length} />
        <Stat title="کاربران فعال" value={stats?.activeUsers ?? 0} />
        <Stat title="ادمین‌ها" value={stats?.adminUsers ?? 0} />
        <Stat title="کل پروژه‌ها" value={stats?.totalProjects ?? 0} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <Input
            className="w-full sm:w-64"
            label="جستجو"
            placeholder="جستجو کاربر..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            startContent={
              <Icon icon="solar:minimalistic-magnifer-broken" width="20" height="20" />
            }
            classNames={{
              input: "placeholder:font-light placeholder:text-gray-600",
              inputWrapper: "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
              label: "text-gray-700 font-medium",
            }}
            labelPlacement="outside"
          />
          <div className="flex gap-2">
            <Select
              selectedKeys={new Set([role])}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] ?? "all";
                setRole(value);
              }}
              className="w-full sm:w-40"
              label="نقش"
              labelPlacement="outside"
              classNames={{
                trigger: "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                label: "text-gray-700 font-medium",
              }}
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
              selectedKeys={new Set([status])}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] ?? "all";
                setStatus(value);
              }}
              className="w-full sm:w-40"
              label="وضعیت"
              labelPlacement="outside"
              classNames={{
                trigger: "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
                label: "text-gray-700 font-medium",
              }}
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
      </div>

      <div className="overflow-x-auto">
        <Table aria-label="users table" removeWrapper>
          <TableHeader>
            {columns.map((c) => (
              <TableColumn key={c.uid}>{c.name}</TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent="کاربری یافت نشد" items={paged}>
            {(item) => (
              <TableRow key={item.id}>
                <TableCell className="text-sm">{item.name}</TableCell>
                <TableCell className="text-sm">{item.familyName}</TableCell>
                <TableCell className="text-sm">{toFarsiNumber(item.phoneNumber)}</TableCell>
                <TableCell className="text-sm">{item.role === "admin" ? "ادمین" : "کاربر"}</TableCell>
                <TableCell>
                  <button onClick={() => handleToggleStatus(item)}>
                    <Chip
                      size="sm"
                      color={item.isActive ? "success" : "danger"}
                      variant="flat"
                    >
                      {item.isActive ? "فعال" : "غیرفعال"}
                    </Chip>
                  </button>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 lg:gap-2">
                    <Button
                      size="sm"
                      variant="light"
                      color="secondary"
                      className="min-w-0 px-1 lg:px-2"
                      onPress={() => handleImpersonateUser(item)}
                      isLoading={impersonatingId === item.id}
                    >
                      <Icon
                        icon="solar:login-3-line-duotone"
                        width="14"
                        height="14"
                        className="lg:w-4 lg:h-4"
                      />
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      onPress={() => handleEditUser(item)}
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
                      color="danger"
                      className="min-w-0 px-1 lg:px-2"
                      onPress={() => handleDeleteUser(item)}
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
      <AddUserModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <EditUserModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={selectedUser}
        onSuccess={handleEditSuccess}
      />

      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        user={selectedUser}
        onSuccess={handleDeleteSuccess}
      />
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
