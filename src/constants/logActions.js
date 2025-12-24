export const LogActions = {
  USER_REGISTER: "USER_REGISTER",
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_PASSWORD_RESET_REQUEST: "USER_PASSWORD_RESET_REQUEST",
  USER_PASSWORD_RESET: "USER_PASSWORD_RESET",
  AUTH_VERIFY_OTP: "AUTH_VERIFY_OTP",
  USER_PROFILE_UPDATE: "USER_PROFILE_UPDATE",
  USER_PROFILE_PICTURE_REMOVED: "USER_PROFILE_PICTURE_REMOVED",
  PROJECT_CREATE: "PROJECT_CREATE",
  PROJECT_UPDATE: "PROJECT_UPDATE",
  PROJECT_DELETE: "PROJECT_DELETE",
  PROJECT_PUBLISH: "PROJECT_PUBLISH",
  PROJECT_RESTORE: "PROJECT_RESTORE",
  PROJECT_SHARE: "PROJECT_SHARE",
  ADMIN_USER_UPDATE: "ADMIN_USER_UPDATE",
  ADMIN_USER_TOGGLE_STATUS: "ADMIN_USER_TOGGLE_STATUS",
  ADMIN_USER_IMPERSONATE_START: "ADMIN_USER_IMPERSONATE_START",
  ADMIN_USER_IMPERSONATE_END: "ADMIN_USER_IMPERSONATE_END",
  ADMIN_PROJECT_DELETE: "ADMIN_PROJECT_DELETE",
  ADMIN_SETTINGS_UPDATE: "ADMIN_SETTINGS_UPDATE",
};

export const LogActionLabels = {
  [LogActions.USER_REGISTER]: "ثبت‌نام کاربر جدید",
  [LogActions.USER_LOGIN]: "ورود کاربر",
  [LogActions.USER_LOGOUT]: "خروج کاربر",
  [LogActions.USER_PASSWORD_RESET_REQUEST]: "درخواست بازیابی رمز عبور",
  [LogActions.USER_PASSWORD_RESET]: "بازیابی رمز عبور",
  [LogActions.AUTH_VERIFY_OTP]: "تایید کد یکبار مصرف",
  [LogActions.USER_PROFILE_UPDATE]: "ویرایش پروفایل کاربر",
  [LogActions.USER_PROFILE_PICTURE_REMOVED]: "حذف تصویر پروفایل",
  [LogActions.PROJECT_CREATE]: "ایجاد پروژه جدید",
  [LogActions.PROJECT_UPDATE]: "ویرایش پروژه",
  [LogActions.PROJECT_DELETE]: "حذف پروژه",
  [LogActions.PROJECT_PUBLISH]: "انتشار پروژه",
  [LogActions.PROJECT_RESTORE]: "بازگردانی پروژه",
  [LogActions.PROJECT_SHARE]: "اشتراک‌گذاری پروژه",
  [LogActions.ADMIN_USER_UPDATE]: "ویرایش کاربر توسط ادمین",
  [LogActions.ADMIN_USER_TOGGLE_STATUS]: "تغییر وضعیت کاربر توسط ادمین",
  [LogActions.ADMIN_USER_IMPERSONATE_START]: "شروع ورود موقت به حساب کاربر",
  [LogActions.ADMIN_USER_IMPERSONATE_END]: "پایان ورود موقت به حساب کاربر",
  [LogActions.ADMIN_PROJECT_DELETE]: "حذف پروژه توسط ادمین",
  [LogActions.ADMIN_SETTINGS_UPDATE]: "ویرایش تنظیمات سیستم",
};

















































