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
  password: z
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .regex(/[A-Za-z]/, "رمز عبور باید حداقل شامل یک حرف باشد")
    .regex(/\d/, "رمز عبور باید حداقل شامل یک عدد باشد")
    .optional()
    .or(z.literal("")),
});

export const newProjectSchema = z.object({
  name: z.string().min(1, "نام پروژه الزامی است"),
  description: z.string().optional(),
});
