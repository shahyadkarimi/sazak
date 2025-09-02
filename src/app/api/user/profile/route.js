import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();

    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "توکن نامعتبر یا منقضی شده است" },
        { status: 401 }
      );
    }
    const user = await User.findById(authUser.userId).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت پروفایل" },
      { status: 500 }
    );
  }
}
