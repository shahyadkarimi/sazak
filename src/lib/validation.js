import { z } from "zod";

export const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "شماره موبایل الزامی است")
    .regex(/^09\d{9}$/, { error: "شماره موبایل نامعتبر است" }),
});

export const verifyOTPSchema = z.object({
  phoneNumber: phoneSchema.shape.phoneNumber,
  code: z.string().min(1, "کد فعال‌سازی الزامی است"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "نام الزامی است"),
  familyName: z.string().min(1, "نام خانوادگی الزامی است"),
  phoneNumber: phoneSchema.shape.phoneNumber,
  password: z
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .regex(/[A-Za-z]/, "رمز عبور باید حداقل شامل یک حرف باشد")
    .regex(/\d/, "رمز عبور باید حداقل شامل یک عدد باشد"),
});

export const loginSchema = z.object({
  phoneNumber: phoneSchema.shape.phoneNumber,
  password: z.string().min(6, "رمز عبور باید حداقل 6 کاراکتر باشد"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "نام الزامی است").optional(),
  familyName: z.string().min(1, "نام خانوادگی الزامی است").optional(),
  email: z
    .string()
    .trim()
    .email("ایمیل نامعتبر است")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(500, "آدرس نباید بیشتر از ۵۰۰ کاراکتر باشد").optional().or(z.literal("")),
  province: z.string().trim().max(100, "استان نامعتبر است").optional().or(z.literal("")),
  city: z.string().trim().max(100, "شهر نامعتبر است").optional().or(z.literal("")),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ تولد نامعتبر است")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .regex(/[A-Za-z]/, "رمز عبور باید حداقل شامل یک حرف باشد")
    .regex(/\d/, "رمز عبور باید حداقل شامل یک عدد باشد")
    .optional()
    .or(z.literal("")),
  profilePicture: z.string().optional(),
});

export const newProjectSchema = z.object({
  name: z.string().min(1, "نام پروژه الزامی است"),
  description: z.string().optional(),
});

export const editProjectSchema = z.object({
  id: z.string().min(1, "شناسه پروژه الزامی است"),
  name: z.string().min(1, "نام پروژه الزامی است"),
  description: z.string().optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1, "نام الزامی است").optional(),
  familyName: z.string().min(1, "نام خانوادگی الزامی است").optional(),
  email: z
    .string()
    .trim()
    .email("ایمیل نامعتبر است")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(500, "آدرس نباید بیشتر از ۵۰۰ کاراکتر باشد").optional().or(z.literal("")),
  province: z.string().trim().max(100, "استان نامعتبر است").optional().or(z.literal("")),
  city: z.string().trim().max(100, "شهر نامعتبر است").optional().or(z.literal("")),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ تولد نامعتبر است")
    .optional()
    .or(z.literal("")),
  phoneNumber: z
    .string()
    .min(1, "شماره موبایل الزامی است")
    .regex(/^09\d{9}$/, "شماره موبایل نامعتبر است")
    .optional(),
  role: z.enum(["user", "admin"]).optional(),
  isActive: z.boolean().optional(),
  password: z
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .regex(/[A-Za-z]/, "رمز عبور باید حداقل شامل یک حرف باشد")
    .regex(/\d/, "رمز عبور باید حداقل شامل یک عدد باشد")
    .optional()
    .or(z.literal("")),
});

export const addUserSchema = z.object({
  name: z.string().min(1, "نام الزامی است"),
  familyName: z.string().min(1, "نام خانوادگی الزامی است"),
  phoneNumber: z
    .string()
    .min(1, "شماره موبایل الزامی است")
    .regex(/^09\d{9}$/, "شماره موبایل نامعتبر است"),
  password: z
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .regex(/[A-Za-z]/, "رمز عبور باید حداقل شامل یک حرف باشد")
    .regex(/\d/, "رمز عبور باید حداقل شامل یک عدد باشد"),
  role: z.enum(["user", "admin"]).default("user"),
});

export const validateUserUpdate = (data) => {
  try {
    userUpdateSchema.parse(data);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      message: error.errors?.[0]?.message || "داده‌های ورودی نامعتبر است",
    };
  }
};

export const validateAddUser = (data) => {
  try {
    addUserSchema.parse(data);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      message: error.errors?.[0]?.message || "داده‌های ورودی نامعتبر است",
    };
  }
};