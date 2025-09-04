import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validation";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const { phoneNumber, password } = loginSchema.parse(body);

    const user = await User.findOne({ phoneNumber })
      .select("-__v -password -deletedAt")
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "کاربری با این شماره موبایل یافت نشد",
        },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "رمز عبور خود را بررسی کنید",
          errors: [{ name: "passord", message: "رمز عبور اشتباه است" }],
        },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { userId: user._id, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json(
      {
        success: true,
        message: "ورود موفقیت‌آمیز بود",
        token,
        user: {
          fullName: user.name + " " + user.familyName,
          ...user,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error.name === "ZodError") {
      const formattedErrors = error.issues.map((issue) => ({
        name: issue.path.join("."),
        message: issue.message,
      }));

      return NextResponse.json(
        { success: false, errors: formattedErrors },
        { status: 400 }
      );
    }

    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام ورود به حساب کاربری" },
      { status: 500 }
    );
  }
}
