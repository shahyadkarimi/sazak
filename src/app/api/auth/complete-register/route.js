import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validation";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const { name, familyName, phoneNumber, password } =
      registerSchema.parse(body);

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          registered: true,
          message: "شما قبلاً ثبت نام کرده اید است. لطفاً وارد شوید.",
        },
        { status: 200 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      familyName,
      phoneNumber,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        userId: newUser._id,
        phoneNumber: newUser.phoneNumber,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json(
      {
        success: true,
        registered: false,
        message: "ثبت نام با موفقیت انجام شد.",
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          familyName: newUser.familyName,
          fullName: newUser.name + " " + newUser.familyName,
          phoneNumber: newUser.phoneNumber,
          role: newUser.role,
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

    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام ثبت نام" },
      { status: 500 }
    );
  }
}
