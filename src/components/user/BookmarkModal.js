"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Spinner,
  Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { postData, getData, deleteData } from "@/services/API";
import toast from "react-hot-toast";

const BookmarkModal = ({ isOpen, onClose, projectId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [pendingCollectionId, setPendingCollectionId] = useState(null);
  const [projectCollections, setProjectCollections] = useState([]);

  // Fetch user's collections
  useEffect(() => {
    if (isOpen && projectId) {
      fetchCollections();
      fetchProjectCollections();
    }
  }, [isOpen, projectId]);

  const fetchCollections = async () => {
    try {
      setLoadingCollections(true);
      const res = await getData("/collections");
      if (res.data.success) {
        setCollections(res.data.collections || []);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast.error("خطا در دریافت کالکشن‌ها");
    } finally {
      setLoadingCollections(false);
    }
  };

  const fetchProjectCollections = async () => {
    try {
      const res = await getData(`/collections/project/${projectId}`);
      if (res.data.success) {
        const collectionIds = res.data.collections.map((c) => c._id);
        setProjectCollections(collectionIds);
      }
    } catch (error) {
      console.error("Error fetching project collections:", error);
    }
  };

  const handleCreateAndSave = async () => {
    if (!newCollectionName.trim()) {
      toast.error("نام کالکشن الزامی است");
      return;
    }

    setLoading(true);
    try {
      const res = await postData("/collections", {
        name: newCollectionName.trim(),
        projectId: projectId,
      });

      if (res.data.success) {
        toast.success("کالکشن ایجاد شد و پروژه به آن اضافه شد");
        setNewCollectionName("");
        await fetchCollections();
        await fetchProjectCollections();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.data.message || "خطا در ایجاد کالکشن");
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("خطا در ایجاد کالکشن");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCollection = (collectionId) => {
    // If clicking on the same pending collection, cancel the selection
    if (pendingCollectionId === collectionId) {
      setPendingCollectionId(null);
      setSelectedCollectionId(null);
    } else {
      setPendingCollectionId(collectionId);
      setSelectedCollectionId(collectionId);
    }
  };

  const handleConfirmSelection = async () => {
    if (!pendingCollectionId) return;

    const collectionId = pendingCollectionId;
    
    // Check if project is already in this collection
    if (projectCollections.includes(collectionId)) {
      // Remove from collection
      try {
        setLoading(true);
        const res = await deleteData("/collections/bookmark", {
          collectionId,
          projectId,
        });

        if (res.data.success) {
          toast.success("پروژه از کالکشن حذف شد");
          await fetchProjectCollections();
          setPendingCollectionId(null);
          setSelectedCollectionId(null);
          if (onSuccess) onSuccess();
          setNewCollectionName("");
          onClose();
        } else {
          toast.error(res.data.message || "خطا در حذف بوکمارک");
        }
      } catch (error) {
        console.error("Error removing bookmark:", error);
        toast.error("خطا در حذف بوکمارک");
      } finally {
        setLoading(false);
      }
    } else {
      // Add to collection
      try {
        setLoading(true);
        const res = await postData("/collections/bookmark", {
          collectionId,
          projectId,
        });

        if (res.data.success) {
          toast.success("پروژه به کالکشن اضافه شد");
          await fetchProjectCollections();
          setPendingCollectionId(null);
          setSelectedCollectionId(null);
          if (onSuccess) onSuccess();
          setNewCollectionName("");
          onClose();
        } else {
          toast.error(res.data.message || "خطا در اضافه کردن بوکمارک");
        }
      } catch (error) {
        console.error("Error adding bookmark:", error);
        toast.error("خطا در اضافه کردن بوکمارک");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setNewCollectionName("");
    setSelectedCollectionId(null);
    setPendingCollectionId(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      classNames={{
        wrapper: "overflow-hidden",
        body: "max-h-[65vh] overflow-y-auto",
      }}
    >
      <ModalContent className="bg-white dark:bg-gray-800">
        <ModalHeader className="flex flex-col gap-1 text-gray-900 dark:text-gray-100">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:bookmark-book-bold-duotone"
              width="24"
              height="24"
              className="text-primaryThemeColor"
            />
            <span>افزودن به کالکشن</span>
          </div>
        </ModalHeader>
        <ModalBody className="flex flex-col gap-4">
          {/* Create new collection */}
          <div className="flex flex-col gap-2">
            <Input
              label="ایجاد کالکشن جدید"
              placeholder="مثلاً: پروژه‌های مورد علاقه"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              labelPlacement="outside"
              classNames={{
                input:
                  "text-right placeholder:font-light placeholder:text-gray-600 dark:placeholder:text-gray-400 dark:text-gray-200",
                inputWrapper:
                  "!shadow-none rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus-within:border-primaryThemeColor bg-white dark:bg-gray-700",
                label: "text-gray-700 dark:text-gray-300 font-medium",
              }}
              endContent={
                <Button
                  size="sm"
                  color="primary"
                  className="bg-primaryThemeColor min-w-fit px-3 rounded-lg -ml-2"
                  onClick={handleCreateAndSave}
                  isLoading={loading}
                  isDisabled={!newCollectionName.trim() || loading}
                >
                  ایجاد و ذخیره
                </Button>
              }
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">یا</span>
            </div>
          </div>

          {/* Existing collections */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              انتخاب از کالکشن‌های موجود
            </label>
            {loadingCollections ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" color="primary" />
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                کالکشنی وجود ندارد
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {collections.map((collection) => {
                  const isInCollection = projectCollections.includes(collection._id);
                  const isPending = pendingCollectionId === collection._id;
                  const isPendingForAdd = isPending && !isInCollection;
                  return (
                    <button
                      key={collection._id}
                      onClick={() => handleSelectCollection(collection._id)}
                      disabled={loading}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                        isPending || (isInCollection && !isPending)
                          ? "border-primaryThemeColor bg-primaryThemeColor/5 dark:bg-primaryThemeColor/10"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          icon={
                            isInCollection && !isPending
                              ? "solar:bookmark-bold"
                              : isPendingForAdd
                              ? "solar:bookmark-check-bold"
                              : isPending && isInCollection
                              ? "solar:bookmark-line-duotone"
                              : "solar:bookmark-line-duotone"
                          }
                          width="20"
                          height="20"
                          className={
                            (isPending && !isInCollection) || (isInCollection && !isPending) ? "text-primaryThemeColor" : "text-gray-400 dark:text-gray-500"
                          }
                        />
                        <span
                          className={`font-medium ${
                            (isPending && !isInCollection) || (isInCollection && !isPending)
                              ? "text-primaryThemeColor"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {collection.name || "کالکشن بدون نام"}
                        </span>
                      </div>
                      {isInCollection && !isPending && (
                        <Chip
                          size="sm"
                          color="primary"
                          variant="flat"
                          className="bg-primaryThemeColor/10 text-primaryThemeColor"
                        >
                          در کالکشن
                        </Chip>
                      )}
                      {isPendingForAdd && (
                        <Chip
                          size="sm"
                          color="primary"
                          variant="flat"
                          className="bg-primaryThemeColor/10 text-primaryThemeColor"
                        >
                          اضافه خواهد شد
                        </Chip>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={handleClose}
            disabled={loading}
            className="text-gray-700 dark:text-gray-300"
          >
            بستن
          </Button>
          {pendingCollectionId && (
            <Button
              color="primary"
              onPress={handleConfirmSelection}
              isLoading={loading}
              disabled={loading}
              className="bg-primaryThemeColor"
            >
              تایید
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BookmarkModal;
