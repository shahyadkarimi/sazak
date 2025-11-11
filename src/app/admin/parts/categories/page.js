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
  Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import AddCategoryModal from "@/components/admin/AddCategoryModal";
import EditCategoryModal from "@/components/admin/EditCategoryModal";
import DeleteCategoryModal from "@/components/admin/DeleteCategoryModal";

const columns = [
  { name: "نام", uid: "name" },
  { name: "توضیحات", uid: "description" },
  { name: "تاریخ ایجاد", uid: "createdAt" },
  { name: "عملیات", uid: "actions" },
];

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/parts/categories", {
        headers: { "x-auth-token": token ?? "" },
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      setCategories(data.categories || []);
    } catch (e) {
      setError("خطا در دریافت لیست دسته‌بندی‌ها");
      toast.error("خطا در دریافت لیست دسته‌بندی‌ها");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name?.toLowerCase().includes(query.toLowerCase())
  );

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setEditModalOpen(true);
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  const handleAddSuccess = (newCategory) => {
    setCategories((prev) => [newCategory, ...prev]);
  };

  const handleEditSuccess = (updatedCategory) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
    );
  };

  const handleDeleteSuccess = () => {
    setCategories((prev) =>
      prev.filter((c) => c.id !== selectedCategory.id)
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
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            دسته‌بندی‌های قطعات
          </h1>
          <p className="text-sm lg:text-base text-gray-600">
            مدیریت دسته‌بندی‌های قطعات
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
          افزودن دسته‌بندی
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input
          className="w-full sm:w-64"
          label="جستجو"
          placeholder="جستجو دسته‌بندی..."
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
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <Table aria-label="Categories table" removeWrapper>
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} align="start">
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={filteredCategories}
            emptyContent="دسته‌بندی‌ای یافت نشد"
          >
            {(category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="font-medium text-gray-900">{category.name}</div>
                </TableCell>
                <TableCell>
                  <div className="text-gray-600">
                    {category.description || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-500">
                    {new Date(category.createdAt).toLocaleDateString("fa-IR")}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleEdit(category)}
                      className="text-primaryThemeColor"
                    >
                      <Icon icon="solar:pen-line-duotone" width="18" height="18" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleDelete(category)}
                      className="text-red-600"
                    >
                      <Icon icon="solar:trash-bin-trash-line-duotone" width="18" height="18" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddCategoryModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <EditCategoryModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSuccess={handleEditSuccess}
      />

      <DeleteCategoryModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default Page;

