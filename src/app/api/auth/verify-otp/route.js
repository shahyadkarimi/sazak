import { NextResponse } from "next/server";
import { verifyOTPSchema } from "@/lib/validation";
import { createLog, LogActions } from "@/lib/logger";

export async function POST(req) {
  try {
    const body = await req.json();

    const { phoneNumber, code } = body;

    if (!code || code.trim() === "") {
      return NextResponse.json(
        { success: false, message: "کد فعال‌سازی الزامی است" },
        { status: 400 }
      );
    }

    const username = process.env.SMS_USERNAME;
    const password = process.env.SMS_PASSWORD;

    const formBody = new URLSearchParams({
      Username: username,
      Password: password,
      Mobile: phoneNumber,
      Code: code,
    });

    const response = await fetch("http://smspanel.trez.ir/CheckSendCode.ashx", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const otpResponse = await response.text();

    if (otpResponse === "false") {
      return NextResponse.json(
        { success: false, message: "کد فعال‌سازی اشتباه است" },
        { status: 400 }
      );
    }

    await createLog(LogActions.AUTH_VERIFY_OTP, {
      performedBy: {
        phoneNumber,
      },
      target: {
        type: "auth",
        phoneNumber,
      },
      metadata: {
        code,
        verificationSource: "sms",
      },
      request: req,
    });

    return NextResponse.json(
      { success: true, message: "کد فعال‌سازی معتبر است" },
      { status: 200 }
    );
  } catch (error) {
    console.error("SMS verification error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام بررسی کد فعال‌سازی" },
      { status: 500 }
    );
  }
}
