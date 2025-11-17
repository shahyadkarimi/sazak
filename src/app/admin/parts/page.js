"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Spinner,
  Select,
  SelectItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import Image from "next/image";
import AddPartModal from "@/components/admin/AddPartModal";
import EditPartModal from "@/components/admin/EditPartModal";
import DeletePartModal from "@/components/admin/DeletePartModal";

const columns = [
  { name: "تصویر", uid: "thumbnail" },
  { name: "نام", uid: "name" },
  { name: "دسته‌بندی", uid: "category" },
  { name: "تاریخ ایجاد", uid: "createdAt" },
  { name: "عملیات", uid: "actions" },
];

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);

  useEffect(() => {
    loadCategories();
    loadParts();
  }, []);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/parts/categories", {
        headers: { "x-auth-token": token ?? "" },
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error("Error loading categories:", e);
    }
  };

  const loadParts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url =
        selectedCategory !== "all"
          ? `/api/admin/parts?category=${selectedCategory}`
          : "/api/admin/parts";
      const res = await fetch(url, {
        headers: { "x-auth-token": token ?? "" },
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      setParts(data.parts || []);
    } catch (e) {
      setError("خطا در دریافت لیست قطعات");
      toast.error("خطا در دریافت لیست قطعات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParts();
  }, [selectedCategory]);

  const filteredParts = parts.filter((p) =>
    p.name?.toLowerCase().includes(query.toLowerCase())
  );

  const handleEdit = (part) => {
    setSelectedPart(part);
    setEditModalOpen(true);
  };

  const handleDelete = (part) => {
    setSelectedPart(part);
    setDeleteModalOpen(true);
  };

  const handleAddSuccess = (newPart) => {
    setParts((prev) => [newPart, ...prev]);
  };

  const handleEditSuccess = (updatedPart) => {
    setParts((prev) =>
      prev.map((p) => (p.id === updatedPart.id ? updatedPart : p))
    );
  };

  const handleDeleteSuccess = () => {
    setParts((prev) => prev.filter((p) => p.id !== selectedPart.id));
  };

  if (loading && parts.length === 0) {
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
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            همه قطعات
          </h1>
          <p className="text-sm lg:text-base text-gray-600">
            مدیریت قطعات و مدل‌های GLB
          </p>
        </div>
        <Button
          color="primary"
          className="bg-primaryThemeColor w-full lg:w-auto"
          startContent={
            <Icon icon="solar:add-circle-line-duotone" width="20" height="20" />
          }
          onPress={() => setAddModalOpen(true)}
        >
          افزودن قطعه
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <Input
            className="w-full sm:w-64"
            label="جستجو"
            placeholder="جستجو قطعه..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            startContent={
              <Icon icon="solar:minimalistic-magnifer-broken" width="20" height="20" />
            }
            classNames={{
              input: "placeholder:font-light placeholder:text-gray-600",
              inputWrapper:
                "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
              label: "text-gray-700 font-medium",
            }}
            labelPlacement="outside"
          />
          <Select
            selectedKeys={new Set([selectedCategory])}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] ?? "all";
              setSelectedCategory(value);
            }}
            className="w-full sm:w-48"
            label="دسته‌بندی"
            labelPlacement="outside"
            classNames={{
              trigger:
                "!shadow-none rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primaryThemeColor",
              label: "text-gray-700 font-medium",
            }}
          >
            <SelectItem key="all" value="all">
              همه دسته‌بندی‌ها
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <Table aria-label="Parts table" removeWrapper>
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} align="start">
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={filteredParts} emptyContent="قطعه‌ای یافت نشد">
            {(part) => (
              <TableRow key={part.id}>
                <TableCell>
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                    {part.thumbnailPath ? (
                      <Image
                        src={part.thumbnailPath}
                        alt={part.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    ) : (
                      <Icon
                        icon="solar:file-line-duotone"
                        width="24"
                        height="24"
                        className="text-gray-400"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900">{part.name}</div>
                </TableCell>
                <TableCell>
                  <div className="text-gray-600">{part.category?.name || "-"}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-500">
                    {new Date(part.createdAt).toLocaleDateString("fa-IR")}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleEdit(part)}
                      className="text-primaryThemeColor"
                    >
                      <Icon icon="solar:pen-line-duotone" width="18" height="18" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleDelete(part)}
                      className="text-red-600"
                    >
                      <Icon
                        icon="solar:trash-bin-trash-line-duotone"
                        width="18"
                        height="18"
                      />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddPartModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
        categories={categories}
        onCategoryAdded={loadCategories}
      />

      <EditPartModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedPart(null);
        }}
        part={selectedPart}
        onSuccess={handleEditSuccess}
        categories={categories}
        onCategoryAdded={loadCategories}
      />

      <DeletePartModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedPart(null);
        }}
        part={selectedPart}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default Page;

