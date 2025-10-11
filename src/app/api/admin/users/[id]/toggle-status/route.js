import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "توکن نامعتبر یا منقضی شده است" },
        { status: 401 }
      );
    }

    const requester = await User.findById(authUser.userId).lean();
    if (!requester || requester.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { success: false, message: "وضعیت نامعتبر است" },
        { status: 400 }
      );
    }

    // Prevent admin from deactivating themselves
    if (id === authUser.userId && !isActive) {
      return NextResponse.json(
        { success: false, message: "نمی‌توانید خودتان را غیرفعال کنید" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ 
      _id: id,
      deletedAt: null,
      isDeleted: { $ne: true }
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    await User.findByIdAndUpdate(id, { isActive });

    return NextResponse.json(
      {
        success: true,
        message: `کاربر ${isActive ? "فعال" : "غیرفعال"} شد`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin user toggle status error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام تغییر وضعیت کاربر" },
      { status: 500 }
    );
  }
}
