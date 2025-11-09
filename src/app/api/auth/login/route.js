import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validation";
import { createLog, LogActions } from "@/lib/logger";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const { phoneNumber, password } = loginSchema.parse(body);

    const user = await User.findOne({ phoneNumber })
      .select("-__v -deletedAt")
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

    await createLog(LogActions.USER_LOGIN, {
      performedBy: {
        userId: user._id,
        name: user.name,
        familyName: user.familyName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      target: {
        type: "user",
        userId: user._id.toString(),
        phoneNumber: user.phoneNumber,
      },
      metadata: {
        method: "password",
      },
      request: req,
    });

    return NextResponse.json(
      {
        success: true,
        message: "ورود موفقیت‌آمیز بود",
        token,
        user: {
          id: user._id,
          name: user.name,
          familyName: user.familyName,
          fullName: user.name + " " + user.familyName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
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
