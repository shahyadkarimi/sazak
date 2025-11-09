import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function POST(req) {
  try {
    const body = await req.json();
    const token = body?.token;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "توکن ارسال نشده است" },
        { status: 400 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "توکن معتبر نیست" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set("impersonation_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
    });

    if (payload?.impersonatedBy) {
      response.cookies.set("impersonated", "true", {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60,
      });
    }

    return response;
  } catch (error) {
    console.error("Impersonation session error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام ذخیره‌سازی توکن ورود" },
      { status: 500 }
    );
  }
}

