"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { Icon } from "@iconify/react";

const UnsavedChangesWarningModal = ({
  isOpen,
  onClose,
  onDiscard,
  onSave,
  isLoading,
  isRefreshWarning = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      placement="center"
      hideCloseButton
      classNames={{
        base: "max-w-md bg-white dark:bg-gray-800",
        backdrop: "bg-black/50",
        wrapper: "dark:bg-black/50",
      }}
    >
      <ModalContent className="bg-white dark:bg-gray-800">
        <ModalHeader className="flex flex-col gap-1 text-center bg-white dark:bg-gray-800">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-warning/15 dark:bg-warning/20 text-warning rounded-full">
            <Icon icon="solar:danger-triangle-broken" width="24" height="24" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            تغییرات ذخیره نشده
          </h3>
        </ModalHeader>
        <ModalBody className="text-center py-4 bg-white dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {isRefreshWarning
              ? "شما تغییراتی در پروژه خود ایجاد کرده‌اید که هنوز ذخیره نشده‌اند. آیا مطمئن هستید که می‌خواهید صفحه را رفرش کنید؟"
              : "شما تغییراتی در پروژه خود ایجاد کرده‌اید که هنوز ذخیره نشده‌اند. آیا مطمئن هستید که می‌خواهید خارج شوید؟"}
          </p>
        </ModalBody>
        <ModalFooter className="flex flex-col gap-2 sm:flex-row sm:gap-3 bg-white dark:bg-gray-800">
          {!isRefreshWarning && (
            <Button
              variant="light"
              onPress={onClose}
              className="w-full sm:w-auto text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              انصراف
            </Button>
          )}
          <Button
            className="bg-red-500 dark:bg-red-600 text-white w-full sm:w-auto hover:bg-red-600 dark:hover:bg-red-700"
            onPress={onDiscard}
          >
            {isRefreshWarning ? "رفرش بدون ذخیره" : "خروج بدون ذخیره"}
          </Button>
          {onSave && (
            <Button
              className="bg-primaryThemeColor dark:bg-primaryThemeColor text-white w-full sm:w-auto hover:opacity-90"
              onPress={onSave}
              isLoading={isLoading}
              loadingText="در حال ذخیره..."
            >
              {isRefreshWarning ? "ذخیره و رفرش" : "ذخیره و خروج"}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UnsavedChangesWarningModal;

