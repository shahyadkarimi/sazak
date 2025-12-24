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
        base: "max-w-md",
        backdrop: "bg-black/50",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-warning/15 text-warning rounded-full">
            <Icon icon="solar:danger-triangle-broken" width="24" height="24" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            تغییرات ذخیره نشده
          </h3>
        </ModalHeader>
        <ModalBody className="text-center py-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            {isRefreshWarning
              ? "شما تغییراتی در پروژه خود ایجاد کرده‌اید که هنوز ذخیره نشده‌اند. آیا مطمئن هستید که می‌خواهید صفحه را رفرش کنید؟"
              : "شما تغییراتی در پروژه خود ایجاد کرده‌اید که هنوز ذخیره نشده‌اند. آیا مطمئن هستید که می‌خواهید خارج شوید؟"}
          </p>
        </ModalBody>
        <ModalFooter className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          {!isRefreshWarning && (
            <Button
              variant="light"
              onPress={onClose}
              className="w-full sm:w-auto text-gray-600"
            >
              انصراف
            </Button>
          )}
          <Button
            className="bg-red-500 text-white w-full sm:w-auto hover:bg-red-600"
            onPress={onDiscard}
          >
            {isRefreshWarning ? "رفرش بدون ذخیره" : "خروج بدون ذخیره"}
          </Button>
          {onSave && (
            <Button
              className="bg-primaryThemeColor text-white w-full sm:w-auto"
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

