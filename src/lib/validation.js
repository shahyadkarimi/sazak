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
