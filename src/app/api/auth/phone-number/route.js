import connectDB from "@/lib/db";
import User from "@/models/User";
import { phoneSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const { phoneNumber } = phoneSchema.parse(body);

    const existingUser = await User.findOne({ phoneNumber });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          registered: true,
          message: "کاربر قبلاً ثبت نام کرده است. لطفاً وارد شوید.",
        },
        { status: 200 }
      );
    }

    const username = process.env.SMS_USERNAME;
    const password = process.env.SMS_PASSWORD;
    const footer = "sazakacademy.com";

    const formBody = new URLSearchParams({
      Username: username,
      Password: password,
      Mobile: phoneNumber,
      Footer: footer,
    });

    const response = await fetch("http://smspanel.trez.ir/AutoSendCode.ashx", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const otpResponse = await response.text();

    return NextResponse.json(
      {
        success: true,
        registered: false,
        message: "کد فعال‌سازی ارسال شد.",
        response: otpResponse,
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

    console.error("SMS error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام ارسال کد فعال‌سازی" },
      { status: 500 }
    );
  }
}
